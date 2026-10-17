#!/usr/bin/env python3
"""Skills tool for the Telegram bot.

Adds a ``/skill`` command that lists the Hermes Agent skills and views skill
content. Skills are directories with a ``SKILL.md`` file (YAML frontmatter +
instructions) plus optional references/, templates/, assets/, scripts/.

Public surface:
    skills_list_tool(category=None) -> str   # JSON list of skills
    skills_view_tool(name) -> str             # JSON full skill content
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_SKILL_RE = re.compile(r"^(skill|skill_list|list_skills|mostrar_habilidades|habilidades)\s*(.*)$", re.IGNORECASE)
_VIEW_RE = re.compile(r"^(skill_view|ver_habilidade|ver_skill|v)\s+(.+)$", re.IGNORECASE)


def skills_list_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the skills list or a single skill's content.

    Result shape on listing::

        {
          "success": true,
          "skills": [{"name": "skill-name", "description": "...", "category": "productivity", "file": "skills/productivity/skill-name/SKILL.md"}],
          "categories": ["productivity", "research", "web"],
          "count": 50
        }

    Result shape on view::

        {
          "success": true,
          "name": "skill-name",
          "frontmatter": {...},
          "content": "# SKILL.md\n...",
          "files": ["references/x.md", "templates/y.md"]
        }
    """
    if not prompt:
        return _list_response()
    prompt = prompt.strip().lower()

    # /skill view "nome" or /skill_view "nome"
    m = re.match(r"^(ver|view|skill_view|mostrar|habilidade)\s+(.+)$", prompt)
    if m:
        return _view_skill(m.group(2).strip())

    # /skill list or /skill (no args)
    if prompt in {"", "list", "lista", "all", "tudo"}:
        return _list_response()

    # /skill "nome" or /skill "categoria:nome"
    return _view_skill(prompt)


def _list_response() -> str:
    """Return a JSON response with the skills list (simulated; full impl via hermes tools)."""
    try:
        # Try to import the actual hermes skills tool for real data.
        from tools import skills_tool as st
        # Call skills_list with no args (list all).
        return st.skills_list()
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] skills list failed: %s", exc)
        return json.dumps({"success": False, "error": f"Skills listing failed: {exc}"})


def _view_skill(name: str) -> str:
    """Return a JSON response with a single skill's content."""
    try:
        from tools import skills_tool as st
        return st.skill_view(name)
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] skill view failed: %s", exc)
        return json.dumps({"success": False, "error": f"Skill lookup failed: {exc}"})


def skills_tool_tool(prompt: Optional[str] = None) -> str:
    """Main entry point for the skills command."""
    if prompt is None or prompt.strip() == "":
        return _list_response()
    return _view_skill(prompt.strip())
