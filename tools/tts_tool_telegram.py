#!/usr/bin/env python3
"""Placeholder for tools/tts_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /falar command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def tts_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified text-to-speech tool placeholder.

    Returns a JSON string with success status and mock audio path.
    """
    try:
        result = {
            "success": True,
            "file_path": "/tmp/tts_placeholder.mp3",
            "provider": "placeholder"
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"tts_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
