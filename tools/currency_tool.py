#!/usr/bin/env python3
"""Currency quotation via a free public API.

Provides ``currency_quote_tool`` so the Telegram bot can answer "quanto é 1 USD
em BRL" / "cotação do dólar" / "exchange rate" without routing through the agent
planner.

The single API call surface is ``currency_quote_tool(prompt: str) -> str``; the
rest of the module is helpers and error shaping. The tool keeps a stable,
JSON-shaped result + ``success`` / ``error`` so the Telegram adapter can reason
on it uniformly with the other tools.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

log = logging.getLogger(__name__)

# Free, no-key exchangerate API (base: https://open.er-api.com/v6/latest/{base_code}).
# Rate limit is generous (300 req/min tier); no sign-up required for light use.
_API_BASE = "https://open.er-api.com/v6/latest"

# Common pair separators the user might type: "usd brl", "usd->brl", "usd -> brl",
# "usd-->brl", "usd to brl". The separator group is a *sequence* so multi-char
# arrows like "->" are consumed in full instead of leaving ">e" to fail the
# two-letter "to" group.
_PAIR_RE = re.compile(
    r"^(?P<from>[A-Za-z]{3})\s*(?:[-–—→>]+\s*|to\s*)+(?P<to>[A-Za-z]{3})$",
    re.IGNORECASE,
)
_COIN_CODES = {"usd", "brl", "eur", "ars", "BRL", "USD", "EUR"}


def _normalize(code: str) -> str:
    return code.strip().upper()


def _is_known(code: str) -> bool:
    return code in _COIN_CODES


def _build_result(from_code: str, to_code: str, data: dict[str, Any]) -> str:
    rates = data.get("rates", {})
    if to_code not in rates:
        log.warning("[currency] %s not available in %s", to_code, from_code)
        return json.dumps({"success": False, "error": f"Código {to_code} não disponível."})

    rate = rates[to_code]
    quote = f"1 {from_code} = {rate:.4f} {to_code}"
    return json.dumps(
        {
            "success": True,
            "from": from_code,
            "to": to_code,
            "rate": round(rate, 4),
            "quote": quote,
            "date": data.get("time_last_update_utc", ""),
        }
    )


def _parse_prompt(prompt: Optional[str]) -> tuple[str, str]:
    """Return ``(from, to)`` codes from the user prompt.

    Splits on whitespace and arrow characters (``-``, ``->``, ``-->``,
    ``→``) so ``usd brl``, ``usd->brl``, ``usd -> brl`` and ``usd to brl``
    all resolve to ``(USD, BRL)``. Falls back to the sensible default
    (``USD -> BRL``) when the prompt is empty or unparseable, so the tool
    never refuses to answer a quotation.
    """
    from_code = "USD"
    to_code = "BRL"
    if prompt:
        tokens = re.split(r"[\s\-–—→>]+", prompt.strip(), maxsplit=2)
        if len(tokens) >= 2:
            from_code = _normalize(tokens[0])
            to_code = _normalize(tokens[-1])
            if from_code not in _COIN_CODES or to_code not in _COIN_CODES:
                log.warning("[currency] unsupported pair %s -> %s", from_code, to_code)
                return "USD", "BRL"
    return from_code, to_code


def _fetch_latest(base: str) -> dict[str, Any]:
    import httpx

    url = f"{_API_BASE}/{base}"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def currency_quote_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the requested currency quotation.

    Result shape::

        {
          "success": true,
          "from": "USD",
          "to": "BRL",
          "rate": 5.25,
          "quote": "1 USD = 5.25 BRL",
          "date": "2026-10-17"
        }

    Returns ``{"success": false, "error": "..."}`` when the quote cannot be
    obtained, so callers (the Telegram adapter) can surface a friendly message.
    """
    from_code, to_code = _parse_prompt(prompt)
    try:
        data = _fetch_latest(from_code)
        return _build_result(from_code, to_code, data)
    except Exception as exc:  # noqa: BLE001
        log.warning("[currency] quote failed %s -> %s : %s", from_code, to_code, exc)
        return json.dumps({"success": False, "error": f"Não foi possível obter a cotação: {exc}"})
