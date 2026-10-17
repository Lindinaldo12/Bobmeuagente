#!/usr/bin/env python3
"""Web content retrieval tool for the Telegram bot.

Adds a /web command that fetches and extracts content from URLs.

Public surface:
    web_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.request
import urllib.parse
from typing import Optional

log = logging.getLogger(__name__)

_WEB_RE = re.compile(r"^web\s+(.+)$", re.IGNORECASE)

# User-agent header to use for requests (avoid 403 on some sites)
USER_AGENT = "Mozilla/5.0 (compatible; Bob/1.0; +https://github.com/Lindinaldo12/Bobmeuagente)"


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        fetch "<url>"                  -> fetch URL content
        extract "<url>"                -> extract readable text from URL
        open "<url>"                   -> open URL in browser
        search "<query>"               -> web search (uses web_search_tool)
        buscar "<query>"               -> web search (alias for search)
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    # Map "buscar" and "pesquisar" to "search"
    if action in {"buscar", "pesquisar", "pesquisa"}:
        return "search", args
    return action, args


def _fetch_url(url: str, timeout: int = 15) -> tuple[bool, str]:
    """Fetch a URL and return (success, content)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            charset = "utf-8"
            # Try to detect charset from Content-Type
            if "charset=" in content_type:
                charset = content_type.split("charset=")[1].strip()
            body = response.read()
            # Try to decode with detected charset, fallback to utf-8
            try:
                text = body.decode(charset)
            except (UnicodeDecodeError, LookupError):
                text = body.decode("utf-8", errors="replace")
            return True, text
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] fetch URL failed: %s", exc)
        return False, f"Error fetching URL: {exc}"


def _extract_text(text: str, max_chars: int = 4000) -> str:
    """Extract readable text from HTML or plain text."""
    # Remove HTML tags
    import re as _re
    text = _re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=_re.DOTALL | _re.IGNORECASE)
    text = _re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=_re.DOTALL | _re.IGNORECASE)
    text = _re.sub(r"<[^>]+>", " ", text)
    text = _re.sub(r"\s+", " ", text)
    text = text.strip()
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    return text


def web_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the web operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /web fetch <url>, /web extract <url>, /web open <url>, /web search <query>"
        })

    try:
        if action == "fetch":
            if not args:
                return json.dumps({"success": False, "error": "Use: /web fetch <url>"})
            success, content = _fetch_url(args)
            if success:
                return json.dumps({
                    "success": True,
                    "result": content[:5000],
                    "url": args,
                    "length": len(content),
                })
            else:
                return json.dumps({"success": False, "error": content})

        elif action == "extract":
            if not args:
                return json.dumps({"success": False, "error": "Use: /web extract <url>"})
            success, content = _fetch_url(args)
            if success:
                extracted = _extract_text(content)
                return json.dumps({
                    "success": True,
                    "result": extracted,
                    "url": args,
                    "length": len(extracted),
                })
            else:
                return json.dumps({"success": False, "error": content})

        elif action == "open":
            if not args:
                return json.dumps({"success": False, "error": "Use: /web open <url>"})
            import webbrowser
            try:
                webbrowser.open(args)
                return json.dumps({"success": True, "result": f"Opening {args} in browser..."})
            except Exception as exc:
                return json.dumps({"success": False, "error": f"Could not open browser: {exc}"})

        elif action == "search":
            if not args:
                return json.dumps({"success": False, "error": "Use: /web search <query>"})
            # Delegate to web_search_tool with "buscar" prefix
            from tools import web_search_tool as wst
            return wst.web_tool_tool(f"buscar {args}")

        else:
            return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use fetch, extract, open ou search."})

    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] web tool failed: %s", exc)
        return json.dumps({"success": False, "error": f"Falha: {exc}"})
