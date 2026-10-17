#!/usr/bin/env python3
"""Tasks tool for the Telegram bot.

Adds /tarefa command for managing tasks (todo list, reminders).

Public surface:
    tasks_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and task details.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List

log = logging.getLogger(__name__)

_TASKS: Dict[str, Dict] = {}  # In-memory store: {task_id: task}

# Priority levels
_PRIORITY_LEVELS = ["baixa", "media", "alta", "urgente"]
_PRIORITY_COLORS = {
    "baixa": "🟢",
    "media": "🟡",
    "alta": "🟠",
    "urgente": "🔴",
}


def _parse_prompt(prompt: Optional[str] = None) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        add "<title>" "<description>" [--priority alta] [--due 2026-10-20]
        list [--today] [--all] [--pending] [--done]
        done "<task_id>"
        delete "<task_id>"
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _parse_task_list_args(args: str) -> dict:
    """Parse task list arguments."""
    filter_args = {
        "today": False,
        "all": True,
        "pending": False,
        "done": False,
    }
    if "--today" in args:
        filter_args["today"] = True
        args = args.replace("--today", "").strip()
    if "--all" in args:
        filter_args["all"] = True
        args = args.replace("--all", "").strip()
    if "--pending" in args:
        filter_args["pending"] = True
        args = args.replace("--pending", "").strip()
    if "--done" in args:
        filter_args["done"] = True
        args = args.replace("--done", "").strip()
    return filter_args, args


def _add_task(args: str) -> tuple[bool, str]:
    """Add a task from args string."""
    # Remove leading/trailing quotes from the title
    task_match = re.match(r'"([^"]+)"(?:\s+(?:--priority\s+(\w+))?)?(?:\s+(?:--due\s+([^"\s]+))?)?', args)
    if not task_match:
        return False, "Formato inválido. Use: /tarefa add \"Tarefa\" \"Descrição\""

    title = task_match.group(1)
    priority = task_match.group(2) or "media"
    due_date = task_match.group(3) or ""

    import datetime as _dt
    due = None
    if due_date:
        try:
            due = _dt.datetime.strptime(due_date, "%Y-%m-%d")
        except ValueError:
            due = _dt.datetime.now() + timedelta(days=7)

    task_id = str(uuid.uuid4())[:8]
    now_str = _dt.datetime.now().strftime("%d/%m/%Y %H:%M")
    task = {
        "id": task_id,
        "title": title,
        "description": task_match.group(2) or "",
        "priority": priority if priority in _PRIORITY_LEVELS else "media",
        "due": due.strftime("%d/%m/%Y") if due else "",
        "done": False,
        "created": now_str,
    }

    _TASKS[task_id] = task
    return True, task_id


def _list_tasks(args: str) -> list[dict]:
    """List tasks based on filter args."""
    filter_args, _ = _parse_task_list_args(args)
    tasks = []

    for task in _TASKS.values():
        if filter_args["today"] and task["due"] and task["due"] != datetime.now().strftime("%d/%m/%Y"):
            continue
        if filter_args["pending"] and task["done"]:
            continue
        if filter_args["done"] and not task["done"]:
            continue
        if filter_args["all"]:
            tasks.append(task)

    # If no filter, return all tasks
    if not any(filter_args.values()):
        tasks = list(_TASKS.values())

    return sorted(tasks, key=lambda t: t["created"], reverse=True)


def _mark_done(task_id: str) -> tuple[bool, str]:
    """Mark a task as done."""
    if task_id in _TASKS:
        _TASKS[task_id]["done"] = True
        return True, f"Tarefa '{task_id}' marcada como concluída."
    return False, f"Tarefa '{task_id}' não encontrada."


def _delete_task(task_id: str) -> tuple[bool, str]:
    """Delete a task."""
    if task_id in _TASKS:
        del _TASKS[task_id]
        return True, f"Tarefa '{task_id}' removida."
    return False, f"Tarefa '{task_id}' não encontrada."


def _format_task(task: dict) -> str:
    """Format a task for display."""
    status = "✓" if task["done"] else "○"
    priority = _PRIORITY_COLORS.get(task["priority"], "⚪")
    due = f" 📅{task['due']}" if task["due"] else ""
    return f"{status} [{priority}] {task['title']}{due}"


def _format_tasks(tasks: list[dict]) -> str:
    """Format a list of tasks."""
    if not tasks:
        return "Nenhuma tarefa encontrada."

    lines = []
    for task in tasks:
        lines.append(_format_task(task))
    return "\n".join(lines)


def tasks_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the tasks operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /tarefa add, /tarefa list, /tarefa done, /tarefa delete"
        })

    if action == "add":
        success, task_id = _add_task(args)
        if success:
            return json.dumps({
                "success": True,
                "task_id": task_id,
                "message": "Tarefa adicionada com sucesso!",
            })
        return json.dumps({"success": False, "error": result})

    elif action == "list":
        tasks = _list_tasks(args)
        if tasks:
            formatted = []
            for task in tasks[:20]:
                formatted.append({
                    "id": task["id"],
                    "title": task["title"],
                    "description": task["description"],
                    "priority": task["priority"],
                    "due": task["due"],
                    "done": task["done"],
                })
            return json.dumps({
                "success": True,
                "count": len(formatted),
                "tasks": formatted,
            })
        return json.dumps({"success": True, "count": 0, "tasks": []})

    elif action == "done":
        if not args:
            return json.dumps({"success": False, "error": "Use: /tarefa done <task_id>"})
        task_id = args.split()[0]
        success, message = _mark_done(task_id)
        return json.dumps({"success": success, "message": message})

    elif action == "delete":
        if not args:
            return json.dumps({"success": False, "error": "Use: /tarefa delete <task_id>"})
        task_id = args.split()[0]
        success, message = _delete_task(task_id)
        return json.dumps({"success": success, "message": message})

    return json.dumps({"success": False, "error": f"Ação desconhecida: {action}"})
