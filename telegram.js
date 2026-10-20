const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const TOKEN = process.env.TELEGRAM_TOKEN;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';
const MAX_HISTORICO = parseInt(process.env.MAX_HISTORICO || '20', 10);

if (!TOKEN) {
  console.error('TELEGRAM_TOKEN ausente. Bot nao iniciado.');
  module.exports = {};
} else {
  const bot = new TelegramBot(TOKEN, { polling: true });
  const historicos = new Map();

  const SYSTEM_PROMPT =
    'Voce e o Bob, assistente pessoal direto e objetivo. ' +
    'Responda em portugues do Brasil, com respostas curtas.';

  function getHistorico(chatId) {
    if (!historicos.has(chatId)) historicos.set(chatId, []);
    return historicos.get(chatId);
  }

  function pushHistorico(chatId, role, content) {
    const h = getHistorico(chatId);
    h.push({ role, content });
    while (h.length > MAX_HISTORICO) h.shift();
  }

  async function chamarGemini(historico, imagem) {
    const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    const contents = historico.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (imagem) {
      const ultima = contents[contents.length - 1];
      ultima.parts.push({
        inlineData: { data: imagem.data, mimeType: imagem.mimeType },
      });
    }

    const result = await model.generateContent({ contents });
    return result.response.text();
  }

  async function chamarOpenRouter(historico) {
    const base = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';
    const resp = await axios.post(
      `${base}/chat/completions`,
      {
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historico],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return resp.data.choices[0].message.content;
  }

  async function gerarResposta(historico, imagem) {
    if (GOOGLE_KEY) {
      try {
        return await chamarGemini(historico, imagem);
      } catch (err) {
        console.error('Gemini falhou:', err.message);
        if (!OPENROUTER_KEY) throw err;
      }
    }
    if (OPENROUTER_KEY) {
      return await chamarOpenRouter(historico);
    }
    throw new Error('Nenhuma chave de IA configurada.');
  }

  async function responder(msg, texto, imagem) {
    const chatId = msg.chat.id;
    pushHistorico(chatId, 'user', texto || '');

    try {
      const resposta = await gerarResposta(getHistorico(chatId), imagem);
      pushHistorico(chatId, 'assistant', resposta);
      await bot.sendMessage(chatId, resposta);
    } catch (err) {
      console.error('Erro ao responder:', err.message);
      await bot.sendMessage(chatId, 'Deu erro aqui. Tenta de novo em instantes.');
    }
  }

  async function baixarArquivo(fileId) {
    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(resp.data);
  }

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Oi. Sou o Bob. Manda texto, foto ou PDF.');
  });

  bot.onText(/\/reset/, (msg) => {
    historicos.delete(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Historico limpo.');
  });

  bot.on('photo', async (msg) => {
    try {
      const foto = msg.photo[msg.photo.length - 1];
      const buffer = await baixarArquivo(foto.file_id);
      await responder(msg, msg.caption || 'Descreva esta imagem.', {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg',
      });
    } catch (err) {
      console.error('Erro na foto:', err.message);
      bot.sendMessage(msg.chat.id, 'Nao consegui ler a imagem.');
    }
  });

  bot.on('document', async (msg) => {
    try {
      const doc = msg.document;
      if (doc.mime_type !== 'application/pdf') {
        return bot.sendMessage(msg.chat.id, 'Por enquanto eu leio apenas PDF.');
      }
      const buffer = await baixarArquivo(doc.file_id);
      const pdf = await pdfParse(buffer);
      const texto = `Conteudo do PDF:\n\n${pdf.text.slice(0, 10000)}`;
      await responder(msg, msg.caption ? `${msg.caption}\n\n${texto}` : texto);
    } catch (err) {
      console.error('Erro no PDF:', err.message);
      bot.sendMessage(msg.chat.id, 'Nao consegui ler o PDF.');
    }
  });

  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      responder(msg, msg.text);
    }
  });

  bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
  });

  console.log('Telegram conectado. Modelo:', MODEL);
  module.exports = { bot };
}
