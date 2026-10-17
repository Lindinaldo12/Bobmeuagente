#!/usr/bin/env python3
"""Weather tool for the Telegram bot.

Adds a /clima command that provides weather forecasts using the Open-Meteo API
(free, no API key required).

Public surface:
    weather_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_WEATHER_RE = re.compile(r"^clima\s+(.+)$", re.IGNORECASE)
_WEATHER_CITY_RE = re.compile(r"^(?P<city>[A-Za-zà-úÀ-Ú\s\-]+?)\s*(?P<country>[A-Za-z]{2,3})?\s*$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Supported actions:
        forecast "<cidade>"          -> current weather and forecast
        current "<cidade>"           -> current weather only
        help                           -> show help
    """
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _get_coords(city: str, country: str = "") -> tuple[float, float] | None:
    """Get coordinates for a city using Open-Meteo geocoding API."""
    import urllib.request
    import urllib.parse

    try:
        # Build query: first try city, then city + country
        for query in [city, f"{city}, {country}"]:
            url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=1&language=en&format=json"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read())
                if data.get("results"):
                    result = data["results"][0]
                    return result["latitude"], result["longitude"]
    except Exception as exc:
        log.warning("[telegram] weather geocoding failed: %s", exc)
    return None


def _get_weather(lat: float, lon: float) -> tuple[bool, str]:
    """Get current weather and forecast from Open-Meteo."""
    import urllib.request
    import urllib.parse

    try:
        # Current weather
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,windspeed_10m_max&windspeed_unit=kmh&timezone=auto"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())

            current = data.get("current", {})
            daily = data.get("daily", {})

            # Weather code mapping
            weather_codes = {
                0: "☀️ Céu limpo",
                1: "🌤️ Principalmente céu limpo",
                2: "⛅ Principalmente nuvens",
                3: "☁️ Céu nublado",
                45: "🌫️ Névoa",
                48: "🌫️ Névoa gélida",
                51: "🌦️ Preguiça leve",
                53: "🌦️ Preguiça moderada",
                55: "🌧️ Preguiça densa",
                61: "🌦️ Chuva leve",
                63: "🌦️ Chuva moderada",
                65: "🌧️ Chuva forte",
                71: "❄️ Neve leve",
                73: "❄️ Neve moderada",
                75: "❄️ Neve forte",
                80: "🌦️ Chuva intermitente",
                81: "🌦️ Chuva intermitente leve",
                82: "🌧️ Chuva intermitente forte",
                95: "⛈️ Thunderstorm",
                96: "⛈️ Thunderstorm",
                99: "⛈️ Thunderstorm",
            }

            weather_code = current.get("weather_code", 0)
            weather_desc = weather_codes.get(weather_code, f"🌡️ {current.get('temperature', 'N/A')}°C")

            result = (
                f"🌤️ **Clima atual**\n\n"
                f"📍 {current.get('location', 'local')} {current.get('time', '')[:10]}\n"
                f"🌡️ Temperatura: **{current.get('temperature', 'N/A')}°C**\n"
                f"💨 Vento: **{current.get('windspeed', 'N/A')} km/h**\n"
                f"🌈 Condição: {weather_desc}\n\n"
                f"📅 **Previsão**\n"
            )

            # Daily forecast
            temps_max = daily.get("temperature_2m_max", [])
            temps_min = daily.get("temperature_2m_min", [])
            precip = daily.get("precipitation_probability_max", [])
            codes = daily.get("weather_code", [])
            days = daily.get("time", [])

            for i in range(min(len(days), 5)):
                max_t = temps_max[i] if i < len(temps_max) else "N/A"
                min_t = temps_min[i] if i < len(temps_min) else "N/A"
                precip_p = precip[i] if i < len(precip) else "N/A"
                code = codes[i] if i < len(codes) else 0
                desc = weather_codes.get(code, "N/A")
                result += f"  • {days[i][:10]}: {max_t}°/{min_t}° Celsius, {desc}, chance de precipitação: {precip_p}%\n"

            return True, result

    except Exception as exc:
        log.warning("[telegram] weather forecast failed: %s", exc)
        return False, f"Falha ao obter previsão do tempo: {exc}"


def weather_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the weather operation result."""
    if not prompt:
        return json.dumps({
            "success": False,
            "error": "Use: /clima forecast <cidade>, /clima current <cidade>, /clima help"
        })

    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""

    if action == "help":
        return json.dumps({
            "success": True,
            "result": "Comando de clima (usando Open-Meteo API gratuita):\n"
                      "/clima forecast <cidade>  -> previsão do tempo e clima atual\n"
                      "/clima current <cidade>  -> clima atual\n"
                      "Exemplo: /clima forecast São Paulo"
        })

    if not args:
        return json.dumps({"success": False, "error": "Use: /clima forecast <cidade>"})

    # Get coordinates
    coords = _get_coords(args)
    if coords is None:
        return json.dumps({"success": False, "error": f"Cidade '{args}' não encontrada. Use o nome da cidade ou país."})

    lat, lon = coords
    success, result = _get_weather(lat, lon)

    if success:
        return json.dumps({"success": True, "result": result})
    else:
        return json.dumps({"success": False, "error": result})
