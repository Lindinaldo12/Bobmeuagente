#!/usr/bin/env python3
"""File analysis tool for the Telegram bot.

Adds /analisar command for analyzing files (txt, pdf, docx, images, csv, json, etc.)

Public surface:
    analyze_tool_tool(prompt: Optional[str] = None) -> str
        Returns a JSON string with ``success``/``error`` and analysis result.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

log = logging.getLogger(__name__)

# Supported file extensions (without dot)
_SUPPORTED_EXTENSIONS = {
    "txt": "text",
    "md": "text",
    "csv": "csv",
    "json": "json",
    "xml": "xml",
    "yaml": "yaml",
    "yml": "yaml",
    "pdf": "pdf",
    "docx": "docx",
    "png": "image",
    "jpg": "image",
    "jpeg": "image",
    "gif": "image",
    "bmp": "image",
    "webp": "image",
    "py": "code",
    "js": "code",
    "ts": "code",
    "html": "code",
    "css": "code",
}

# Max file size in bytes (10MB)
_MAX_FILE_SIZE = 10 * 1024 * 1024


def _parse_prompt(prompt: Optional[str] = None) -> tuple[Optional[str], str]:
    """Return ``(action, args)``.

    Handles:
        - "/analisar caminho/para/arquivo.txt"  (with command)
        - "caminho/para/arquivo.txt"            (file path only)
    """
    if not prompt:
        return None, ""
    # Remove leading slash if present (e.g., "/analisar" -> "analisar")
    prompt = prompt.lstrip("/")
    # Check if the prompt contains a file path (has a dot in it)
    if "." in prompt:
        # Return the whole prompt as the file path
        return None, prompt
    # Otherwise, split into command and args
    parts = prompt.strip().split(maxsplit=1)
    action = parts[0].lower() if parts else ""
    args = parts[1].strip() if len(parts) > 1 else ""
    return action, args


def _get_file_extension(filepath: str) -> str:
    """Get the file extension (without dot)."""
    ext = filepath.rsplit(".", 1)[-1].lower() if "." in filepath else ""
    return ext.lstrip(".")  # Remove leading dots if any


def _read_text_file(filepath: str) -> tuple[bool, str]:
    """Read a text file."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return True, content
    except Exception as exc:
        log.warning("[telegram] text read failed: %s", exc)
        return False, f"Erro ao ler arquivo: {exc}"


def _read_pdf_file(filepath: str) -> tuple[bool, str]:
    """Read a PDF file."""
    try:
        import pdfplumber

        content = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages[:10]:  # Limit to first 10 pages
                text = page.extract_text()
                if text:
                    content.append(text)
        if not content:
            return False, "Não foi possível extrair texto do PDF."
        return True, "\n\n--- Página ---\n\n".join(content)
    except ImportError:
        return False, "pdfplumber não instalado. Instale com: pip install pdfplumber"
    except Exception as exc:
        log.warning("[telegram] pdf read failed: %s", exc)
        return False, f"Erro ao ler PDF: {exc}"


def _read_docx_file(filepath: str) -> tuple[bool, str]:
    """Read a DOCX file."""
    try:
        from docx import Document

        doc = Document(filepath)
        content = []
        for para in doc.paragraphs:
            if para.text.strip():
                content.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                cells = [cell.text for cell in row.cells]
                content.append(" | ".join(cells))
        if not content:
            return False, "Não foi possível extrair texto do DOCX."
        return True, "\n".join(content)
    except ImportError:
        return False, "python-docx não instalado. Instale com: pip install python-docx"
    except Exception as exc:
        log.warning("[telegram] docx read failed: %s", exc)
        return False, f"Erro ao ler DOCX: {exc}"


def _read_csv_file(filepath: str) -> tuple[bool, str]:
    """Read a CSV file."""
    try:
        import csv
        import io

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            reader = csv.reader(io.StringIO(content))
            rows = []
            for row in reader:
                rows.append(row)
            return True, f"{len(rows)} linhas lidas.\n\n{json.dumps(rows[:50], indent=2, ensure_ascii=False)}"
    except Exception as exc:
        log.warning("[telegram] csv read failed: %s", exc)
        return False, f"Erro ao ler CSV: {exc}"


def _read_json_file(filepath: str) -> tuple[bool, str]:
    """Read a JSON file."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            data = json.loads(content)
            return True, json.dumps(data, indent=2, ensure_ascii=False)
    except json.JSONDecodeError as exc:
        return False, f"JSON inválido: {exc}"
    except Exception as exc:
        log.warning("[telegram] json read failed: %s", exc)
        return False, f"Erro ao ler JSON: {exc}"


def _read_xml_file(filepath: str) -> tuple[bool, str]:
    """Read an XML file."""
    try:
        import xml.etree.ElementTree as ET

        tree = ET.parse(filepath)
        root = tree.getroot()
        return True, ET.tostring(root, encoding="unicode")
    except Exception as exc:
        log.warning("[telegram] xml read failed: %s", exc)
        return False, f"Erro ao ler XML: {exc}"


def _read_yaml_file(filepath: str) -> tuple[bool, str]:
    """Read a YAML file."""
    try:
        import yaml

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            data = yaml.safe_load(f)
        return True, json.dumps(data, indent=2, ensure_ascii=False)
    except ImportError:
        return False, "PyYAML não instalado. Instale com: pip install pyyaml"
    except Exception as exc:
        log.warning("[telegram] yaml read failed: %s", exc)
        return False, f"Erro ao ler YAML: {exc}"


def _read_image_file(filepath: str) -> tuple[bool, str]:
    """Read an image file."""
    try:
        from PIL import Image
        import os

        size = os.path.getsize(filepath)
        with Image.open(filepath) as img:
            return True, f"Imagens ({img.format}): {img.size[0]}x{img.size[1]} pixels, {size} bytes"
    except ImportError:
        return False, "Pillow não instalado. Instale com: pip install Pillow"
    except Exception as exc:
        log.warning("[telegram] image read failed: %s", exc)
        return False, f"Erro ao ler imagem: {exc}"


def _read_code_file(filepath: str, extension: str) -> tuple[bool, str]:
    """Read a code file."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            lines = content.split("\n")
            # Show first 200 lines
            preview = "\n".join(lines[:200])
            if len(lines) > 200:
                preview += f"\n\n... ({len(lines) - 200} linhas omitidas)"
            return True, f"{extension.upper()} - {len(lines)} linhas\n\n{preview}"
    except Exception as exc:
        log.warning("[telegram] code read failed: %s", exc)
        return False, f"Erro ao ler código: {exc}"


def analyze_tool_tool(prompt: Optional[str] = None) -> str:
    """Return a JSON string with the file analysis result."""
    action, args = _parse_prompt(prompt)

    if not args:
        return json.dumps({
            "success": False,
            "error": "Use: /analisar <caminho_do_arquivo> (ex: /analisar relatorio.txt)"
        })

    # Check if args contains a file path
    # The args might be "teste.txt" or "teste.txt" or "teste.txt extra"
    if not args.startswith(" ") and not args.startswith("\""):
        # Check if there's a file extension in the args
        if "." in args:
            filepath = args
        else:
            return json.dumps({
                "success": False,
                "error": "Use: /analisar <caminho_do_arquivo> (ex: /analisar relatorio.txt)"
            })
    else:
        filepath = args.strip().strip("\"'")

    # Check file extension
    ext = _get_file_extension(filepath)
    if ext not in _SUPPORTED_EXTENSIONS:
        supported = ", ".join([f".{e}" for e in _SUPPORTED_EXTENSIONS.keys()])
        return json.dumps({
            "success": False,
            "error": f"Formato não suportado. Formatos suportados: {supported}"
        })

    # Check file exists
    import os
    if not os.path.exists(filepath):
        return json.dumps({
            "success": False,
            "error": f"Arquivo não encontrado: {filepath}"
        })

    if os.path.getsize(filepath) > _MAX_FILE_SIZE:
        return json.dumps({
            "success": False,
            "error": f"Arquivo muito grande ({os.path.getsize(filepath)} bytes). Limite: {_MAX_FILE_SIZE} bytes."
        })

    # Analyze based on file type
    try:
        if ext in {"txt", "md"}:
            success, result = _read_text_file(filepath)
        elif ext == "pdf":
            success, result = _read_pdf_file(filepath)
        elif ext == "docx":
            success, result = _read_docx_file(filepath)
        elif ext == "csv":
            success, result = _read_csv_file(filepath)
        elif ext == "json":
            success, result = _read_json_file(filepath)
        elif ext in {"xml", "yaml", "yml"}:
            success, result = _read_xml_file(filepath)
        elif ext in {"png", "jpg", "jpeg", "gif", "bmp", "webp"}:
            success, result = _read_image_file(filepath)
        elif ext in {"py", "js", "ts", "html", "css"}:
            success, result = _read_code_file(filepath, ext)
        else:
            return json.dumps({
                "success": False,
                "error": f"Formato não suportado: {ext}"
            })

        if success:
            # Limit response size
            if len(result) > 3000:
                result = result[:3000] + f"\n\n... ({len(result) - 3000} caracteres omitidos)"
            return json.dumps({
                "success": True,
                "result": result,
            })
        return json.dumps({
            "success": False,
            "error": result,
        })

    except Exception as exc:
        log.warning("[telegram] file analysis error: %s", exc)
        return json.dumps({
            "success": False,
            "error": f"Erro inesperado: {exc}",
        })
