require('dotenv').config();
const express = require('express');

// Compatibilidade entre os nomes de variaveis usados no projeto
process.env.TELEGRAM_TOKEN =
  process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
process.env.GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
process.env.OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Bob AI X iniciado.');
console.log('Bob v2.0.0 | Render');

const faltando = ['TELEGRAM_TOKEN'].filter((k) => !process.env[k]);
if (faltando.length) {
  console.error('Variaveis ausentes:', faltando.join(', '));
}
if (!process.env.GOOGLE_API_KEY && !process.env.OPENROUTER_API_KEY) {
  console.error('Nenhuma chave de IA configurada.');
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.get('/', (req, res) => {
  res.send('Bob AI X esta rodando.');
});

app.listen(PORT, () => {
  console.log(`Servidor web na porta ${PORT}`);
});

process.env.USE_OLLAMA = 'false';

try {
  require('./telegram');
  console.log('Core do Telegram inicializado.');
} catch (error) {
  console.error('Erro ao carregar telegram.js:', error.stack || error.message);
}
