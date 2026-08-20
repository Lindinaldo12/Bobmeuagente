const TelegramBot = require('node-telegram-bot-api');
const { extrairTextoDeArquivo } = require('./ia/leitorArquivos');
const fs = require('fs');

if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

async function processarArquivo(msg) {
    if (!msg.document && !msg.photo) return msg;
    
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "👁️ Bob abrindo os olhos... Lendo...");
    
    let fileId = msg.document ? msg.document.file_id : msg.photo[msg.photo.length - 1].file_id;
    let mimeType = msg.document ? (msg.document.mime_type || 'text/plain') : 'image/jpeg';
    
    const filePath = await bot.downloadFile(fileId, './temp');
    const textoExtraido = await extrairTextoDeArquivo(filePath, mimeType);
    
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    if (!textoExtraido.startsWith("❌")) {
        const legenda = msg.caption || "Analise detalhadamente.";
        msg.text = `[ARQUIVO ENVIADO]\nInstrução: ${legenda}\n\nCONTEÚDO:\n${textoExtraido}`;
    }
    return msg;
}

module.exports = { bot, processarArquivo };
