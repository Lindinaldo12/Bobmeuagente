#!/usr/bin/env python3
"""File operations tool for the Telegram bot.

Adds a ``/arquivo`` command that wraps the Hermes file operations tool
(read_file, write_file, list_directory, search_files).

Public surface:
    file_tool_tool(prompt: Optional[str] = None) -> str
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_FILE_RE = re.compile(r"^arquivo\s+(.+)$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``."""
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def file_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the file operation result.

    Supported actions:
        /arquivo read <path>             - read a file
        /arquivo write <path> "<content>" - write a file
        /arquivo list <dir>              - list a directory
        /arquivo search <pattern> <path> - search for a pattern
    """
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /arquivo read <caminho>, /arquivo write <caminho> \"conteudo\", /arquivo list <diretorio>, /arquivo search <padrao> <caminho>"
        })

    try:
        # Lazy import to keep cold start light.
        from tools import file_tools as ft

        if action in {"read", "ler", "le"}:
            # read is a keyword; check manually
            if action == "read":
                return ft.read_file_tool(args) if args else json.dumps({"success": False, "error": "Use: /arquivo read <caminho>"})
        elif action in {"write", "escrever", "gravar"}:
            if not args:
                return json.dumps({"success": False, "error": "Use: /arquivo write <caminho> \"conteudo\""})
            # Split args into path and content (content is after the first quoted string)
            # Simple approach: assume args contains path and content separated by a space, but content may have spaces.
            # We'll use quote detection:
            if '"' in args or "'" in args:
                # Find the path (up to the opening quote) and the content (between quotes)
                # This is simplified: assume format: path "content"
                import re as _re
                m = _re.match(r'^(\S+)\s+["\'](.+?)["\']$', args, _re.DOTALL)
                if m:
                    path = m.group(1)
                    content = m.group(2)
                    return ft.write_file_tool(path, content)
                else:
                    return json.dumps({"success": False, "error": "Formato inválido. Use: /arquivo write <caminho> \"conteudo\""})
            else:
                return json.dumps({"success": False, "error": "Use: /arquivo write <caminho> \"conteudo\""})
        elif action in {"list", "ls", "dir"}:
            if not args:
                return json.dumps({"success": False, "error": "Use: /arquivo list <diretorio>"})
            return ft.list_directory_tool(args) if hasattr(ft, "list_directory_tool") else json.dumps({"success": False, "error": "list_directory_tool não disponível"})
        elif action in {"search", "buscar", "procura"}:
            parts = args.split(maxsplit=1)
            if len(parts) < 2:
                return json.dumps({"success": False, "error": "Use: /arquivo search <padrao> <caminho>"})
            pattern = parts[0]
            path = parts[1]
            return ft.search_files_tool(pattern, path) if hasattr(ft, "search_files_tool") else json.dumps({"success": False, "error": "search_files_tool não disponível"})
        else:
            return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use read, write, list ou search."})
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] file tool failed: %s", exc)
        return json.dumps({"success": False, "error": f"Falha na operação: {exc}"})
