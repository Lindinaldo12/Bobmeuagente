const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const db = require('./db');

if (!config.telegramToken) {
  console.error('Token do Telegram ausente. Bot nao iniciado.');
  module.exports = {};
} else {
  const bot = new TelegramBot(config.telegramToken, { polling: true });
  const uso = new Map();

  function autorizado(chatId) {
    if (config.acessoLiberado) return true;
    return config.allowedIds.includes(String(chatId));
  }

  function dentroDoLimite(chatId) {
    const id = String(chatId);
    const agora = Date.now();
    const marcas = (uso.get(id) || []).filter((t) => agora - t < 60000);
    if (marcas.length >= config.rateLimit) {
      uso.set(id, marcas);
      return false;
    }
    marcas.push(agora);
    uso.set(id, marcas);
    return true;
  }

  async function tentarGemini(modelo, historico, imagem) {
    const genAI = new GoogleGenerativeAI(config.googleKey);
    const model = genAI.getGenerativeModel({
      model: modelo,
      systemInstruction: config.persona,
    });

    const contents = historico.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (imagem) {
      contents[contents.length - 1].parts.push({
        inlineData: { data: imagem.data, mimeType: imagem.mimeType },
      });
    }

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: config.temperatura,
        maxOutputTokens: config.maxTokens,
      },
    });
    return result.response.text();
  }

  async function chamarGemini(historico, imagem) {
    const erros = [];
    for (const modelo of config.modelos) {
      try {
        const texto = await tentarGemini(modelo, historico, imagem);
        if (texto) {
          if (modelo !== config.modelos[0]) console.log('Modelo em uso:', modelo);
          return texto;
        }
      } catch (err) {
        const msg = err.message || String(err);
        console.error(`Gemini ${modelo} falhou:`, msg.slice(0, 160));
        erros.push(`${modelo}: ${msg.slice(0, 120)}`);
        const valeTentarOutro = /404|429|not found|no longer available|quota/i.test(msg);
        if (!valeTentarOutro) break;
      }
    }
    throw new Error(erros.join(' | ') || 'Gemini sem resposta');
  }

  async function chamarFallback(historico) {
    const resp = await axios.post(
      `${config.fallbackUrl}/chat/completions`,
      {
        model: config.fallbackModel,
        messages: [{ role: 'system', content: config.persona }, ...historico],
      },
      {
        headers: {
          Authorization: `Bearer ${config.fallbackKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return resp.data.choices[0].message.content;
  }

  async function gerarResposta(historico, imagem) {
    const erros = [];

    if (config.googleKey) {
      try {
        return await chamarGemini(historico, imagem);
      } catch (err) {
        console.error('Gemini esgotado:', err.message.slice(0, 200));
        erros.push(`Gemini: ${err.message.slice(0, 150)}`);
      }
    }

    if (config.fallbackKey) {
      try {
        return await chamarFallback(historico);
      } catch (err) {
        console.error('Fallback falhou:', err.message.slice(0, 200));
        erros.push(`Fallback: ${err.message.slice(0, 150)}`);
      }
    }

    throw new Error(erros.join(' | ') || 'Nenhuma chave de IA configurada.');
  }

  async function responder(msg, texto, imagem) {
    const chatId = msg.chat.id;

    if (!autorizado(chatId)) {
      return bot.sendMessage(chatId, 'Acesso nao autorizado.');
    }
    if (!dentroDoLimite(chatId)) {
      return bot.sendMessage(chatId, 'Muitas mensagens seguidas. Aguarde um minuto.');
    }

    await db.salvar(chatId, 'user', texto || '');

    try {
      let historico = await db.buscar(chatId, config.maxHistorico);

      // Garante que a mensagem atual sempre chega ao modelo
      const ultima = historico[historico.length - 1];
      if (!ultima || ultima.content !== (texto || '')) {
        historico.push({ role: 'user', content: texto || '' });
      }

      const resposta = await gerarResposta(historico, imagem);
      await db.salvar(chatId, 'assistant', resposta);
      await bot.sendMessage(chatId, resposta);
    } catch (err) {
      console.error('Erro ao responder:', err.message);
      await bot.sendMessage(
        chatId,
        'Nao consegui falar com a IA agora.\nDetalhe: ' + err.message.slice(0, 250)
      );
    }
  }

  async function baixarArquivo(fileId) {
    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${config.telegramToken}/${file.file_path}`;
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(resp.data);
  }

  async function enviarMensagemDiaria() {
    if (!config.cronTarget) throw new Error('CRON_TARGET vazio');
    if (!config.cronMessage) throw new Error('CRON_MESSAGE vazio');
    await bot.sendMessage(config.cronTarget, config.cronMessage);
    console.log('Mensagem diaria enviada para', config.cronTarget);
  }

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Oi. Sou o ${config.botName}. Manda texto, foto ou PDF.`);
  });

  bot.onText(/\/id/, (msg) => {
    bot.sendMessage(msg.chat.id, `Seu chat_id: ${msg.chat.id}`);
  });

  bot.onText(/\/reset/, async (msg) => {
    await db.limpar(msg.chat.id);
    bot.sendMessage(msg.chat.id, 'Historico limpo.');
  });

  bot.onText(/\/status/, (msg) => {
    const linhas = [
      `Modelos: ${config.modelos.join(' > ')}`,
      `Gemini: ${config.googleKey ? 'ok' : 'ausente'}`,
      `Fallback: ${config.fallbackKey ? 'ok' : 'ausente'}`,
      `Memoria: ${db.modo()}`,
      `Acesso: ${config.acessoLiberado ? 'aberto' : config.allowedIds.length + ' autorizados'}`,
      `Limite: ${config.rateLimit} msg/min`,
      `Fuso: ${config.tz}`,
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
      const texto = `Conteudo do PDF:\n\n${pdf.text.slice(0, config.maxCharsArquivo)}`;
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

  console.log('Telegram conectado. Modelos:', config.modelos.join(' > '));
  module.exports = { bot, enviarMensagemDiaria };
}
