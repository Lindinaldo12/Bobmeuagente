#!/usr/bin/env python3
"""Web search / content extraction for the Telegram bot.

Adds ``/buscar`` (search the web) and ``/extrair`` (extract page content) commands
that route through the Hermes web tools (firecrawl / tavily / exa / parallel /
searxng) so the bot can answer with real-world, cited information instead of
only model memory.

Public surface: ``web_tool_tool(prompt: Optional[str] = None) -> str`` returns a
JSON string with ``success``/``error`` and either a ``results`` payload or an
``error`` message. Callers (the Telegram adapter) consume it uniformly.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

# Common separators: "buscar termo" or "buscar site.com" or "buscar termo | site.com".
_SEARCH_RE = re.compile(r"^(buscar|pesquisar|pesquisa)\s+(.+)$", re.IGNORECASE)

# Optional provider hint right after the verb: "buscar tavily termo".
_HINT_RE = re.compile(r"^(buscar|pesquisar|pesquisa)\s+(tavily|firecrawl|exa|parallel|searxng)\s+(.+)$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], Optional[str], str]:
    """Return ``(query, provider_hint, final_prompt)``.

    * query — what to search for (lowercase, trimmed)
    * provider_hint — from the user, or ``None`` (let the tool auto-detect)
    * final_prompt — the raw, trimmed user text (kept for rendering)
    """
    if not prompt:
        return None, None, ""
    prompt = prompt.strip()
    hint = None
    m = _HINT_RE.match(prompt)
    if m:
        hint = m.group(2).lower()
        query = m.group(3).strip()
    else:
        m2 = _SEARCH_RE.match(prompt)
        if m2:
            query = m2.group(2).strip()
        else:
            return None, None, ""
    return query, hint, prompt


def web_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the search result.

    Result shape on success::

        {
          "success": true,
          "results": [
            {
              "title": "Page title",
              "url": "https://example.com",
              "snippet": "First 200 chars of the page content",
              "confidence": 0.9,
              "source": "tavily"
            }
          ],
          "count": 3,
          "query": "termo"
        }

    Result shape on failure::

        {
          "success": false,
          "error": "Backend not configured. Add a search key (e.g. FIREBASE/TAIVILY) to your .env."
        }
    """
    query, hint, _ = _parse_prompt(prompt)
    if not query:
        return json.dumps({"success": False, "error": "Use: /buscar termo ou /buscar [tavily|firecrawl|exa|parallel|searxng] termo"})

    try:
        # Lazy import so we don't drag heavy deps at cold start unless needed.
        from tools import web_tools as wt

        # Route to the right tool based on the hint.
        if hint in {"tavily", "firecrawl", "exa", "parallel", "searxng"}:
            tool_name = f"web_{hint}_tool"
            if not hasattr(wt, tool_name):
                return json.dumps({"success": False, "error": f"O provedor {hint} não está disponível no Hermes atual."})
            return getattr(wt, tool_name)(query)
        # Default: auto-detect.
        return wt.web_search_tool(query)
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] web search failed: %s", exc)
        return json.dumps({"success": False, "error": f"Não foi possível buscar: {exc}"})
