require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY || process.env.GROQ_API_KEY;

if (!token) {
    console.error('❌ TELEGRAM_TOKEN não configurado no Render!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

if (apiKey) {
    console.log('⚡ Conectado à OpenRouter com sucesso!');
} else {
    console.log('⚠️ Chave de API ausente nas variáveis do Render.');
}

// Função para chamar a IA no OpenRouter com fallback automático de modelos
async function chamarOpenRouter(messages, eFoto = false) {
    if (!apiKey) {
        throw new Error('Chave de API não configurada no Render (OPENROUTER_API_KEY ou API_KEY).');
    }

    // Modelos gratuitos e estáveis no OpenRouter
    const modelosTexto = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-r1:free',
        'openrouter/auto'
    ];

    const modelosVisao = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'qwen/qwen-2-vl-7b-instruct:free'
    ];

    const modelos = eFoto ? modelosVisao : modelosTexto;
    let ultimoErro = null;

    for (const model of modelos) {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://bobmeuagente.onrender.com',
                    'X-Title': 'Bob AI X',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });

            const data = await res.json();

            if (res.ok && data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
            } else if (data.error) {
                console.log(`⚠️ Modelo OpenRouter ${model} falhou: ${data.error.message || JSON.stringify(data.error)}. Testando próximo...`);
                ultimoErro = new Error(data.error.message || 'Erro no modelo');
            }
        } catch (err) {
            console.log(`⚠️ Erro na requisição do modelo ${model}: ${err.message}`);
            ultimoErro = err;
        }
    }

    throw ultimoErro || new Error('Todos os modelos de IA falharam.');
}

// 💬 RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**.\n\nEnvie qualquer texto ou foto para conversarmos!', { parse_mode: 'Markdown' });
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        const messages = [
            { role: 'system', content: 'Você é o Bob AI X, um assistente virtual inteligente e útil criado para ajudar o Lindinaldo.' },
            { role: 'user', content: text }
        ];
        const resposta = await chamarOpenRouter(messages, false);
        bot.sendMessage(chatId, resposta);
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        bot.sendMessage(chatId, `⚠️ Erro na IA: ${error.message}`);
    }
});

// 📸 ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || "Analise esta imagem em detalhes. Se houver qualquer texto ou documento, leia e resuma o conteúdo de forma clara e objetiva.";

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

        // Converte a imagem do Telegram em Data URI Base64
        const imgRes = await fetch(fileLink);
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64String}`;

        const messages = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUrl } }
                ]
            }
        ];

        const resposta = await chamarOpenRouter(messages, true);
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
