require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Bob AI X Iniciado.');
console.log('==================================');
console.log('Bob v2.0.0 | Core (Render Mode)');
console.log('==================================');

// Bloqueia qualquer erro de fundo (ex: Ollama não encontrado) para NUNCA derrubar o bot
process.on('uncaughtException', (err) => {
    if (err.code === 'ENOENT' || (err.message && err.message.includes('ollama'))) {
        console.log('⚠️ Tentativa de uso do Ollama ignorada (Ambiente de Nuvem).');
    } else {
        console.error('❌ Uncaught Exception:', err.message);
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Servidor Web para o Render detectar que a aplicação está viva
app.get('/', (req, res) => {
    res.send('🤖 Bob AI X está rodando 24/7 no Render!');
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Web iniciado na porta ${PORT}`);
});

// Força a variável do Ollama para false
process.env.USE_OLLAMA = 'false';

// Carrega o módulo do Telegram
try {
    require('./telegram');
    console.log('✅ Core do Telegram inicializado.');
} catch (error) {
    console.error('❌ Erro ao carregar telegram.js:', error.message);
}
