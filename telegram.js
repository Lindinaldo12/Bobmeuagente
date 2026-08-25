require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

let aiModel = null;
if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    aiModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: 'Você é o Bob AI X, um assistente virtual inteligente e muito prestativo.'
    });
    console.log('🧠 Gemini AI pronto para uso!');
} else {
    console.log('⚠️ GEMINI_API_KEY ausente nas variáveis de ambiente.');
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`📨 Mensagem de ${msg.from.first_name}: ${text}`);

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá! Eu sou o **Bob AI X**. Como posso ajudar você hoje?', { parse_mode: 'Markdown' });
        return;
    }

    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Chave da IA não encontrada nas variáveis de ambiente do Render.');
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const result = await aiModel.generateContent(text);
        const response = result.response.text();
        bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('❌ Erro na API do Gemini:', error);
        bot.sendMessage(chatId, `Erro na IA: ${error.message || 'Falha na resposta'}`);
    }
});

bot.on('polling_error', (error) => {
    console.error('❌ Erro no polling:', error.message);
});

module.exports = bot;
