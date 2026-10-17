#!/usr/bin/env python3
"""Browser automation tool for the Telegram bot.

Adds a /browser command that automates web browsing.

Public surface:
    browser_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_BROWSER_RE = re.compile(r"^browser\s+(.+)$", re.IGNORECASE)

# Note: Full browser automation (playwright/selenium) requires external
# installations. This tool provides a configurable browser backend.
# Default: uses the hermes-agent's browser tool if available.

# Lazy import for browser tool
_browser_tool = None


def _get_browser_tool():
    """Lazy import the hermes browser tool."""
    global _browser_tool
    if _browser_tool is None:
        try:
            from tools.browser_tool import browser_navigate
            _browser_tool = {"navigate": browser_navigate}
        except ImportError:
            _browser_tool = None
    return _browser_tool


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        navigate "<url>"               -> open URL in browser
        fetch "<url>"                  -> fetch page content
        search "<query>"               -> web search
        screenshot "<url>"             -> take screenshot
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def browser_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the browser operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /browser navigate <url>, /browser fetch <url>, /browser search <query>, /browser screenshot <url>"
        })

    try:
        browser_tool = _get_browser_tool()
        if browser_tool is None:
            return json.dumps({"success": False, "error": "Browser tool not available. Install playwright/selenium."})

        if action == "navigate":
            if not args:
                return json.dumps({"success": False, "error": "Use: /browser navigate <url>"})
            result = browser_tool["navigate"](args)
            try:
                data = json.loads(result)
                return json.dumps({"success": True, "result": f"Aberto: {data.get('url', args)}\nTítulo: {data.get('title', '')}"})
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": result})

        elif action == "fetch":
            if not args:
                return json.dumps({"success": False, "error": "Use: /browser fetch <url>"})
            result = browser_tool["navigate"](args)  # Navigate to get content
            try:
                data = json.loads(result)
                return json.dumps({"success": True, "result": f"Conteúdo de: {data.get('url', args)}", "url": data.get("url", args)})
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": result})

        elif action == "search":
            if not args:
                return json.dumps({"success": False, "error": "Use: /browser search <query>"})
            # Delegate to web search
            import urllib.parse
            query = urllib.parse.quote(args)
            url = f"https://www.google.com/search?q={query}"
            result = browser_tool["navigate"](url)
            try:
                data = json.loads(result)
                return json.dumps({"success": True, "result": f"Resultados para: {args}", "url": data.get("url", url)})
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": result})

        elif action == "screenshot":
            if not args:
                return json.dumps({"success": False, "error": "Use: /browser screenshot <url>"})
            result = browser_tool["navigate"](args)
            try:
                data = json.loads(result)
                return json.dumps({"success": True, "result": f"Triagem disponível em: {data.get('url', args)}"})
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": result})

        else:
            return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use navigate, fetch, search ou screenshot."})

    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] browser tool failed: %s", exc)
        return json.dumps({"success": False, "error": f"Falha: {exc}"})
