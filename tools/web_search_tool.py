#!/usr/bin/env python3
"""Web search tool for the Telegram bot.

Adds /buscar command for searching online.

Public surface:
    web_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and search results.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

log = logging.getLogger(__name__)

# Supported providers: firecrawl, tavily, exa, parallel, searxng
_SUPPORTED_PROVIDERS = {"firecrawl", "tavily", "exa", "parallel", "searxng"}

# Provider API key settings
_PROVIDER_KEYS = {
    "firecrawl": "FIRECRAWL_API_KEY",
    "tavily": "TAVILY_API_KEY",
    "exa": "EXA_API_KEY",
    "parallel": "PARALLEL_API_KEY",
}

# Provider configs
_PROVIDER_CONFIGS = {
    "firecrawl": {
        "name": "Firecrawl",
        "enabled": False,
        "api_key_env": "FIRECRAWL_API_KEY",
        "url": "https://api.firecrawl.dev",
    },
    "tavily": {
        "name": "Tavily",
        "enabled": False,
        "api_key_env": "TAVILY_API_KEY",
        "url": "https://api.tavily.com",
    },
    "exa": {
        "name": "Exa",
        "enabled": False,
        "api_key_env": "EXA_API_KEY",
        "url": "https://exa.ai",
    },
    "parallel": {
        "name": "Parallel",
        "enabled": False,
        "api_key_env": "PARALLEL_API_KEY",
        "url": "https://api.parallel.ai",
    },
    "searxng": {
        "name": "SearxNG",
        "enabled": False,
        "api_key_env": None,
        "url": "https://searxng.example.com",
    },
}


def _get_provider_config(provider: str) -> dict:
    """Return configuration for a provider."""
    if provider not in _PROVIDER_CONFIGS:
        return {}
    config = _PROVIDER_CONFIGS[provider].copy()
    config["enabled"] = False
    return config


def _check_provider_config(provider: str) -> tuple[bool, str]:
    """Check if a provider is configured correctly."""
    config = _get_provider_config(provider)
    if not config.get("enabled"):
        return False, f"{config.get('name', provider)} não configurado"
    return True, config.get("name", provider)


def _get_default_provider() -> str:
    """Return the default search provider (first enabled)."""
    for provider in _SUPPORTED_PROVIDERS:
        config = _get_provider_config(provider)
        if config.get("enabled"):
            return provider
    return "searxng"


def _parse_prompt(prompt: Optional[str] = None) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        search "<query>"                 -> web search
        buscar "<query>"                 -> alias for search
        pesquisar "<query>"              -> alias for search
        list                             -> list providers
        list "<provider>"                -> list a provider
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _get_provider_keys() -> dict:
    """Get provider API keys from environment."""
    import os
    keys = {}
    for provider, env_key in _PROVIDER_KEYS.items():
        key = os.environ.get(env_key)
        if key:
            keys[provider] = key
    return keys


def _search_firecrawl(query: str, api_key: str) -> list[dict]:
    """Search using Firecrawl."""
    import httpx
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = httpx.post(
            "https://api.firecrawl.dev/v1/search",
            headers=headers,
            json={"query": query, "limit": 10},
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("data", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", ""),
                })
            return results
    except Exception as exc:
        log.warning("[web_search] Firecrawl error: %s", exc)
    return []


def _search_tavily(query: str, api_key: str) -> list[dict]:
    """Search using Tavily."""
    import httpx
    try:
        headers = {"Content-Type": "application/json"}
        response = httpx.post(
            "https://api.tavily.com/search",
            headers=headers,
            json={"query": query, "max_results": 10, "api_key": api_key},
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", ""),
                })
            return results
    except Exception as exc:
        log.warning("[web_search] Tavily error: %s", exc)
    return []


def _search_exa(query: str, api_key: str) -> list[dict]:
    """Search using Exa."""
    import httpx
    try:
        headers = {"Content-Type": "application/json"}
        response = httpx.post(
            "https://api.exa.ai/search",
            headers=headers,
            json={"query": query, "max_results": 10, "api_key": api_key},
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("overview", ""),
                })
            return results
    except Exception as exc:
        log.warning("[web_search] Exa error: %s", exc)
    return []


def _search_parallel(query: str, api_key: str) -> list[dict]:
    """Search using Parallel."""
    import httpx
    try:
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        response = httpx.post(
            "https://api.parallel.ai/v1/search",
            headers=headers,
            json={"query": query, "limit": 10},
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("description", ""),
                })
            return results
    except Exception as exc:
        log.warning("[web_search] Parallel error: %s", exc)
    return []


def _search_searxng(query: str, base_url: str) -> list[dict]:
    """Search using SearxNG."""
    import httpx
    try:
        response = httpx.get(
            f"{base_url}/search",
            params={"q": query, "format": "json", "safesearch": 1},
            timeout=30,
        )
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", ""),
                })
            return results
    except Exception as exc:
        log.warning("[web_search] SearxNG error: %s", exc)
    return []


def web_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the web search result."""
    action, args = _parse_prompt(prompt)

    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /buscar <termo> ou /web search <termo> (lista de provedores: firecrawl, tavily, exa, parallel, searxng)"
        })

    if action == "list":
        providers = []
        for provider in _SUPPORTED_PROVIDERS:
            config = _get_provider_config(provider)
            providers.append({
                "name": provider,
                "enabled": config.get("enabled"),
                "name_display": config.get("name", provider),
            })
        return json.dumps({
            "success": True,
            "providers": providers,
        })

    if action in {"buscar", "pesquisar"}:
        action = "search"

    if action == "search":
        if not args:
            return json.dumps({
                "success": False,
                "error": "Use: /buscar <termo> (ex: /buscar noticias economia)"
            })

        # Get provider keys
        keys = _get_provider_keys()

        # Use default provider if no specific provider requested
        query = args
        provider = None

        # Check if provider was specified
        if " " in args:
            parts = args.split(" ", 1)
            provider = parts[0].lower()
            query = parts[1]

        if provider and provider in _SUPPORTED_PROVIDERS:
            enabled, name = _check_provider_config(provider)
            if not enabled:
                return json.dumps({
                    "success": False,
                    "error": f"{name} não configurado. Use: /buscar {provider} <termo> (configure com .env)"
                })
            api_key = keys.get(provider)
            if not api_key:
                return json.dumps({
                    "success": False,
                    "error": f"Chave API para {name} não encontrada. Configure {env_key} no .env"
                })

            # Search using the provider
            if provider == "firecrawl":
                results = _search_firecrawl(query, api_key)
            elif provider == "tavily":
                results = _search_tavily(query, api_key)
            elif provider == "exa":
                results = _search_exa(query, api_key)
            elif provider == "parallel":
                results = _search_parallel(query, api_key)
            else:
                results = _search_searxng(query, _get_provider_config(provider).get("url", "https://searxng.example.com"))

            if results:
                return json.dumps({
                    "success": True,
                    "provider": provider,
                    "count": len(results),
                    "results": results[:10],
                })
            return json.dumps({
                "success": True,
                "provider": provider,
                "count": 0,
                "results": [],
                "message": "Nenhum resultado encontrado.",
            })

        # Use default provider
        default_provider = _get_default_provider()
        api_key = keys.get(default_provider)

        if not api_key:
            import os
            provider_keys = [k for k in _PROVIDER_KEYS.values() if os.environ.get(k)]
            return json.dumps({
                "success": False,
                "error": f"Nenhum provedor disponível. Configure pelo menos uma chave API: {', '.join(provider_keys)}"
            })

        if default_provider == "firecrawl":
            results = _search_firecrawl(query, api_key)
        elif default_provider == "tavily":
            results = _search_tavily(query, api_key)
        elif default_provider == "exa":
            results = _search_exa(query, api_key)
        elif default_provider == "parallel":
            results = _search_parallel(query, api_key)
        else:
            results = _search_searxng(query, _get_provider_config(default_provider).get("url", "https://searxng.example.com"))

        if results:
            return json.dumps({
                "success": True,
                "provider": default_provider,
                "count": len(results),
                "results": results[:10],
            })
        return json.dumps({
            "success": True,
            "provider": default_provider,
            "count": 0,
            "results": [],
            "message": "Nenhum resultado encontrado.",
        })

    return json.dumps({
        "success": False,
        "error": f"Ação desconhecida: {action}"
    })
