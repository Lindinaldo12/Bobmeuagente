#!/usr/bin/env python3
"""Placeholder for tools/video_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /gerar_video command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def video_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified video generation tool placeholder.

    Returns a JSON string with success status and mock video URL.
    """
    try:
        result = {
            "success": True,
            "video_url": "https://example.com/video_placeholder.mp4",
            "message": "Vídeo gerado (simulação)"
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"video_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
