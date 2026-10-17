#!/usr/bin/env python3
"""Video generation tool for the Telegram bot.

Adds a ``/gerar_video "prompt"`` command that generates a video from a text prompt
using the Hermes video generation tool (video_gen_registry, plugins/video_gen/).

Public surface: ``video_tool_tool(prompt: Optional[str] = None) -> str`` returns a
JSON string with ``success``/``error`` and either a ``video_url`` or an ``error`` message.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

_VIDEO_RE = re.compile(r"^(gerar_video|video|video_generator|imagine_video)\s+(.+)$", re.IGNORECASE)
_URLS_RE = re.compile(r"^([a-zA-Z][a-zA-Z0-9+.-]*://)", re.IGNORECASE)


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], Optional[str], str]:
    """Return ``(prompt, action, final_prompt)``.

    * prompt — the text to generate video from
    * action — the command used (for display)
    * final_prompt — the raw trimmed text
    """
    if not prompt:
        return None, None, ""
    prompt = prompt.strip()
    m = _VIDEO_RE.match(prompt)
    if not m:
        return None, None, ""
    return m.group(2).strip(), m.group(1).lower(), prompt


def video_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the generated video.

    Result shape on success::

        {
          "success": true,
          "video_url": "https://.../video.mp4",
          "prompt": "prompt used",
          "provider": "fal"
        }

    Result shape on failure::

        {
          "success": false,
          "error": "Video generation requires a configured provider (fal, openrouter, xai, deepinfra)."
        }
    """
    prompt_text, _action, _final_prompt = _parse_prompt(prompt)
    if not prompt_text:
        return json.dumps({
            "success": False,
            "error": "Use: /gerar_video \"prompt da video\" ou /video Generator prompt"
        })

    try:
        # Lazy import to keep cold start light.
        from tools import video_generation_tool as vgt

        # The video generation tool uses args dict + task_id. We call the handler.
        result = vgt._handle_video_generate({"prompt": prompt_text, "image_url": None, "reference_image_urls": None})
        return result
    except Exception as exc:  # noqa: BLE001
        log.warning("[telegram] video generation failed: %s", exc)
        return json.dumps({"success": False, "error": f"Não foi possível gerar vídeo: {exc}"})
