require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado no Render!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Valida se a chave é do Google Gemini (deve começar com AIza)
let aiReady = false;
if (geminiKey && geminiKey.startsWith('AIza')) {
    aiReady = true;
    console.log('🧠 Chave válida do Google Gemini conectada!');
} else {
    console.log('⚠️ GEMINI_API_KEY inválida ou ausente no Render. A chave DEVE começar com "AIza".');
}

async function processarIA(prompt, imagePart = null) {
    if (!aiReady) {
        throw new Error('Chave GEMINI_API_KEY inválida no Render. Crie uma chave gratuita no site: aistudio.google.com/app/apikey e salve nas variáveis do Render.');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const input = imagePart ? [prompt, imagePart] : prompt;
    const res = await model.generateContent(input);
    return res.response.text();
}

// 💬 RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**.\n\nEnvie qualquer pergunta por texto ou **mande uma foto** para eu analisar!', { parse_mode: 'Markdown' });
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const resposta = await processarIA(text);
        bot.sendMessage(chatId, resposta);
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, `⚠️ ${error.message}`);
    }
});

// 📸 ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || "Analise esta imagem em detalhes. Se houver qualquer texto, documento ou anotação, leia e resuma o conteúdo de forma clara e simples.";

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        const response = await fetch(fileLink);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        };

        const resposta = await processarIA(prompt, imagePart);
        bot.sendMessage(chatId, resposta);

    } catch (error) {
        console.error('❌ Erro na foto:', error.message);
        bot.sendMessage(chatId, `⚠️ ${error.message}`);
    }
});

bot.on('polling_error', (error) => {
    if (!error.message.includes('409 Conflict')) {
        console.error('❌ Erro no polling:', error.message);
    }
});

module.exports = bot;
