#!/usr/bin/env python3
"""Text-to-speech (TTS) tool for the Telegram bot.

Adds a ``/falar "texto"`` command that converts text to speech using the
Hermes TTS providers (Edge, ElevenLabs, OpenAI, DeepInfra, MiniMax, Mistral,
Gemini, xAI, local NeuTTS/KittenTTS/Piper).

Public surface: ``tts_tool_tool(prompt: Optional[str] = None) -> str`` returns a
JSON string with ``success``/``error`` and either an ``audio_url`` (for playback)
or an ``error`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_SPEAK_RE = re.compile(r"^(falar|speak|fala|fale|texto)\s+(.+)$", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], Optional[str], str]:
    """Return ``(text, provider_hint, final_prompt)``.

    * text — the text to speak (lowercased, trimmed)
    * provider_hint — from the user, or None
    * final_prompt — the raw, trimmed text
    """
    if not prompt:
        return None, None, ""
    prompt = prompt.strip()
    m = _SPEAK_RE.match(prompt)
    if not m:
        return None, None, ""
    text = m.group(2).strip()
    provider_hint = None
    parts = m.group(1).lower()
    # Allow: /falar edge texto, /falar elevenlabs texto
    if parts in {"edge", "elevenlabs", "openai", "deepinfra", "minimax", "mistral", "gemini", "xai", "local", "neu", "kitten", "piper"}:
        provider_hint = parts
    return text, provider_hint, prompt


def tts_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the generated audio.

    Result shape on success::

        {
          "success": true,
          "audio_url": "https://.../audio.opus",
          "format": "opus",
          "provider": "edge"
        }

    Result shape on failure::

        {
          "success": false,
          "error": "Voce precisa configurar uma chave de voz (TTS) no .env."
        }
    """
    text, hint, _ = _parse_prompt(prompt)
    if not text:
        return json.dumps({"success": False, "error": "Use: /falar texto ou /falar [edge|elevenlabs|openai|deepinfra|minimax|mistral|gemini|xai|local] texto"})

    try:
        # Lazy import to keep cold start light.
        from tools import tts_tool as tts

        # Dispatch by hint.
        if hint:
            provider_map = {
                "edge": "edge",
                "elevenlabs": "elevenlabs",
                "openai": "openai",
                "deepinfra": "deepinfra",
                "minimax": "minimax",
                "mistral": "mistral",
                "gemini": "gemini",
                "xai": "xai",
                "local": "local",
                "neu": "neu",
                "kitten": "kitten",
                "piper": "piper",
            }
            mod_name = f"tts_tool_{provider_map[hint]}"
            if not hasattr(tts, mod_name):
                return json.dumps({"success": False, "error": f"O provedor {hint} não está disponível."})
            return getattr(tts, mod_name)(text)
        # Default: auto-detect (prefer Edge, then ElevenLabs, then OpenAI).
        return tts._generate_edge_tts(text) or tts._generate_elevenlabs(text) or tts._generate_openai_tts(text)
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] tts failed: %s", exc)
        return json.dumps({"success": False, "error": f"Não foi possível gerar voz: {exc}"})
