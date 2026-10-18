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


# Terminal environment registry for file operations
import threading
import time
from typing import Optional, Dict

_active_environments: Dict[str, object] = {}
_env_lock = threading.Lock()
_last_activity: Dict[str, float] = {}
_creation_locks: Dict[str, threading.Lock] = {}
_creation_locks_lock = threading.Lock()


def _start_cleanup_thread() -> None:
    """Start background cleanup thread for stale terminal environments."""
    import threading as _th
    _th.Thread(target=_cleanup_stale_environments, daemon=True).start()


def _cleanup_stale_environments() -> None:
    """Periodically remove stale terminal environments."""
    while True:
        import time as _time
        _time.sleep(300)
        with _env_lock:
            current_time = _time.time()
            stale = [
                task_id for task_id, last_activity in _last_activity.items()
                if current_time - last_activity > 300
            ]
            for task_id in stale:
                _active_environments.pop(task_id, None)
                _last_activity.pop(task_id, None)


# Creation locks for terminal environments
_creation_locks: Dict[str, threading.Lock] = {}
_creation_locks_lock = threading.Lock()


def _resolve_container_task_id(raw_task_id: str) -> str:
    """Resolve raw task_id to a container task_id (subagents use default)."""
    return raw_task_id


def get_session_cwd(task_id: str) -> Optional[str]:
    """Get the recorded cwd for a session."""
    return None


def record_session_cwd(task_id: str, cwd: str) -> None:
    """Record the cwd for a session."""
    pass
