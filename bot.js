require('dotenv').config();
const express = require('express');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Bob AI X iniciado.');
console.log('Bob v2.3.0 | Render');

if (!config.telegramToken) console.error('TELEGRAM_TOKEN ausente.');
if (!config.temIA) console.error('Nenhuma chave de IA configurada.');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

let telegram = {};
try {
  telegram = require('./telegram');
  console.log('Core do Telegram inicializado.');
} catch (error) {
  console.error('Erro ao carregar telegram.js:', error.stack || error.message);
}

app.get('/', (req, res) => {
  res.send('Bob AI X esta rodando.');
});

app.get('/health', (req, res) => {
  res.send('ok');
});

app.post('/cron/daily', async (req, res) => {
  const segredo = config.cronSecret;
  if (!segredo || req.headers['x-cron-secret'] !== segredo) {
    return res.status(401).send('nao autorizado');
  }
  if (typeof telegram.enviarMensagemDiaria !== 'function') {
    return res.status(500).send('telegram nao carregado');
  }
  try {
    await telegram.enviarMensagemDiaria();
    res.send('ok');
  } catch (err) {
    console.error('Cron falhou:', err.message);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor web na porta ${PORT}`);
});

process.env.USE_OLLAMA = 'false';
