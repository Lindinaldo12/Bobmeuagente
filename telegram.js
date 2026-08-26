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

// Inicializa a IA Gemini (visão de fotos)
let aiModel = null;
if (geminiKey) {
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        aiModel = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'Você é o Bob AI X. Quando receber fotos, analise tudo detalhadamente. Se houver texto na imagem, leia e transcreva em linguagem simples e objetiva.'
        });
        console.log('🧠 IA com Visão de Imagens ativada!');
    } catch (e) {
        console.error('❌ Erro na IA:', e.message);
    }
}

// 💬 RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || !msg.text) return; // Se for foto, ignora aqui

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**.\n\nEnvie qualquer texto ou **mande uma foto** para eu analisar!', { parse_mode: 'Markdown' });
        return;
    }

    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Chave da IA não configurada no Render.');
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const result = await aiModel.generateContent(text);
        bot.sendMessage(chatId, result.response.text());
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar seu texto.');
    }
});

// 📸 ANALISAR FOTOS INSTANTANEAMENTE
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    // Se você colocou legenda na foto, usa ela. Se não, usa um comando padrão:
    const prompt = msg.caption || "Analise esta imagem em detalhes. Se houver qualquer texto, documento, livro ou anotação, leia e resuma o conteúdo de forma clara e simples.";

    if (!aiModel) {
        bot.sendMessage(chatId, '⚠️ Chave da IA não configurada no Render.');
        return;
    }

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        // Pega a foto de maior qualidade
        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        // Baixa a foto e converte para leitura da IA
        const response = await fetch(fileLink);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        };

        // Envia para a IA
        const result = await aiModel.generateContent([prompt, imagePart]);
        const replyText = result.response.text();

        bot.sendMessage(chatId, replyText);

    } catch (error) {
        console.error('❌ Erro na análise da foto:', error.message);
        bot.sendMessage(chatId, 'Desculpe, não consegui ler/analisar esta imagem.');
    }
});

bot.on('polling_error', (error) => console.error('❌ Erro no polling:', error.message));

module.exports = bot;
