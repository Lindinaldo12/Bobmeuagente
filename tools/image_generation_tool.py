#!/usr/bin/env python3
"""Image generation tool placeholder.

This module is required by the Telegram adapter for backward compatibility.
The Hermes Agent core provides image generation capabilities through
the image_generation_catalog and image_generation_managed modules.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


def image_generate_tool(prompt: Optional[str] = None) -> str:
    """Generate an image (placeholder).

    Returns a JSON string with the result. In a full implementation,
    this would call an image generation API (DALL-E, Stable Diffusion, etc.).
    """
    import json as _json

    if not prompt:
        return _json.dumps({
            "success": False,
            "error": "Nenhum prompt fornecido. Use: /imagem 'descricao da imagem'"
        })

    # In a real implementation, this would call an image generation API
    return _json.dumps({
        "success": True,
        "message": "Geração de imagem iniciada (modo demo - sem imagem real)",
        "prompt": prompt,
        "note": "Configure um provedor de imagem para geração real"
    })
