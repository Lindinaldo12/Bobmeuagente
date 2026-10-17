#!/usr/bin/env python3
"""Calendar tool for the Telegram bot.

Adds /calendario command for creating and managing calendar events.

Public surface:
    calendar_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and event details.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List

log = logging.getLogger(__name__)

_CALENDAR = {}  # In-memory calendar store: {event_id: event_data}

# Month names for parsing
_MONTHS = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}


def _parse_prompt(prompt: Optional[str] = None) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        add "YYYY-MM-DD HH:MM" "<event_name>" "<description>" -> add event
        list [--today] [--all]                               -> list events
        delete "<event_id>"                                  -> delete event
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _parse_date(date_str: str) -> datetime:
    """Parse date string in various formats.

    Handles:
        YYYY-MM-DD                    (date only)
        YYYY-MM-DD HH:MM              (date and time)
        DD/MM/YYYY or DD/MM/YY        (Brazilian format)
        DD de MonthName               (Portuguese format, e.g. "15 de janeiro")
        DD de MonthName de YYYY       (Portuguese format with year)
    """
    # ISO format with time: YYYY-MM-DD HH:MM
    if len(date_str) >= 10 and date_str[4] == '-' and date_str[7] == '-':
        # Try full date-time first
        try:
            return datetime.strptime(date_str[:16], '%Y-%m-%d %H:%M')
        except ValueError:
            pass
        # Try date only
        try:
            return datetime.strptime(date_str[:10], '%Y-%m-%d')
        except ValueError:
            pass

    # Brazilian format: DD/MM/YYYY or DD/MM/YY
    import re
    day_month_year = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", date_str)
    if day_month_year:
        day = int(day_month_year.group(1))
        month = int(day_month_year.group(2))
        year = int(day_month_year.group(3))
        if year < 100:
            year += 2000
        try:
            return datetime(year, month, day)
        except ValueError:
            pass

    # Month name format: \"15 de janeiro\" or \"15 de janeiro de 2026\"
    month_name = re.match(r"(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?", date_str.lower())
    if month_name:
        day = int(month_name.group(1))
        month_name = month_name.group(2)
        year = 2026  # Default year
        if month_name in _MONTHS:
            month = _MONTHS[month_name]
            if "de" in date_str.lower():
                year_match = re.search(r"de\s+(\d{4})", date_str.lower())
                if year_match:
                    year = int(year_match.group(1))
            try:
                return datetime(year, month, day)
            except ValueError:
                pass

    # Default to today
    return datetime.now()


def _parse_time(time_str: str) -> int:
    """Parse time string to hour (24h)."""
    # HH:MM format
    time_match = re.match(r"(\d{1,2}):(\d{2})", time_str)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        return hour * 60 + minute

    # Just hour
    hour_match = re.match(r"(\d{1,2})", time_str)
    if hour_match:
        return int(hour_match.group(1)) * 60

    return 0


def _add_event(args: str) -> tuple[bool, str]:
    """Add an event from args string."""
    # Parse: "YYYY-MM-DD HH:MM" "<event_name>" "<description>"
    # Simple pattern: three quoted strings
    event_match = re.match(r'"([^"]+)"\s+"([^"]+)"\s+"([^"]*)"', args)
    if not event_match:
        return False, "Formato inválido. Use: /calendario add \"2026-10-20 15:00\" \"Reunião\" \"Descrição\""

    date_time = event_match.group(1)
    name = event_match.group(2)
    description = event_match.group(3) or ""

    event_date = _parse_date(date_time)
    if event_date <= datetime.now():
        return False, "A data do evento deve ser futura."

    event_id = str(uuid.uuid4())[:8]
    _CALENDAR[event_id] = {
        "id": event_id,
        "name": name,
        "description": description,
        "date": event_date.strftime("%d/%m/%Y"),
        "time": event_date.strftime("%H:%M"),
        "created": datetime.now().strftime("%d/%m/%Y %H:%M"),
    }

    return True, event_id


def _list_events(args: str) -> list[dict]:
    """List events based on args."""
    events = []
    if not _CALENDAR:
        return []

    for event in _CALENDAR.values():
        if args and "--all" not in args:
            # Filter by date
            event_date = datetime.strptime(event["date"] + " " + event["time"], "%d/%m/%Y %H:%M")
            if event_date.date() < datetime.now().date():
                continue
        events.append(event)

    return sorted(events, key=lambda e: e["date"] + " " + e["time"])


def _delete_event(event_id: str) -> tuple[bool, str]:
    """Delete an event by ID."""
    if event_id in _CALENDAR:
        del _CALENDAR[event_id]
        return True, f"Evento '{event_id}' removido."
    return False, f"Evento '{event_id}' não encontrado."


def calendar_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the calendar operation result."""
    action, args = _parse_prompt(prompt)
    if not action:
        return json.dumps({
            "success": False,
            "error": "Use: /calendario add, /calendario list, /calendario delete"
        })

    if action == "add":
        success, result = _add_event(args)
        if success:
            return json.dumps({
                "success": True,
                "event_id": result,
                "message": "Evento adicionado com sucesso!",
            })
        return json.dumps({"success": False, "error": result})

    elif action == "list":
        events = _list_events(args)
        if events:
            formatted = []
            for event in events[:20]:
                formatted.append({
                    "id": event["id"],
                    "name": event["name"],
                    "date": event["date"],
                    "time": event["time"],
                    "description": event["description"],
                })
            return json.dumps({
                "success": True,
                "count": len(formatted),
                "events": formatted,
            })
        return json.dumps({"success": True, "count": 0, "events": []})

    elif action == "delete":
        if not args:
            return json.dumps({"success": False, "error": "Use: /calendario delete <event_id>"})
        event_id = args.split()[0]
        success, message = _delete_event(event_id)
        return json.dumps({"success": success, "message": message})

    return json.dumps({"success": False, "error": f"Ação desconhecida: {action}"})
