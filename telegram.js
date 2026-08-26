require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Configura o Gemini (Com suporte a Visão/Fotos)
let aiModel = null;
if (geminiKey) {
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        aiModel = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'Você é o Bob AI X, um assistente virtual inteligente com capacidade de analisar texto e imagens enviadas pelo usuário.'
        });
        console.log('🧠 IA Gemini (com suporte a Fotos) conectada!');
    } catch (e) {
        console.error('❌ Erro ao configurar Gemini:', e.message);
    }
}

// 📩 1. RESPOSTA PARA MENSAGENS DE TEXTO
bot.on('message', async (msg) => {
    // Ignora se for foto (pois a foto é tratada na função bot.on('photo'))
    if (msg.photo || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá! Eu sou o **Bob AI X**.\n\n✨ Agora posso:\n1. Responder perguntas por texto.\n2. **Analisar fotos!** (Basta me enviar uma imagem ou tirar uma foto com uma legenda).', { parse_mode: 'Markdown' });
        return;
    }

    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Chave da IA não configurada.');
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const result = await aiModel.generateContent(text);
        bot.sendMessage(chatId, result.response.text());
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, 'Ocorreu um erro ao processar sua pergunta.');
    }
});

// 🖼️ 2. RESPOSTA PARA ENVIO DE FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const caption = msg.caption || "Descreva e analise esta imagem em detalhes. Se for um texto ou documento, leia o conteúdo.";

    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Chave da IA não configurada.');
        return;
    }

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        // Pega a foto de maior resolução
        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        // Baixa a foto e converte para o formato que a IA aceita (base64)
        const response = await fetch(fileLink);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        };

        // Envia a imagem e a legenda/pergunta para o Gemini
        const result = await aiModel.generateContent([caption, imagePart]);
        const replyText = result.response.text();

        bot.sendMessage(chatId, replyText);

    } catch (error) {
        console.error('❌ Erro ao analisar foto:', error.message);
        bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao tentar analisar a imagem.');
    }
});

bot.on('polling_error', (error) => console.error('❌ Erro no polling:', error.message));

module.exports = bot;
