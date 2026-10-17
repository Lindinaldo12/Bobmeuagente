#!/usr/bin/env python3
"""File analysis tool for the Telegram bot.

Adds a /analisar command that analyzes files (text, images, PDFs) and returns
a summary of their content.

Public surface:
    analyze_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and a ``result`` message.
"""

from __future__ import annotations

import json
import logging
import re
import os
from typing import Optional

log = logging.getLogger(__name__)

_ANALISE_RE = re.compile(r"^analisar\s+(.+)$", re.IGNORECASE)

# Supported file extensions
_SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx", ".doc", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".py", ".js", ".ts", ".html", ".css", ".json", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

# Image analysis libraries
try:
    from PIL import Image
    IMAGE_AVAILABLE = True
except ImportError:
    IMAGE_AVAILABLE = False


def _parse_prompt(prompt: Optional[str]) -> tuple[Optional[str], str]:
    """Return ``(action, args)``."""
    if not prompt:
        return None, ""
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _analyze_text_file(file_path: str) -> str:
    """Analyze a text file and return a summary."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        lines = content.splitlines()
        summary = f"📄 **Arquivo de texto**\n\n"
        summary += f"📏 Tamanho: {len(content)} caracteres, {len(lines)} linhas\n"
        summary += f"📁 Caminho: {file_path}\n\n"
        # Show first 500 characters
        if len(content) > 500:
            summary += "📋 **Conteúdo (incípio)**:\n```\n"
            summary += content[:500] + "\n...\n```\n"
            summary += f"\n📊 **Resumo**: Arquivo com {len(content)} caracteres e {len(lines)} linhas.\n"
            summary += f"📁 Extensão: {os.path.splitext(file_path)[1]}\n"
        else:
            summary += f"📋 **Conteúdo**:\n```\n{content}\n```\n"
        return summary
    except Exception as exc:
        log.warning("[telegram] file analyze failed: %s", exc)
        return f"❌ **Erro ao analisar arquivo**: {exc}"


def _analyze_image_file(file_path: str) -> str:
    """Analyze an image file and return a summary."""
    if not IMAGE_AVAILABLE:
        return "❌ **Biblioteca de imagem não disponível**. Instale o Pillow: `pip install Pillow`"

    try:
        from PIL import Image
        img = Image.open(file_path)
        size_kb = os.path.getsize(file_path) / 1024
        summary = f"🖼️ **Imagem analisada**\n\n"
        summary += f"📁 Caminho: {file_path}\n"
        summary += f"📏 Tamanho: {size_kb:.1f} KB\n"
        summary += f"📐 Dimensões: {img.size[0]}x{img.size[1]} pixels\n"
        summary += f"🌈 Modo: {img.mode}\n"
        summary += f"📊 Extensão: {os.path.splitext(file_path)[1]}\n"
        return summary
    except Exception as exc:
        log.warning("[telegram] image analysis failed: %s", exc)
        return f"❌ **Erro ao analisar imagem**: {exc}"


def _analyze_pdf(file_path: str) -> str:
    """Analyze a PDF file and return a summary."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        page_count = len(doc)
        text = ""
        for page in doc:
            text += page.get_text()
        summary = f"📄 **PDF analisado**\n\n"
        summary += f"📁 Caminho: {file_path}\n"
        summary += f"📏 Páginas: {page_count}\n"
        summary += f"📄 Texto extraído: {len(text)} caracteres\n"
        summary += f"📊 Extensão: {os.path.splitext(file_path)[1]}\n"
        if len(text) > 500:
            summary += f"\n📋 **Conteúdo (incílio)**:\n```\n{text[:500]}...\n```\n"
        else:
            summary += f"\n📋 **Conteúdo**:\n```\n{text}\n```\n"
        return summary
    except ImportError:
        return "❌ **PyMuPDF não instalado**. Execute: `pip install pymupdf`"
    except Exception as exc:
        log.warning("[telegram] pdf analysis failed: %s", exc)
        return f"❌ **Erro ao analisar PDF**: {exc}"


def _analyze_docx(file_path: str) -> str:
    """Analyze a DOCX file and return a summary."""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs)
        summary = f"📄 **DOCX analisado**\n\n"
        summary += f"📁 Caminho: {file_path}\n"
        summary += f"📏 Parágrafos: {len(paragraphs)}\n"
        summary += f"📄 Texto extraído: {len(text)} caracteres\n"
        summary += f"📊 Extensão: {os.path.splitext(file_path)[1]}\n"
        if len(text) > 500:
            summary += f"\n📋 **Conteúdo (incílio)**:\n```\n{text[:500]}...\n```\n"
        else:
            summary += f"\n📋 **Conteúdo**:\n```\n{text}\n```\n"
        return summary
    except ImportError:
        return "❌ **python-docx não instalado**. Execute: `pip install python-docx`"
    except Exception as exc:
        log.warning("[telegram] docx analysis failed: %s", exc)
        return f"❌ **Erro ao analisar DOCX**: {exc}"


def _analyze_csv(file_path: str) -> str:
    """Analyze a CSV file and return a summary."""
    try:
        import csv
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            rows = list(reader)
        header = rows[0] if rows else []
        data_rows = len(rows) - 1 if rows else 0
        summary = f"📊 **CSV analisado**\n\n"
        summary += f"📁 Caminho: {file_path}\n"
        summary += f"📏 Linhas: {data_rows} dados + {len(header)} cabeçalho\n"
        summary += f"📋 Colunas: {len(header)}\n"
        summary += f"📊 Valores: {len(rows)} total\n"
        if header:
            summary += f"\n📋 **Cabeçalho**:\n"
            for col in header[:10]:
                summary += f"  • {col}\n"
            if len(header) > 10:
                summary += f"  • ... e mais {len(header) - 10} colunas\n"
        return summary
    except Exception as exc:
        log.warning("[telegram] csv analysis failed: %s", exc)
        return f"❌ **Erro ao analisar CSV**: {exc}"


def _analyze_json(file_path: str) -> str:
    """Analyze a JSON file and return a summary."""
    try:
        import json
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        summary = f"📦 **JSON analisado**\n\n"
        summary += f"📁 Caminho: {file_path}\n"
        if isinstance(data, dict):
            summary += f"📊 Tipo: Objeto JSON\n"
            summary += f"🔑 Chaves: {len(data)}\n"
            # Show first 5 keys
            for key in list(data.keys())[:10]:
                summary += f"  • {key}: {str(data[key])[:80]}...\n"
        elif isinstance(data, list):
            summary += f"📊 Tipo: Array\n"
            summary += f"📦 Itens: {len(data)}\n"
            if data:
                summary += f"  • Item 0: {str(data[0])[:80]}...\n"
        else:
            summary += f"📊 Tipo: {type(data).__name__}\n"
        return summary
    except Exception as exc:
        log.warning("[telegram] json analysis failed: %s", exc)
        return f"❌ **Erro ao analisar JSON**: {exc}"


def analyze_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the file analysis result."""
    if not prompt:
        return json.dumps({
            "success": False,
            "error": "Use: /analisar <caminho_do_arquivo>"
        })

    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""

    if action != "analisar":
        return json.dumps({"success": False, "error": "Use: /analisar <caminho_do_arquivo>"})

    if not args:
        return json.dumps({"success": False, "error": "Use: /analisar <caminho_do_arquivo>"})

    # Get the full path
    file_path = args
    if not os.path.isabs(file_path):
        file_path = os.path.join(os.getcwd(), file_path)

    if not os.path.exists(file_path):
        return json.dumps({"success": False, "error": f"Arquivo não encontrado: {file_path}"})

    if not os.path.isfile(file_path):
        return json.dumps({"success": False, "error": f"Não é um arquivo: {file_path}"})

    ext = os.path.splitext(file_path)[1].lower()

    # Analyze based on extension
    if ext in {".txt", ".md", ".py", ".js", ".ts", ".html", ".css", ".xml", ".yaml", ".yml", ".csv"}:
        return json.dumps({"success": True, "result": _analyze_text_file(file_path)})
    elif ext in {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}:
        return json.dumps({"success": True, "result": _analyze_image_file(file_path)})
    elif ext == ".pdf":
        return json.dumps({"success": True, "result": _analyze_pdf(file_path)})
    elif ext in {".docx", ".doc"}:
        return json.dumps({"success": True, "result": _analyze_docx(file_path)})
    elif ext == ".json":
        return json.dumps({"success": True, "result": _analyze_json(file_path)})
    else:
        # Try to analyze as text
        return json.dumps({"success": True, "result": _analyze_text_file(file_path)})
