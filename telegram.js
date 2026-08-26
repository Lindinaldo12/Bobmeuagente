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
    console.log('⚡ IA Groq conectada com sucesso!');
} else {
    console.log('⚠️ GROQ_API_KEY ausente nas variáveis do Render.');
}

// Função inteligente que testa modelos de texto da Groq em sequência
async function responderTextoGroq(text) {
    const modelosText = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'];
    let ultimoErro = null;

    for (const model of modelosText) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'Você é o Bob AI X, um assistente virtual inteligente, útil e amigável criado para ajudar o Lindinaldo.' },
                    { role: 'user', content: text }
                ],
                model: model,
            });
            return completion.choices[0]?.message?.content || 'Sem resposta.';
        } catch (err) {
            ultimoErro = err;
            console.log(`⚠️ Modelo ${model} falhou: ${err.message}. Testando próximo...`);
        }
    }
    throw ultimoErro;
}

// Função inteligente para analisar foto com Groq
async function analisarFotoGroq(prompt, fileLink) {
    const modelosVisao = ['llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview'];
    let ultimoErro = null;

    for (const model of modelosVisao) {
        try {
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
                model: model,
            });
            return completion.choices[0]?.message?.content || 'Não consegui analisar a imagem.';
        } catch (err) {
            ultimoErro = err;
            console.log(`⚠️ Modelo de visão ${model} falhou: ${err.message}. Testando próximo...`);
        }
    }
    throw ultimoErro;
}

// 💬 RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**, turbinado com a IA ultra-rápida da **Groq**!⚡\n\nEnvie qualquer texto ou foto para conversarmos!', { parse_mode: 'Markdown' });
        return;
    }

    if (!groq) {
        bot.sendMessage(chatId, '⚠️ Chave `GROQ_API_KEY` não configurada no Render.');
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const resposta = await responderTextoGroq(text);
        bot.sendMessage(chatId, resposta);
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, `⚠️ Erro na IA: ${error.message}`);
    }
});

// 📸 ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || "Analise e descreva esta imagem em detalhes. Se houver texto, leia e resuma o conteúdo de forma simples.";

    if (!groq) {
        bot.sendMessage(chatId, '⚠️ Chave `GROQ_API_KEY` não configurada no Render.');
        return;
    }

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        const resposta = await analisarFotoGroq(prompt, fileLink);
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
