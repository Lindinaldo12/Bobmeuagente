#!/usr/bin/env python3
"""News tool for the Telegram bot.

Adds a /noticias command that fetches news from RSS feeds and news APIs.

Public surface:
    news_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``results`` list.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_NEWS_RE = re.compile(r"^noticias\s+(.+)$", re.IGNORECASE)
_NEWS_SEARCH_RE = re.compile(r"^noticias\s+(?:(?:em|de|from)\s+)?(.+)$", re.IGNORECASE)

# RSS feeds (no API key required)
_DEFAULT_FEEDS = {
    "ternlimite": "https://www.ternlimite.com.br/rss",
    "estadao": "https://g1.globo.com/rss.xml",
    "cnn": "https://www.cnnbrasil.com.br/feed",
    "folha": "https://www1.folha.com.br/rss.xml",
    "valor": "https://valor30.globo.com/blogs/rss.xml",
}

# Brazilian news sources
_DEFAULT_SOURCES = [
    "G1",
    "CNN Brasil",
    "Folha de S.Paulo",
    "Valor Econômico",
    "Terra",
    "UOL",
    "Exame",
    "Superinteressante",
]

# Default categories
_DEFAULT_CATEGORIES = [
    "geral",
    "economia",
    "politica",
    "ciencia",
    "tecnologia",
    "esporte",
    "saude",
    "meio-ambiente",
]


def _parse_prompt(prompt: Optional[str] = None) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        list                             -> list available sources/categories
        list <source>                    -> list news from a source
        list <category>                  -> list news from a category
        search "<query>"                 -> search for news
        <query>                          -> search for news (default)
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _fetch_rss(url: str, timeout: int = 10) -> tuple[bool, str]:
    """Fetch RSS feed content."""
    import urllib.request
    import urllib.parse

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            content = response.read().decode("utf-8", errors="ignore")
            return True, content
    except Exception as exc:
        log.warning("[telegram] news fetch failed: %s", exc)
        return False, f"Erro ao buscar feed: {exc}"


def _parse_rss(content: str) -> list[dict]:
    """Parse RSS feed and extract news items."""
    import xml.etree.ElementTree as ET

    try:
        root = ET.fromstring(content)
        items = []
        for item in root.findall(".//item"):
            title = item.find("title")
            link = item.find("link")
            description = item.find("description")
            pub_date = item.find("pubDate")
            source = item.find("source")

            if title is not None and link is not None:
                items.append({
                    "title": title.text or "Sem título",
                    "link": link.text or "",
                    "description": description.text if description is not None else "",
                    "pubDate": pub_date.text if pub_date is not None else "",
                    "source": source.text if source is not None else "Notícia",
                })
        return items
    except Exception as exc:
        log.warning("[telegram] RSS parse failed: %s", exc)
        return []


def _get_default_feeds() -> list[dict]:
    """Return default news feeds."""
    return [
        {"title": "G1", "link": "https://g1.globo.com/rss.xml", "source": "G1"},
        {"title": "CNN Brasil", "link": "https://www.cnnbrasil.com.br/feed", "source": "CNN Brasil"},
        {"title": "Folha de S.Paulo", "link": "https://www1.folha.com.br/rss.xml", "source": "Folha de S.Paulo"},
        {"title": "Valor Econômico", "link": "https://valor30.globo.com/blogs/rss.xml", "source": "Valor Econômico"},
        {"title": "Terra", "link": "https://www.terra.com.br/rss.xml", "source": "Terra"},
        {"title": "UOL", "link": "https://noticias.uol.com.br/rss.xml", "source": "UOL"},
        {"title": "Exame", "link": "https://www.exame.com/rss/", "source": "Exame"},
        {"title": "Superinteressante", "link": "https://www.vivacloud.app/superinteressante/rss/", "source": "Superinteressante"},
    ]


def news_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the news operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /noticias list (sources), /noticias <query> (search), /noticias <source_name> (recent news)"
        })

    if action == "list":
        # List available sources
        feeds = _get_default_feeds()
        sources = sorted(set(f["source"] for f in feeds))
        categories = ["geral", "economia", "politica", "ciencia", "tecnologia", "esporte", "saude", "meio-ambiente"]
        return json.dumps({
            "success": True,
            "sources": sources,
            "categories": categories,
            "feeds": feeds,
        })

    # Default action: search or get news from a source
    query = args

    if not query:
        return json.dumps({
            "success": False,
            "error": "Use: /noticias <query> (search) ou /noticias list (sources)"
        })

    # Try to find a matching source
    feeds = _get_default_feeds()
    source_match = None
    for f in feeds:
        if query.lower() in f["source"].lower() or query.lower() in f["title"].lower():
            source_match = f
            break

    if source_match:
        # Get news from a specific source
        success, content = _fetch_rss(source_match["link"])
        if success:
            items = _parse_rss(content)
            if items:
                results = []
                for item in items[:20]:
                    results.append({
                        "title": item["title"],
                        "link": item["link"],
                        "description": item["description"][:300] + "..." if len(item["description"]) > 300 else item["description"],
                        "pubDate": item["pubDate"],
                        "source": source_match["source"],
                    })
                return json.dumps({
                    "success": True,
                    "source": source_match["source"],
                    "count": len(results),
                    "results": results,
                })
            return json.dumps({"success": False, "error": "Nenhuma notícia encontrada nesta fonte."})
        return json.dumps({"success": False, "error": content})

    # Search query - use multiple feeds
    all_results = []
    for feed in _get_default_feeds():
        success, content = _fetch_rss(feed["link"])
        if success:
            items = _parse_rss(content)
            for item in items:
                # Filter by query if it matches
                if args.lower() in item["title"].lower() or args.lower() in item["description"].lower():
                    all_results.append({
                        "title": item["title"],
                        "link": item["link"],
                        "description": item["description"][:300] + "..." if len(item["description"]) > 300 else item["description"],
                        "pubDate": item["pubDate"],
                        "source": feed["source"],
                        "query_matched": True,
                    })

    # If no matches, return recent news from all feeds
    if not all_results:
        for feed in _get_default_feeds()[:5]:
            success, content = _fetch_rss(feed["link"])
            if success:
                items = _parse_rss(content)
                for item in items[:5]:
                    all_results.append({
                        "title": item["title"],
                        "link": item["link"],
                        "description": item["description"][:300] + "..." if len(item["description"]) > 300 else item["description"],
                        "pubDate": item["pubDate"],
                        "source": feed["source"],
                        "query_matched": False,
                    })

    if all_results:
        return json.dumps({
            "success": True,
            "count": len(all_results),
            "results": all_results[:20],
        })
    return json.dumps({"success": False, "error": "Nenhuma notícia encontrada."})
