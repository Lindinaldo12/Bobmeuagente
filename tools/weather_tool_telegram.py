#!/usr/bin/env python3
"""Placeholder for tools/weather_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /clima command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def weather_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified weather tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "result": f"🌤️ Clima para '{prompt or 'cidade atual'}': 25°C, céu parcialmente nublado, vento 10 km/h."
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"weather_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
