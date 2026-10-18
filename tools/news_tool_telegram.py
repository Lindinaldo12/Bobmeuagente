#!/usr/bin/env python3
"""Placeholder for tools/news_tool_telegram.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /noticias command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def news_tool_tool(prompt: Optional[str] = None) -> str:
    """Simplified news tool placeholder.

    Returns a JSON string with success status and mock news data.
    """
    try:
        result = {
            "success": True,
            "results": [
                {"title": "Título da Notícia 1", "link": "#", "snippet": "Resumo da notícia 1"},
                {"title": "Título da Notícia 2", "link": "#", "snippet": "Resumo da notícia 2"},
            ]
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"news_tool_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
