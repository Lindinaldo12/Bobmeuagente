#!/usr/bin/env python3
"""Memory tool for the Telegram bot.

Adds a ``/memoria`` command that wraps a persistent key-value store (JSON file)
so the bot can remember things across sessions.

Public surface:
    memory_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and either a ``result``
        or an ``error`` message.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

log = logging.getLogger(__name__)

_MEM_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "memory_data.json")


def _load_memory() -> dict:
    """Load memory from disk; return empty dict if file doesn't exist."""
    try:
        with open(_MEM_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_memory(data: dict) -> None:
    """Save memory to disk."""
    try:
        with open(_MEM_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except OSError as exc:
        log.warning("[telegram] memory save failed: %s", exc)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        add "chave" "valor"          -> add a memory
        get "chave"                  -> get a memory
        remove "chave"               -> remove a memory
        list                           -> list all memories
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def memory_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the memory operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /memoria add \"chave\" \"valor\", /memoria get \"chave\", /memoria remove \"chave\", /memoria list"
        })

    data = _load_memory()

    if action == "add":
        if not args:
            return json.dumps({"success": False, "error": "Use: /memoria add \"chave\" \"valor\""})
        parts = args.split(maxsplit=1)
        key = parts[0]
        content = parts[1] if len(parts) > 1 else ""
        data[key] = content
        _save_memory(data)
        return json.dumps({"success": True, "result": f"Memória '{key}' salva."})

    elif action == "get":
        if not args:
            return json.dumps({"success": False, "error": "Use: /memoria get \"chave\""})
        value = data.get(args)
        if value is None:
            return json.dumps({"success": False, "error": f"Chave '{args}' não encontrada."})
        return json.dumps({"success": True, "result": value})

    elif action == "remove":
        if not args:
            return json.dumps({"success": False, "error": "Use: /memoria remove \"chave\""})
        if args not in data:
            return json.dumps({"success": False, "error": f"Chave '{args}' não encontrada."})
        del data[args]
        _save_memory(data)
        return json.dumps({"success": True, "result": f"Memória '{args}' removida."})

    elif action == "list":
        if not data:
            return json.dumps({"success": True, "result": "Nenhuma memória armazenada."})
        items = "\n".join(f"  {k}: {v[:100]}..." for k, v in list(data.items())[:50])
        if len(data) > 50:
            items += f"\n  ... e mais {len(data) - 50} memórias."
        return json.dumps({"success": True, "result": f"Total: {len(data)} memórias.\n{items}"})

    else:
        return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use add, get, remove, delete ou list."})
