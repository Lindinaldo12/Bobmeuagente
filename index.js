const { spawn } = require('child_process');
const { criarBot } = require('./connect/telegram/telegram');

console.log("🚀 Iniciando aplicação do Bob...");

// Tenta iniciar o Ollama em segundo plano sem derrubar a aplicação se não existir
try {
  const ollamaProcess = spawn('ollama', ['serve']);

  ollamaProcess.on('error', (err) => {
    console.log("⚠️ Ollama não está instalado/disponível neste ambiente. Prosseguindo sem Ollama local...");
  });
} catch (e) {
  console.log("⚠️ Ignorando inicialização do Ollama em ambiente cloud.");
}

// Inicializa o Bot do Telegram
const bot = criarBot();
bot.start();
console.log("✅ Bot do Telegram rodando e pronto para receber mensagens!");
