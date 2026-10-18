#!/usr/bin/env python3
"""Placeholder for tools/currency_tool.py.

This module is required by plugins/platforms/telegram/adapter.py
for the /cotação command. It is a stub that returns a simple JSON response.
"""
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def currency_quote_tool(prompt: Optional[str] = None) -> str:
    """Simplified currency quote tool placeholder.

    Returns a JSON string with success status and mock data.
    """
    try:
        result = {
            "success": True,
            "quote": f"Cotação de '{prompt or 'USD'}': R$ 5,20 (dados simulados)"
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        log.error(f"currency_quote_tool error: {e}")
        return json.dumps({"success": False, "error": str(e)})
