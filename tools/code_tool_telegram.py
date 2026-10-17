#!/usr/bin/env python3
"""Code execution tool for the Telegram bot.

Adds a ``/exec`` command that runs code in a sandboxed Python subprocess.

Public surface:
    code_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and either a ``result``
        or an ``error`` message.
"""

from __future__ import annotations

import json
import logging
import re
import subprocess
import tempfile
import os
from typing import Optional

log = logging.getLogger(__name__)

_CODE_RE = re.compile(r"^exec\s+(.+)$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        run "<código>"                 -> run code and return output
        help                           -> show help
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def code_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the code execution result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /exec run \"<código>\" ou /exec help"
        })

    if action == "help":
        return json.dumps({
            "success": True,
            "result": (
                "Execução de código (sandbox) — /exec run \"<código>\"\n"
                "Exemplo: /exec run \"print('Olá, mundo!')\"\n"
                "Atenção: execução em sandbox, limitada a tempo e recursos."
            ),
        })

    if action != "run":
        return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use run ou help."})

    if not args:
        return json.dumps({"success": False, "error": "Use: /exec run \"<código>\""})

    # Sanitize: only allow Python code, limit length
    code = args[:2000]  # 2KB limit
    if len(args) > 2000:
        code += "\n... (truncado para 2000 caracteres)"

    try:
        # Run in a subprocess with a timeout
        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True,
            text=True,
            timeout=10,  # 10 second timeout
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )

        output = result.stdout or ""
        errors = result.stderr or ""
        success = result.returncode == 0

        if not success and not output:
            output = errors

        return json.dumps({
            "success": success,
            "result": output,
            "errors": errors,
            "returncode": result.returncode,
        })

    except subprocess.TimeoutExpired:
        return json.dumps({"success": False, "error": "Execução demorou mais de 10 segundos. Tente um código menor."})
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] code execution failed: %s", exc)
        return json.dumps({"success": False, "error": f"Falha: {exc}"})
