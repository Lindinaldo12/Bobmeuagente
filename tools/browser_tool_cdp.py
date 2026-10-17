#!/usr/bin/env python3
"""Browser tool CDP (Chrome DevTools Protocol) stub.

This module is required for backward compatibility with the Telegram adapter.
"""

from __future__ import annotations

import logging
from typing import Optional

log = logging.getLogger(__name__)


def get_player() -> str:
    """Get the browser player."""
    return "default"


def launch_browser() -> str:
    """Launch a browser session."""
    return "browser_session_id"


def close_browser(session_id: str) -> None:
    """Close a browser session."""
    pass
