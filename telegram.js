const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { promisify } = require('util');

// Carregar variáveis de ambiente
dotenv.config({ path: './bob/.env' });

// Promisify exec
const execAsync = promisify(exec);

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const CONFIG = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    HERMES_BOT_TOKEN: process.env.HERMES_BOT_TOKEN,
    HERMES_CHAT_ID: process.env.HERMES_CHAT_ID,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    HERMES_TIMEOUT: 120000,
};

// ============================================================
// FUNÇÕES DE INTERNET
// ============================================================

/**
 * Chamar o agente Hermes via terminal
 */
async function chamarHermes(texto) {
    return new Promise((resolve, reject) => {
        const comando = `echo "${texto.replace(/"/g, '\\"')}" | hermes -p default send`;
        const child = exec(commando, { timeout: CONFIG.HERMES_TIMEOUT }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(stdout.trim());
            }
        });
        setTimeout(() => {
            child.kill();
            reject(new Error('Timeout: Hermes não respondeu em 120 segundos'));
        }, CONFIG.HERMES_TIMEOUT);
    });
}

/**
 * Enviar mensagem para o Hermês Bot (segundo bot)
 */
async function chamarHermesBot(mensagem, chatId) {
    if (!CONFIG.HERMES_BOT_TOKEN) {
        console.warn('⚠️  HERMES_BOT_TOKEN não configurado');
        return;
    }
    
    try {
        const url = `https://api.telegram.org/bot${CONFIG.HERMES_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: mensagem
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Mensagem enviada ao Hermês Bot');
        } else {
            console.error('❌ Erro do Hermês Bot:', data.description);
        }
    } catch (error) {
        console.error('❌ Erro ao chamar Hermês Bot:', error.message);
    }
}

/**
 * Função OpenRouter para buscas online
 */
async function chamarOpenRouter(mensagem, chatId) {
    try {
        if (!CONFIG.OPENROUTER_API_KEY) {
            await bot.sendMessage(chatId, '❌ Configure OPENROUTER_API_KEY no .env');
            return;
        }
        
        const url = 'https://openrouter.ai/api/v1/chat/completions';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'Bob AI X'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    { role: "system", content: "Você é Bob, um assistente de programação e segurança." },
                    { role: "user", content: mensagem }
                ]
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            const resposta = data.choices[0]?.message?.content || 'Sem resposta.';
            await bot.sendMessage(chatId, resposta);
            console.log('✅ Resposta do OpenRouter enviada');
        } else {
          await bot.sendMessage(chatId, '❌ Erro: ' + data.error?.message);
        }
    } catch (error) {
        console.error('❌ Erro OpenRouter:', error.message);
        await bot.sendMessage(chatId, '❌ Erro de internet ou conexão.');
    }
}

/**
 * Lógica de tratamento do comando
 */
async function processarComando(msg) {
    const chatId = msg.chat.id;
    const texto = msg.text || msg.caption || '';
    const usuario = msg.from?.first_name || 'Desconhecido';
    
    console.log(`📩 Mensagem de ${usuario}: ${texto}`);
    
    // Comandos básicos
    if (texto === '/start') {
        await bot.sendMessage(chatId, 
            '👋 Olá! Sou o Bob AI X.\n' +
            'Digite qualquer pergunta que eu responderei.\n' +
            'Use /retry para pedir novamente.'
        );
        return;
    }
    
    if (texto === '/help') {
        await bot.sendMessage(chatId, 
            '📚 Ajuda do Bob AI X:\n\n' +
            '• Envie qualquer pergunta que eu responderei\n' +
            '• /retry - Pedir para repensar a resposta\n' +
            '• /status - Verificar status do sistema'
        );
        return;
    }
    
    if (texto === '/status') {
        const status = `
📊 Status do Bob AI X:

🤖 Hermes: ${CONFIG.HERMES_BOT_TOKEN ? '✅ Ativo' : '❌ Inativo'}
🌐 Internet: ${CONFIG.OPENROUTER_API_KEY ? '✅ Conectado' : '⚠️  Configurar'}
🔗 Hermês Bot: ${CONFIG.HERMES_BOT_TOKEN ? '✅ Ativo' : '❌ Inativo'}
🖥️  Sistema: Rodando normalmente
        `.trim();
        await bot.sendMessage(chatId, status);
        return;
    }
    
    // Tentativa 1: Hermes via terminal
    try {
        const respostaHermes = await chamarHermes(texto);
        await bot.sendMessage(chatId, respostaHermes);
    } catch (error) {
        console.error('❌ Erro Hermes:', error.message);
        await bot.sendMessage(chatId, '❌ Erro ao chamar Hermes: ' + error.message);
    }
    
    // Tentativa 2: Hermês Bot (segundo bot)
    if (CONFIG.HERMES_BOT_TOKEN) {
        await chamarHermesBot(texto, chatId);
    }
    
    // Tentativa 3: OpenRouter (fallback)
    await chamarOpenRouter(texto, chatId);
}

// ============================================================
// EVENTOS DO BOT
// ============================================================

bot.on('message', (msg) => {
    if (msg.from?.is_bot) return;
    processarComando(msg);
});

// Integramos foto/mídia
bot.on('any', (msg) => {
    if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, '📸 Imagem recebida! Envie uma mensagem textual para análise.');
    }
});

// ============================================================
// INÍCIO
// ============================================================

console.log('🚀 Bob AI X iniciando...');
console.log(`📡 Telegram: ${CONFIG.TELEGRAM_BOT_TOKEN ? '✅ Presente' : '❌ Ausente'}`);
console.log(`🌐 Internet: ${CONFIG.OPENROUTER_API_KEY ? '✅ Conectado' : '⚠️  Pendente'}`);
console.log(`🤖 Hermês Bot: ${CONFIG.HERMES_BOT_TOKEN ? '✅ Ativo' : '❌ Inativo'}`);
