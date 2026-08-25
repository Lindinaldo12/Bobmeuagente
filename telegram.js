const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;

if (!token) {
    console.error('❌ Token do Telegram não encontrado!');
    console.error('   Configure TELEGRAM_TOKEN no arquivo .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('✅ telegram.js carregado com sucesso');

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`📨 Mensagem recebida de ${msg.from.first_name}: ${text}`);

    if (text === '/start') {
        bot.sendMessage(chatId, '👋 Olá! Eu sou o Bob AI X. Como posso te ajudar?');
        return;
    }

    bot.sendMessage(chatId, `🤖 Você disse: "${text}"\n\n(Integração com IA em desenvolvimento)`);
});

bot.on('polling_error', (error) => {
    console.error('❌ Erro no polling do Telegram:', error.message);
});

module.exports = bot;
