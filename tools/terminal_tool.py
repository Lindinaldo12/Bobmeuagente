#!/usr/bin/env python3
"""Terminal tool for the Telegram bot.

This module provides terminal command execution functionality.
"""

from __future__ import annotations

import logging
import subprocess
from typing import Optional

log = logging.getLogger(__name__)


# Global approval callback - set by other modules to handle approvals
_approval_callback = None


def set_approval_callback(callback):
    """Set the approval callback for terminal commands.

    Args:
        callback: A function that takes a command and returns a boolean.
    """
    global _approval_callback
    _approval_callback = callback


def run_command(command: str, timeout: int = 30) -> str:
    """Run a terminal command.
    
    Args:
        command: The command to run.
        timeout: Maximum time to wait for the command to complete.
        
    Returns:
        The command output.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        if result.returncode == 0:
            return result.stdout or "Comando executado com sucesso."
        else:
            return f"Erro (código {result.returncode}): {result.stderr or 'Erro desconhecido'}"
    except subprocess.TimeoutExpired:
        return "Erro: o comando excedeu o tempo limite."
    except Exception as exc:
        log.warning("[telegram] terminal_tool error: %s", exc)
        return f"Erro ao executar comando: {exc}"
