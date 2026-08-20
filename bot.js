const { bot, processarArquivo } = require('./telegram');

console.log("🚀 Bob AI X Iniciado.");

bot.on('message', async (msg) => {
    // 1. Processa arquivo se houver, ou mantém a msg original
    const msgProcessada = await processarArquivo(msg);

    // 2. AQUI ENTRA O SEU CÓDIGO DO KERNEL ORIGINAL
    // (Onde você chama a IA, busca na web, etc)
    console.log("🧠 Mensagem recebida para processar:", msgProcessada.text ? msgProcessada.text.substring(0,50) : "Sem texto");
    
    // -> COLOQUE A CHAMADA DA SUA FUNÇÃO DE IA AQUI:
    // exemplo: processarNoKernel(msgProcessada);
});
