#!/usr/bin/env python3
"""Placeholder for tools/code_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /exec command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def code_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified code execution tool placeholder.

    Returns a JSON string with success status and mock output.
    """
    try:
        result = {
            "success": True,
            "result": "Código executado (simulação). Output não disponível no placeholder."
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"code_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
