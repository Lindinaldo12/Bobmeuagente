require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado no .env / Render!');
    process.exit(1);
}

// Inicializa o Bot do Telegram
const bot = new TelegramBot(token, { polling: true });

// Inicializa a IA Gemini (Gratuita e Rápida)
let aiModel = null;
if (geminiKey) {
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        aiModel = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'Você é o Bob AI X, um assistente virtual inteligente, prestativo e amigável.'
        });
        console.log('🧠 IA Google Gemini conectada com sucesso!');
    } catch (e) {
        console.error('❌ Erro ao configurar Gemini:', e.message);
    }
} else {
    console.log('⚠️ GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
}

console.log('✅ telegram.js carregado com sucesso');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`📨 Mensagem de ${msg.from.first_name || 'Usuário'}: ${text}`);

    // Comando /start
    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá! Eu sou o **Bob AI X**, seu assistente inteligente. Como posso te ajudar hoje?', { parse_mode: 'Markdown' });
        return;
    }

    // Se nenhuma chave de IA estiver pronta
    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Nenhuma chave de IA foi configurada no Render. Configure a `GEMINI_API_KEY` nas variáveis de ambiente.');
        return;
    }

    try {
        // Envia ação de "digitando..." no Telegram
        bot.sendChatAction(chatId, 'typing');

        // Gera a resposta com a IA
        const result = await aiModel.generateContent(text);
        const response = result.response.text();

        bot.sendMessage(chatId, response);
    } catch (error) {
        console.error('❌ Erro ao gerar resposta da IA:', error.message);
        bot.sendMessage(chatId, 'Desculpe, ocorreu um erro temporário ao processar sua resposta na IA. Tente novamente em instantes.');
    }
});

bot.on('polling_error', (error) => {
    console.error('❌ Erro no polling do Telegram:', error.message);
});

module.exports = bot;
