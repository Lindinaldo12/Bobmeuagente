require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');

const token = process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const groqApiKey = process.env.GROQ_API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado no Render!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

let groq = null;
if (groqApiKey) {
    groq = new Groq({ apiKey: groqApiKey });
    console.log('⚡ IA Groq (Llama 3.3) conectada com sucesso!');
} else {
    console.log('⚠️ GROQ_API_KEY ausente nas variáveis de ambiente do Render.');
}

// 💬 RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**, agora turbinado com a IA **Llama 3 (Groq)**!⚡\n\nEnvie qualquer texto ou foto para conversarmos!', { parse_mode: 'Markdown' });
        return;
    }

    if (!groq) {
        bot.sendMessage(chatId, '⚠️ Chave `GROQ_API_KEY` não configurada no Render.');
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Você é o Bob AI X, um assistente virtual inteligente, útil e amigável.' },
                { role: 'user', content: text }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const resposta = completion.choices[0]?.message?.content || 'Sem resposta.';
        bot.sendMessage(chatId, resposta);

    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, `⚠️ Erro na IA: ${error.message}`);
    }
});

// 📸 ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || "Analise e descreva esta imagem em detalhes. Se houver texto, leia e resuma o conteúdo.";

    if (!groq) {
        bot.sendMessage(chatId, '⚠️ Chave `GROQ_API_KEY` não configurada no Render.');
        return;
    }

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: fileLink } }
                    ]
                }
            ],
            model: 'llama-3.2-11b-vision-preview',
        });

        const resposta = completion.choices[0]?.message?.content || 'Não consegui analisar a imagem.';
        bot.sendMessage(chatId, resposta);

    } catch (error) {
        console.error('❌ Erro na foto:', error.message);
        bot.sendMessage(chatId, `⚠️ Erro na análise da foto: ${error.message}`);
    }
});

bot.on('polling_error', (error) => {
    if (!error.message.includes('409 Conflict')) {
        console.error('❌ Erro no polling:', error.message);
    }
});

module.exports = bot;
