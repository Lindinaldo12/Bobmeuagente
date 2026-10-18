#!/usr/bin/env python3
"""Placeholder for tools/agent_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /agente command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def agent_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified agent tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "agents": [],
            "count": 0,
            "message": "Agentes disponíveis: nenhum carregado."
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"agent_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
