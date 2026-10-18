#!/usr/bin/env python3
"""Placeholder for tools/flashcards_tool.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /flashcards command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def flashcards_tool(prompt: Optional[str] = None) -> str:
    """Simplified flashcards tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "cards": [],
            "message": "Flashcards disponíveis: nenhum criado ainda."
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"flashcards_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
