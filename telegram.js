const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

const TOKEN = process.env.TELEGRAM_TOKEN;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.AI_MODEL || 'gemini-3.8-flash';
const MODEL_OPENROUTER = process.env.OPENROUTER_MODEL || 'google/gemini-3.8-flash';
const MAX_HISTORICO = parseInt(process.env.MAX_HISTORICO || '20', 10);

if (!TOKEN) {
  console.error('TELEGRAM_TOKEN ausente. Bot nao iniciado.');
  module.exports = {};
} else {
  const bot = new TelegramBot(TOKEN, { polling: true });

  const SYSTEM_PROMPT =
    'Voce e o Bob, assistente pessoal direto e objetivo. ' +
    'Responda em portugues do Brasil, com respostas curtas.';

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
        model: MODEL_OPENROUTER,
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
    const erros = [];

    if (GOOGLE_KEY) {
      try {
        return await chamarGemini(historico, imagem);
      } catch (err) {
        const msg = err.message || String(err);
        console.error('Gemini falhou:', msg);
        erros.push(`Gemini: ${msg.slice(0, 200)}`);
      }
    }

    if (OPENROUTER_KEY) {
      try {
        return await chamarOpenRouter(historico);
      } catch (err) {
        const msg = err.message || String(err);
        console.error('OpenRouter falhou:', msg);
        erros.push(`OpenRouter: ${msg.slice(0, 200)}`);
      }
    }

    if (!erros.length) {
      throw new Error('Nenhuma chave de IA configurada.');
    }
    throw new Error(erros.join(' | '));
  }

  async function responder(msg, texto, imagem) {
    const chatId = msg.chat.id;
    db.salvar(chatId, 'user', texto || '');

    try {
      const historico = db.buscar(chatId, MAX_HISTORICO);
      const resposta = await gerarResposta(historico, imagem);
      db.salvar(chatId, 'assistant', resposta);
      await bot.sendMessage(chatId, resposta);
    } catch (err) {
      console.error('Erro ao responder:', err.message);
      await bot.sendMessage(
        chatId,
        'Nao consegui falar com a IA agora. Detalhe tecnico:\n' +
          err.message.slice(0, 300)
      );
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
    db.limpar(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Historico limpo.');
  });

  bot.onText(/\/status/, (msg) => {
    const linhas = [
      `Modelo: ${MODEL}`,
      `Gemini: ${GOOGLE_KEY ? 'configurado' : 'ausente'}`,
      `OpenRouter: ${OPENROUTER_KEY ? 'configurado' : 'ausente'}`,
    ];
    bot.sendMessage(msg.chat.id, linhas.join('\n'));
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
