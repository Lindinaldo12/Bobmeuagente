require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Bob AI X Iniciado.');
console.log('==================================');
console.log('Bob v2.0.0 | Core');
console.log('==================================');

// Tratamento global para NÃO DERRUBAR o bot se o Ollama falhar
process.on('uncaughtException', (err) => {
    if (err.code === 'ENOENT' && err.syscall === 'spawn ollama') {
        console.log('⚠️ Ollama não instalado neste ambiente (Render/Cloud). Ignorando...');
    } else {
        console.error('❌ Uncaught Exception:', err.message);
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Servidor Web para manter o Render ativo
app.get('/', (req, res) => {
    res.send('🤖 Bob AI X está rodando no Render!');
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Web iniciado na porta ${PORT}`);
});

// Inicia o módulo do Telegram
try {
    require('./telegram');
    console.log('✅ Core inicializado.');
} catch (error) {
    console.error('❌ Erro ao carregar telegram.js:', error.message);
}
