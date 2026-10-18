#!/usr/bin/env python3
"""Placeholder for tools/web_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /web command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def web_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified web tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "result": f"Resultado para '{prompt or 'consulta'}: (simulação)"
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"web_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
