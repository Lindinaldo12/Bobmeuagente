'use strict';

require('dotenv').config();
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const kernel = require('./kernel');
const { textoAjuda, textoBoasVindas } = require('./ia/comandos');

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) {
  console.error('ERRO: variável TELEGRAM_TOKEN não definida.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Health check para o Render (Web Service)
const PORT = process.env.PORT;
if (PORT) {
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bob online');
  }).listen(PORT, () => console.log(`Health check na porta ${PORT}`));
}

async function enviar(chatId, texto) {
  const LIMITE = 4000;
  const t = String(texto || '').trim() || '(sem conteúdo)';
  for (let i = 0; i < t.length; i += LIMITE) {
    await bot.sendMessage(chatId, t.slice(i, i + LIMITE));
  }
}

async function baixarArquivo(fileId) {
  const link = await bot.getFileLink(fileId);
  const resp = await fetch(link);
  if (!resp.ok) throw new Error('Falha ao baixar o arquivo do Telegram.');
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = (msg.text || '').trim();

  try {
    if (texto === '/start') return enviar(chatId, textoBoasVindas());
    if (texto === '/help') return enviar(chatId, textoAjuda());

    if (texto === '/limpar') {
      kernel.limparHistorico(chatId);
      return enviar(chatId, 'Histórico apagado.');
    }

    if (texto === '/resumo') {
      await bot.sendChatAction(chatId, 'typing');
      return enviar(chatId, await kernel.resumirUltimoArquivo(chatId));
    }

    if (msg.document) {
      await bot.sendChatAction(chatId, 'typing');
      const buffer = await baixarArquivo(msg.document.file_id);
      const r = await kernel.processarArquivo(
        chatId,
        buffer,
        msg.document.file_name,
        msg.document.mime_type
      );
      return enviar(chatId, r);
    }

    if (texto) {
      await bot.sendChatAction(chatId, 'typing');
      return enviar(chatId, await kernel.responder(chatId, texto));
    }

    return enviar(chatId, 'Envie texto, PDF ou TXT.');
  } catch (erro) {
    console.error('Erro:', erro.message);
    return enviar(chatId, `Erro: ${erro.message}`);
  }
});

bot.on('polling_error', (e) => console.error('Polling error:', e.message));

console.log('Bob iniciado.');
