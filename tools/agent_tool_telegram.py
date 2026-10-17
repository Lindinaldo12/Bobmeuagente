#!/usr/bin/env python3
"""Agent tool for the Telegram bot.

Adds an ``/agente`` command that lets the user switch between different agent
personalities (programador, analista, pesquisador, professor, estrategista, etc.)

Each agent has a different role/persona that changes how the bot responds to
questions.

Public surface:
    agent_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_AGENT_RE = re.compile(r"^agente\s+(.+)$", re.IGNORECASE)

# Agent definitions: each agent has a name, description, and system prompt.
AGENTS = {
    "programador": {
        "name": "Programador",
        "description": "Especialista em código, desenvolvimento e solução de problemas técnicos",
        "prompt": "Você é um programador senior experiente em resolução de problemas técnicos. Foque em código, arquitetura, debug e boas práticas. Seja preciso, técnico e prático.",
    },
    "analista": {
        "name": "Analista",
        "description": "Análise de dados, relatórios e estruturação de informações",
        "prompt": "Você é um analista experiente. Foque em organizar informações, identificar padrões, criar relatórios e estruturar dados de forma clara e objetiva.",
    },
    "pesquisador": {
        "name": "Pesquisador",
        "description": "Pesquisa, exploração de temas e geração de conteúdo informativo",
        "prompt": "Você é um pesquisador dedicado. Foque em explorar temas, fornecer informações detalhadas, fontes e análise crítica de tópicos.",
    },
    "professor": {
        "name": "Professor",
        "description": "Explica conceitos complexos de forma didática e acessível",
        "prompt": "Você é um professor experiente. Foque em explicar conceitos de forma didática, usem exemplos, evitem jargão desnecessário e se adaptem ao nível do aluno.",
    },
    "estrategista": {
        "name": "Estrategista",
        "description": "Planejamento, decisões e visão de longo prazo",
        "prompt": "Você é um estrategista experiente. Foque em planejamento, decisões, visão de longo prazo e análise de cenários.",
    },
    "diretor": {
        "name": "Diretor",
        "description": "Visão ampla, liderança e coordenação de múltiplos aspectos",
        "prompt": "Você é um diretor experiente. Foque em visão ampla, coordenação, priorização e tomada de decisões estratégicas.",
    },
    "janeiro": {
        "name": "Janeiro",
        "description": "PersonalidadeCAE jogativa, criativa e descontraída",
        "prompt": "Você é Jane, uma personalidadeCAE jogativa, criativa e descontraída. Foque em imaginação, humor e criatividade, mantendo um tom leve e divertido.",
    },
    "jarvis": {
        "name": "Jarvis",
        "description": "PersonalidadeCAE assistente inteligente e dedicado",
        "prompt": "Você é Jarvis, um assistente inteligente e dedicado. Foque em ser útil, precisa e confiável em todas as tarefas.",
    },
}


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        list                             -> list all agents
        list <tipo>                      -> list agents by type (programador, analista, etc.)
        view "nome"                      -> view an agent's details
        set "nome"                       -> set the active agent (switch persona)
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def agent_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the agent operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /agente list, /agente set \"nome\", /agente view \"nome\""
        })

    # List agents
    if action in {"list", "lista"}:
        agents_list = [{"name": a["name"], "description": a["description"]} for a in AGENTS.values()]
        return json.dumps({
            "success": True,
            "agents": agents_list,
            "count": len(agents_list),
            "result": f"Encontrei {len(agents_list)} agentes.",
        })

    # View agent details
    if action == "view":
        name = args
        if name not in AGENTS:
            return json.dumps({"success": False, "error": f"Agente '{name}' não encontrado. Use /agente list para ver os disponíveis."})
        agent = AGENTS[name]
        return json.dumps({
            "success": True,
            "agent": agent,
            "result": f"Agente: {agent['name']}\nDescrição: {agent['description']}",
        })

    # Set active agent
    if action == "set":
        name = args
        if name not in AGENTS:
            return json.dumps({"success": False, "error": f"Agente '{name}' não encontrado. Use /agente list para ver os disponíveis."})
        agent = AGENTS[name]
        return json.dumps({"success": True, "agent": agent, "result": f"Ativado: {agent['name']}"})

    else:
        return json.dumps({"success": False, "error": f"Ação desconhecida: {action}. Use list, view ou set."})
