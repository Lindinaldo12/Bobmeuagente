#!/usr/bin/env python3
"""Placeholder for tools/tasks_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /tarefa command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def tasks_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified tasks tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "tasks": [],
            "message": "Nenhuma tarefa cadastrada."
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"tasks_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
