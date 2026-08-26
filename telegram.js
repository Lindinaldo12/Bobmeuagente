require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const pdfParse = require('pdf-parse');

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

// Busca dinamicamente os modelos GRATUITOS e ATIVOS na OpenRouter
async function obterModelosGratuitosAtivos(eFoto = false) {
    try {
        const res = await fetch('https://openrouter.ai/api/v1/models');
        if (res.ok) {
            const json = await res.json();
            const todosModelos = json.data || [];

            const gratis = todosModelos.filter(m => 
                m.id.endsWith(':free') || (m.pricing && m.pricing.prompt === '0')
            );

            if (eFoto) {
                const visao = gratis.filter(m => 
                    (m.architecture && m.architecture.modality && m.architecture.modality.includes('image')) ||
                    m.id.includes('vision') || 
                    m.id.includes('vl') || 
                    m.id.includes('dots') ||
                    m.id.includes('gemini')
                ).map(m => m.id);

                if (visao.length > 0) return visao;
            } else {
                const texto = gratis.map(m => m.id);
                if (texto.length > 0) return texto;
            }
        }
    } catch (e) {
        console.log('⚠️ Falha ao buscar lista dinâmica da OpenRouter, usando fallback.');
    }

    if (eFoto) {
        return [
            'dots-studio/dots-3-note-preview:free',
            'google/gemini-2.0-flash-lite-preview-02-05:free',
            'meta-llama/llama-3.2-11b-vision-instruct:free'
        ];
    } else {
        return [
            'meta-llama/llama-3.1-8b-instruct:free',
            'qwen/qwen-2.5-72b-instruct:free',
            'google/gemini-2.0-flash-lite-preview-02-05:free'
        ];
    }
}

// Função para chamar a IA no OpenRouter
async function chamarOpenRouter(messages, eFoto = false) {
    if (!apiKey) {
        throw new Error('Chave de API não configurada no Render (OPENROUTER_API_KEY ou API_KEY).');
    }

    const modelos = await obterModelosGratuitosAtivos(eFoto);
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
                console.log(`✅ Resposta gerada com o modelo ativo: ${model}`);
                return data.choices[0].message.content;
            } else if (data.error) {
                console.log(`⚠️ Modelo ${model} indisponível: ${data.error.message || 'Erro'}. Testando próximo...`);
                ultimoErro = new Error(data.error.message || 'Erro no modelo');
            }
        } catch (err) {
            console.log(`⚠️ Erro de conexão no modelo ${model}: ${err.message}`);
            ultimoErro = err;
        }
    }

    throw ultimoErro || new Error('Nenhum modelo gratuito disponível no momento.');
}

// 💬 1. RESPONDER TEXTOS
bot.on('message', async (msg) => {
    if (msg.photo || msg.document || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá Lindinaldo! Eu sou o **Bob AI X**.\n\nEnvie qualquer texto, **foto** ou **arquivo (PDF/TXT)** para eu analisar!', { parse_mode: 'Markdown' });
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

// 📸 2. ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || "Analise esta imagem em detalhes. Se houver qualquer texto ou documento, leia e resuma o conteúdo de forma clara e objetiva.";

    try {
        bot.sendMessage(chatId, '👀 *Analisando a foto...*', { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);

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

// 📄 3. ANALISAR ARQUIVOS (PDF E TXT)
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const doc = msg.document;
    const fileName = doc.file_name || 'arquivo';
    const caption = msg.caption || "Faça um resumo completo e analise o conteúdo deste documento de forma clara, organizada e didática.";

    try {
        bot.sendMessage(chatId, `📄 *Lendo o arquivo ${fileName}...*`, { parse_mode: 'Markdown' });
        bot.sendChatAction(chatId, 'typing');

        const fileLink = await bot.getFileLink(doc.file_id);
        const fileRes = await fetch(fileLink);

        let textoExtraido = '';

        // Processa arquivo TXT
        if (fileName.toLowerCase().endsWith('.txt') || doc.mime_type === 'text/plain') {
            textoExtraido = await fileRes.text();
        } 
        // Processa arquivo PDF
        else if (fileName.toLowerCase().endsWith('.pdf') || doc.mime_type === 'application/pdf') {
            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfData = await pdfParse(buffer);
            textoExtraido = pdfData.text;
        } else {
            bot.sendMessage(chatId, '⚠️ No momento consigo ler apenas arquivos **.PDF** e **.TXT**.');
            return;
        }

        if (!textoExtraido || textoExtraido.trim().length === 0) {
            bot.sendMessage(chatId, '⚠️ Não consegui extrair texto deste arquivo (pode ser um PDF escaneado como imagem pura).');
            return;
        }

        // Limita o texto para os primeiros 15.000 caracteres (evita estourar limite da IA)
        const textoLimitado = textoExtraido.slice(0, 15000);
        const avisoTamanho = textoExtraido.length > 15000 ? '\n\n*(Nota: Documento muito longo. Foi lido até os primeiros 15.000 caracteres).*' : '';

        const messages = [
            { role: 'system', content: 'Você é o Bob AI X, um especialista em resumir e explicar documentos enviados pelo usuário.' },
            { role: 'user', content: `${caption}\n\n--- CONTEÚDO DO ARQUIVO (${fileName}) ---\n${textoLimitado}\n--- FIM DO ARQUIVO ---` }
        ];

        const resposta = await chamarOpenRouter(messages, false);
        bot.sendMessage(chatId, resposta + avisoTamanho);

    } catch (error) {
        console.error('❌ Erro no documento:', error.message);
        bot.sendMessage(chatId, `⚠️ Erro ao processar o documento: ${error.message}`);
    }
});

bot.on('polling_error', (error) => {
    if (!error.message.includes('409 Conflict')) {
        console.error('❌ Erro no polling:', error.message);
    }
});

module.exports = bot;
