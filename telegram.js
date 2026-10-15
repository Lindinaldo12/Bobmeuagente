cat > telegram.js << 'FIM'
// telegram.js — Bob AI X (versão JARVIS completa)
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { registrar: registrarComandos, saudacaoPorHorario, detectarIntencao, executarIntencao } = require('./ia/comandos');

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

// 📦 Enviar mensagens longas sem estourar o limite de 4096
async function enviarMensagemLonga(chatId, texto, options = {}) {
    if (!texto) return;
    const LIMITE = 3800;
    if (texto.length <= LIMITE) {
        return await bot.sendMessage(chatId, texto, options);
    }
    let inicio = 0;
    while (inicio < texto.length) {
        const fim = Math.min(inicio + LIMITE, texto.length);
        await bot.sendMessage(chatId, texto.slice(inicio, fim), options);
        inicio = fim;
    }
}

// Busca modelos GRATUITOS e ATIVOS na OpenRouter
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
                    m.id.includes('vision') || m.id.includes('vl') ||
                    m.id.includes('dots') || m.id.includes('gemini')
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
    }
    return [
        'meta-llama/llama-3.1-8b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'google/gemini-2.0-flash-lite-preview-02-05:free'
    ];
}

// Chama a IA no OpenRouter
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
                body: JSON.stringify({ model: model, messages: messages })
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

// 🤖 Registra todos os comandos JARVIS
registrarComandos(bot, enviarMensagemLonga, chamarOpenRouter);

// 🌅 ROTINA DA MANHÃ — Bob fala primeiro, como o JARVIS
const CHAT_CRIADOR = process.env.CRIADOR_CHAT_ID || '8133082447';
let rotinaFeitaHoje = '';

setInterval(async () => {
    const agora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const hoje = new Date().toDateString();

    if (agora === '08:00' && rotinaFeitaHoje !== hoje) {
        rotinaFeitaHoje = hoje;
        try {
            const cidade = process.env.CIDADE_PADRAO || 'Sao Paulo';
            let clima = '';
            try {
                const res = await fetch(`https://wttr.in/${encodeURIComponent(cidade)}?format=3&lang=pt`);
                clima = await res.text();
            } catch { clima = 'Clima indisponível no momento.'; }

            const hojeFmt = new Date().toLocaleDateString('pt-BR', {
                timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long'
            });

            await enviarMensagemLonga(CHAT_CRIADOR,
                `${saudacaoPorHorario()}\n\n` +
                `🤖 *Relatório matinal — Bob AI X*\n\n` +
                `📅 Hoje é ${hojeFmt}.\n` +
                `🌤 ${clima}\n\n` +
                `Todos os sistemas operacionais. A suas ordens, Senhor.`);
        } catch (e) {
            console.error('❌ Erro na rotina matinal:', e.message);
        }
    }
}, 30000);

// 💬 1. RESPONDER TEXTOS (com detecção de intenção natural)
bot.on('message', async (msg) => {
    if (msg.photo || msg.document || msg.voice || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await enviarMensagemLonga(chatId, '👋 Olá Lindinaldo! — assistente ativo (Bob AI X).

Envie qualquer texto, **foto** ou **arquivo (PDF/TXT)** para eu analisar!');

        return;
    }

    try {
        // 🧠 Tenta entender sem comando antes de ir pra IA
        const intencao = detectarIntencao(text);
        if (intencao) {
            const resolvido = await executarIntencao(bot, chatId, intencao, enviarMensagemLonga, chamarOpenRouter);
            if (resolvido) return;
        }

        bot.sendChatAction(chatId, 'typing');
        const messages = [
            { role: 'system', content: require('./ia/personalidade').obterPersonalidade() },
            { role: 'user', content: text }
        ];
        const resposta = await chamarOpenRouter(messages, false);
        await enviarMensagemLonga(chatId, resposta);
    } catch (error) {
        console.error('❌ Erro no texto:', error.message);
        await enviarMensagemLonga(chatId, `⚠️ Erro na IA: ${error.message}`);
    }
});

// 📸 2. ANALISAR FOTOS
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.caption || 'Analise esta imagem em detalhes. Se houver qualquer texto ou documento, leia e resuma o conteúdo de forma clara e objetiva.';

    try {
        await enviarMensagemLonga(chatId, '👀 *Analisando a foto...*');
        bot.sendChatAction(chatId, 'typing');

        const photo = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(photo.file_id);
        const fotoRes = await fetch(fileLink);
        const arrayBuffer = await fotoRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        const messages = [
            { role: 'system', content: require('./ia/personalidade').obterPersonalidade() },
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUrl } }
                ]
            }
        ];

        const resposta = await chamarOpenRouter(messages, true);
        await enviarMensagemLonga(chatId, resposta);

    } catch (error) {
        console.error('❌ Erro na foto:', error.message);
        await enviarMensagemLonga(chatId, `⚠️ Erro na análise da foto: ${error.message}`);
    }
});

// 📄 3. ANALISAR ARQUIVOS (PDF, TXT, MD, CSV, JSON, LOG, DOCX) — RESUMO AUTOMÁTICO
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const doc = msg.document;
    const fileName = (doc.file_name || 'arquivo').toLowerCase();
    const caption = msg.caption || 'Faça um resumo completo e analise o conteúdo deste documento de forma clara, organizada e didática.';

    try {
        await enviarMensagemLonga(chatId, `📄 *Lendo o arquivo ${fileName}...*`);
        bot.sendChatAction(chatId, 'typing');

        const fileLink = await bot.getFileLink(doc.file_id);
        const fileRes = await fetch(fileLink);

        let textoExtraido = '';

        const ehTxt = /\.(txt|md|csv|json|log)$/.test(fileName) ||
                      (doc.mime_type || '').startsWith('text/') ||
                      doc.mime_type === 'application/json';
        const ehPdf = fileName.endsWith('.pdf') || doc.mime_type === 'application/pdf';
        const ehDocx = fileName.endsWith('.docx') ||
                       doc.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (ehTxt) {
            textoExtraido = await fileRes.text();
        } else if (ehPdf) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfData = await pdfParse(buffer);
            textoExtraido = pdfData.text;
        } else if (ehDocx) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const resultado = await mammoth.extractRawText({ buffer });
            textoExtraido = resultado.value;
        } else {
            await enviarMensagemLonga(chatId,
                `⚠️ Recebi *${fileName}* (${doc.mime_type || 'tipo desconhecido'}), Senhor.\n\n` +
                `No momento leio: **PDF, TXT, MD, CSV, JSON, LOG e DOCX (Word)**.`);
            return;
        }

        if (!textoExtraido || textoExtraido.trim().length === 0) {
            await enviarMensagemLonga(chatId,
                '⚠️ O arquivo não contém texto legível (pode ser um PDF escaneado como imagem), Senhor.');
            return;
        }

        const textoLimitado = textoExtraido.slice(0, 15000);
        const messages = [
            { role: 'system', content: require('./ia/personalidade').obterPersonalidade() +
                '\n\nTAREFA ATUAL: resumir e explicar o documento enviado de forma organizada.' },
            { role: 'user', content: `${caption}\n\n--- CONTEÚDO DO ARQUIVO (${fileName}) ---\n${textoLimitado}\n--- FIM DO ARQUIVO ---` }
        ];

        const resposta = await chamarOpenRouter(messages, false);
        await enviarMensagemLonga(chatId, `📋 *Análise de ${fileName}:*\n\n${resposta}`);

    } catch (error) {
        console.error('❌ Erro no documento:', error.message);
        await enviarMensagemLonga(chatId, `⚠️ Erro ao processar o documento: ${error.message}`);
    }
});

// 🎙 4. TRANSCREVER ÁUDIOS (Whisper gratuito via Groq)
bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    try {
        await enviarMensagemLonga(chatId, '🎙 Ouvindo o áudio, Senhor...');
        const link = await bot.getFileLink(msg.voice.file_id);
        const audioRes = await fetch(link);
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

        if (!process.env.GROQ_API_KEY) {
            return enviarMensagemLonga(chatId, '⚠️ Preciso da variável GROQ_API_KEY no Render para transcrever, Senhor.');
        }

        const form = new FormData();
        form.append('file', new Blob([audioBuffer]), 'audio.ogg');
        form.append('model', 'whisper-large-v3-turbo');
        form.append('language', 'pt');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
            body: form
        });
        const data = await res.json();

        if (!data.text) throw new Error(data.error?.message || 'Sem resposta');

        await enviarMensagemLonga(chatId, `📝 *Transcrição:*\n"${data.text}"`);

        bot.sendChatAction(chatId, 'typing');
        const resposta = await chamarOpenRouter([
            { role: 'system', content: require('./ia/personalidade').obterPersonalidade() },
            { role: 'user', content: `O usuário enviou este áudio: "${data.text}". Responda ao que foi pedido.` }
        ], false);
        await enviarMensagemLonga(chatId, resposta);

    } catch (error) {
        console.error('❌ Erro no áudio:', error.message);
        await enviarMensagemLonga(chatId, `⚠️ Erro ao transcrever o áudio: ${error.message}`);
    }
});

bot.on('polling_error', (error) => {
    if (!error.message.includes('409 Conflict')) {
        console.error('❌ Erro no polling:', error.message);
    }
});

module.exports = bot;
FIM
