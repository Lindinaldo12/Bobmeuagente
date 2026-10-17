#!/usr/bin/env python3
"""Task scheduler tool for the Telegram bot.

Adds a /cron command that manages scheduled tasks (cron jobs).

Public surface:
    cron_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_CRON_RE = re.compile(r"^cron\s+(.+)$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        list                             -> list all scheduled jobs
        add "<name>" "<schedule>" "<command>" -> add a scheduled job
        remove "<name>"                  -> remove a scheduled job
        run "<name>"                      -> run a job immediately
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _parse_add(args: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Parse add args: name schedule command."""
    if not args:
        return None, None, None
    parts = args.split(maxsplit=2)
    if len(parts) < 3:
        return None, None, None
    return parts[0], parts[1], parts[2]


def _parse_remove(args: str) -> Optional[str]:
    """Parse remove args: name."""
    if not args:
        return None
    return args


def _parse_run(args: str) -> Optional[str]:
    """Parse run args: name."""
    if not args:
        return None
    return args


def _job_file() -> str:
    """Return the cron jobs file path."""
    import os
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "cron_jobs.json")


def _load_jobs() -> dict:
    """Load cron jobs from disk."""
    import os
    try:
        with open(_job_file(), "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_jobs(jobs: dict) -> None:
    """Save cron jobs to disk."""
    import os
    try:
        with open(_job_file(), "w", encoding="utf-8") as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)
    except OSError as exc:
        log.warning("[telegram] cron save failed: %s", exc)


def cron_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the cron operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /cron list, /cron add \"<name>\" \"<schedule>\" \"<command>\", /cron remove \"<name>\", /cron run \"<name>\""
        })

    jobs = _load_jobs()

    if action == "list":
        if not jobs:
            return json.dumps({"success": True, "result": "Nenhum cron agendado."})
        lines = []
        for name, spec in jobs.items():
            lines.append(f"  {name}: {spec}")
        return json.dumps({"success": True, "result": f"Total: {len(jobs)} jobs.\n" + "\n".join(lines)})

    elif action == "add":
        name, schedule, command = _parse_add(args)
        if not name or not schedule or not command:
            return json.dumps({"success": False, "error": "Use: /cron add \"<name>\" \"<schedule>\" \"<command>\""})
        if name in jobs:
            return json.dumps({"success": False, "error": f"Job '{name}' já existe."})
        jobs[name] = {"schedule": schedule, "command": command}
        _save_jobs(jobs)
        return json.dumps({"success": True, "result": f"Cron '{name}' adicionado."})

    elif action == "remove":
        name = _parse_remove(args)
        if not name:
            return json.dumps({"success": False, "error": "Use: /cron remove \"<name>\""})
        if name not in jobs:
            return json.dumps({"success": False, "error": f"Job '{name}' não encontrado."})
        del jobs[name]
        _save_jobs(jobs)
        return json.dumps({"success": True, "result": f"Cron '{name}' removido."})

    elif action == "run":
        name = _parse_run(args)
        if not name:
            return json.dumps({"success": False, "error": "Use: /cron run \"<name>\""})
        if name not in jobs:
            return json.dumps({"success": False, "error": f"Job '{name}' não encontrado."})
        spec = jobs[name]
        # Run the command in a subprocess
        import subprocess
        try:
            result = subprocess.run(
                spec["command"],
                shell=True,
                capture_output=True,
                text=True,
                timeout=60,
            )
            output = result.stdout or result.stderr or ""
            success = result.returncode == 0
            return json.dumps({
                "success": success,
                "result": output,
                "returncode": result.returncode,
            })
        except Exception as exc:
            return json.dumps({"success": False, "error": f"Falha ao executar: {exc}"})

    else:
        return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use list, add, remove ou run."})
