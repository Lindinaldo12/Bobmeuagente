#!/usr/bin/env python3
"""
Script para gerar handlers.py com suporte a links e arquivos.
"""
content = """import os
import re
import subprocess
import asyncio
from io import BytesIO
from telegram import Update
from telegram.ext import ContextTypes
from telegram.error import BadRequest
from playwright.async_api import async_playwright

# Provedor de IA com fallback automático (Gemini -> OpenRouter)
from ai_client import ai_client

# Bibliotecas para processamento de arquivos
# type: ignore
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

# type: ignore
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# type: ignore
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

# type: ignore
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Expressão regular para detectar URLs
URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')

# ===================== Auxiliares para Links e Arquivos =====================

def extract_urls(text):
    return URL_PATTERN.findall(text)

async def fetch_url_content(url, max_chars=15000):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; BobAI/1.0)'}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text[:max_chars]
    except Exception as e:
        return f'[Nao foi possivel buscar {url}: {str(e)}]'

async def download_file_context(file_info):
    try:
        file_id = file_info.get('file_id')
        file_path = file_info.get('file_path')
        file_name = file_info.get('file_name', '')
        extension = os.path.splitext(file_name)[1].lower()
        
        file = context.bot.get_file(file_id)
        file_url = f'https://api.telegram.org/file/bot{file.token}/{file_path}'
        response = requests.get(file_url, timeout=60)
        response.raise_for_status()
        
        if extension == '.pdf' and PDF_AVAILABLE:
            try:
                with pdfplumber.open(BytesIO(response.content)) as pdf:
                    text = ' '.join([page.extract_text() or '' for page in pdf.pages])
                    return text[:15000]
            except Exception as e:
                return f'[PDF read error: {str(e)}]'
        
        if extension in ['.docx', '.doc'] and DOCX_AVAILABLE:
            try:
                doc = Document(BytesIO(response.content))
                text = chr(10).join([para.text for para in doc.paragraphs])
                return text[:15000]
            except Exception as e:
                return f'[DOCX read error: {str(e)}]'
        
        if extension in ['.txt', '.md', '.text']:
            return response.text[:15000]
        
        if PIL_AVAILABLE:
            try:
                img = Image.open(BytesIO(response.content))
                return f'[Imagem detectada: {img.size[0]}x{img.size[1]} pixels]'
            except Exception:
                pass
        
        return f'[Conteudo baixado, tipo nao mapeado: {extension or "unknown"}]'
    except Exception as e:
        return f'[Erro ao baixar arquivo: {str(e)}]'

async def safe_reply(update, text, parse_mode=''):
    try:
        await update.message.reply_text(text, parse_mode=parse_mode)
    except BadRequest:
        await update.message.reply_text(text, parse_mode=None)

async def take_screenshot(url, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(url)
        await asyncio.sleep(2)
        await page.screenshot(path=output_path)
        await browser.close()
"""

with open('handlers.py', 'w') as f:
    f.write(content)
print('Part 1 done')
