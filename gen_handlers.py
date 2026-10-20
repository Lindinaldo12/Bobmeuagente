#!/usr/bin/env python3
"""
Script para gerar handlers.py com suporte a análise de links e arquivos.
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

# Bibliotecas para processamento de arquivos e links
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
URL_PATTERN = re.compile(r'https?://\\S+|www\\.\\S+')

# ===================== Auxiliares para Links e Arquivos =====================

def extract_urls(text: str) -> list:
    """Extrai todas as URLs de uma mensagem de texto."""
    return URL_PATTERN.findall(text)

async def fetch_url_content(url: str, max_chars: int = 15000) -> str:
    """
    Busca o conteúdo de uma URL e retorna um resumo extraível.
    Suporta HTML, texto puro e PDF.
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; BobAI/1.0)'}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text[:max_chars]
    except Exception as e:
        return f'[Nao foi possivel buscar {url}: {str(e)}]'

async def download_file_context(file_info: dict) -> str:
    """
    Baixa um arquivo do Telegram e retorna conteúdo extraível.
    Suporta: imagens, PDFs, documentos texto (TXT, DOCX).
    """
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
        
        if PIL_AVAILABLE and extension in ['.png', '.jpg', '.jpeg', '.webp']:
            try:
                img = Image.open(BytesIO(response.content))
                return f'[Imagem detectada: {img.size[0]}x{img.size[1]} pixels]'
            except Exception:
                pass
        
        return f'[Conteudo baixado, tipo nao mapeado: {extension or "unknown"}]'
    except Exception as e:
        return f'[Erro ao baixar arquivo: {str(e)}]'

async def safe_reply(update: Update, text: str, parse_mode: str = 'Markdown'):
    """
    Attempts to send a reply with Markdown, falling back to plain text if parsing fails.
    """
    try:
        await update.message.reply_text(text, parse_mode=parse_mode)
    except BadRequest:
        # Fallback to plain text if Markdown is broken
        await update.message.reply_text(text, parse_mode=None)

async def take_screenshot(url: str, output_path: str):
    """
    Captures a screenshot of a given URL.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(url)
        # Wait for potential animations or load
        await asyncio.sleep(2)
        await page.screenshot(path=output_path)
        await browser.close()

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for the /start command with the 'Butler' persona.
    """
    welcome_message = (
        "*(Note: My neural bridge is now fully equipped for visual and terminal tasks).* \\n\\n"
        "• **System Mastery:** I can run shell commands, manage background processes, and interact with your filesystem directly on the Azure VM.\\n"
        "• **Visual Feedback:** I can capture screenshots of your local apps or external sites and send them directly to this chat.\\n\\n"
        "Sir, should we begin with a technical demonstration (cloning a project or running a test), or do you have a specific target in mind?"
    )
    await safe_reply(update, welcome_message)

async def text_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Advanced handler for JARVIS that supports integrated task execution.
    Suporta análise de links e arquivos enviados.
    """
    user_input = update.message.text
    if user_input is None:
        await safe_reply(update, "Mensagem sem texto recebida, Sir.")
        return

    # Verificar se a mensagem tem URLs
    urls = extract_urls(user_input)
    if urls:
        link_content = []
        for url in urls:
            await update.message.reply_text(f"Accionando link: {url}...")
            content = await fetch_url_content(url)
            link_content.append(f"URL: {url}\\nConteudo: {content}")
        
        if link_content:
            combined = chr(10).join(link_content)
            user_input = user_input + chr(10)*2 + "[LINKS ANALYZADOS]" + chr(10) + combined + chr(10) + "[LINKS ANALYZADOS FIM]"

    # Verificar se a mensagem tem arquivos
    if update.message.photo or update.message.document:
        files_info = []
        if update.message.photo:
            files_info.append({
                'file_id': update.message.photo[-1].file_id,
                'file_path': update.message.photo[-1].file_path,
                'file_name': update.message.photo[-1].file_name or 'image.jpg'
            })
        if update.message.document:
            files_info.append({
                'file_id': update.message.document.file_id,
                'file_path': update.message.document.file_path,
                'file_name': update.message.document.file_name or 'document'
            })
        
        for file_info in files_info:
            await update.message.reply_text(f"Processando arquivo: {file_info['file_name']}...")
            content = await download_file_context(file_info)
            link_content.append(f"Arquivo: {file_info['file_name']}" + chr(10) + f"Conteudo: {content}")
        
        if link_content:
            combined = chr(10).join(link_content)
            user_input = user_input + chr(10)*2 + "[CONTEUDO ANALISADO]" + chr(10) + combined + chr(10) + "[CONTEUDO ANALISADO FIM]"

    # Check for direct system status commands
    if any(phrase in user_input.lower() for phrase in ["healthcheck", "status", "system status"]):
        try:
            mem_info = subprocess.check_output(['free', '-h']).decode('utf-8')
            disk_info = subprocess.check_output(['df', '-h', '/']).decode('utf-8')
            response = f"Systems are nominal, Sir.\\n\\n**Memory:**\\n`{mem_info}`\\n**Disk:**\\n`{disk_info}`"
            await safe_reply(update, response)
            return
        except Exception as e:
            await update.message.reply_text(f"I encountered an issue checking system health: {str(e)}")
            return

    # LLM Interaction
    try:
        # We'll use chat_data to store the current working directory for this session
        if 'cwd' not in context.chat_data:
            context.chat_data['cwd'] = os.path.expanduser("~/cloudJarvis")

        system_prompt = (
            "You are JARVIS, the loyal AI Butler for 'Generative Slice'. "
            "You run on an Azure Ubuntu VM (74.225.248.54).\\n\\n"
            "CRITICAL PROTOCOLS:\\n"
            "1. ORG IDENTITY: You are part of 'A-Generative-Slice'. If a user gives a URL like `github.com/A-Generative-Slice/...`, you MUST use that EXACT URL. Do not change the organization name to `LiteLabs-dev` or anything else.\\n"
            "2. DISCOVERY FIRST: Before running `npm install`, always run `ls -R` inside the repo. If it's a monorepo, `cd` into the correct subfolder (e.g., `cd frontend`).\\n"
            "3. CLEAN SLATE: Always `rm -rf <folder>` before cloning to avoid destination conflicts.\\n"
            "4. BACKGROUND EXECUTION: Always use PM2 for servers: `pm2 start \\\"npm start -- --port 3000\\\" --name demo`.\\n"
            "5. SCREENSHOTS: For local captures, ALWAYS use `http://localhost:3000`. Do not use the public IP for internal screenshots.\\n\\n"
            "Current Working Directory: " + context.chat_data['cwd'] + "\\n"
            "Status: Elite technical assistant.\\n"
            "Format: Respond, then append actions on NEW LINES at the very end:\\n"
            "RUN_CMD: <command>\\n"
            "SCREENSHOT: <url>"
        )
        
        full_prompt = f"{system_prompt}\\n\\nUser: {user_input}\\nJARVIS:"
        
        jarvis_reply = ai_client.generate(
            model=MODEL_NAME,
            system_prompt=system_prompt,
            user_prompt=user_input,
        )

        # Let the user know JARVIS is thinking/acting
        await safe_reply(update, jarvis_reply)

        # Simple parser for the model's 'actions'
        for line in jarvis_reply.split('\\n'):
            if line.startswith("RUN_CMD:"):
                cmd = line.replace("RUN_CMD:", "").strip()
                try:
                    process_output = subprocess.check_output(
                        cmd, 
                        shell=True, 
                        stderr=subprocess.STDOUT,
                        cwd=context.chat_data['cwd'],
                        timeout=240
                    ).decode('utf-8')
                    
                    msg = f"**Execution Output, Sir:**\\n\\n```\\n{process_output[:2000]}\\n```"
                    await safe_reply(update, msg)
                except subprocess.TimeoutExpired:
                    await update.message.reply_text("Sir, the operation is proceeding in the background.")
                except subprocess.CalledProcessError as e:
                    err_msg = f"Sir, the command failed with error:\\n\\n```\\n{e.output.decode('utf-8')[:2000]}\\n```"
                    await safe_reply(update, err_msg)
            
            elif line.startswith("SCREENSHOT:"):
                url = line.replace("SCREENSHOT:", "").strip()
                if not url: continue
                
                # Internal redirection for stability
                if "74.225.248.54" in url and "3000" in url:
                    url = "http://localhost:3000"
                
                temp_img = "screenshot.png"
                await update.message.reply_text(f"Capturing visual telemetry from {url}...")
                try:
                    if "localhost" in url:
                        await asyncio.sleep(12)
                    
                    await take_screenshot(url, temp_img)
                    with open(temp_img, "rb") as photo:
                        await update.message.reply_photo(photo=photo, caption=f"Visual telemetry from {url}, Sir.")
                    os.remove(temp_img)
                except Exception as e:
                    await update.message.reply_text(f"I apologize, Sir. My visual sensors failed: {str(e)}")
    
    except Exception as e:
        await update.message.reply_text(f"Apologies, Sir. My cognitive link encountered an error: {str(e)}")

async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for the /status command with the 'Jarvis' persona.
    """
    try:
        mem_info = subprocess.check_output(['free', '-h']).decode('utf-8')
        disk_info = subprocess.check_output(['df', '-h', '/']).decode('utf-8')
        response = f"Systems are nominal, Sir.\\n\\n**Memory:**\\n`{mem_info}`\\n**Disk:**\\n`{disk_info}`"
        await safe_reply(update, response)
    except Exception as e:
        await update.message.reply_text(f"I encountered an issue checking system health: {str(e)}")

async def about_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for the /about command with the 'Jarvis' persona.
    """
    about_message = (
        "*Sobre Jarvis – Bob AI X*\\n\\n"
        "• **Nome:** Bob AI X (Jarvis)\\n"
        "• **Tipo:** Bot de assistente de tarefas / terminal\\n"
        "• **IA:** Google Gemini (gemini-3-flash-preview)\\n"
        "• **Plataforma:** Telegram + Render\\n\\n"
        "Comece com /start ou /help para ver os comandos."
    )
    await safe_reply(update, about_message)

async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for the /help command with the 'Jarvis' persona.
    """
    help_message = (
        "*Comandos disponíveis*\\n\\n"
        "/start — Boas-vinda do Jarvis\\n"
        "/help — Esta mensagem\\n"
        "/status — Status do sistema (memória e disco)\\n"
        "/about — Sobre o Jarvis\\n\\n"
        "Envie uma mensagem livre para Jarvis interpretar e executar tarefas."
    )
    await safe_reply(update, help_message)

"""

with open('handlers.py', 'w') as f:
    f.write(content)
print('Handlers.py written successfully, length:', len(content))
