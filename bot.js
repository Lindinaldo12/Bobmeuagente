require('dotenv').config(); // Carrega variáveis do .env

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Bob AI X Iniciado.');
console.log('==================================');
console.log('Bob v2.0.0');
console.log('Bob Core');
console.log('==================================');

console.log('✅ Configuração carregada.');

// Iniciar servidor web (mantém o processo vivo no Render/Termux)
app.get('/', (req, res) => {
    res.send('🤖 Bob AI X está rodando!');
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Web iniciado na porta ${PORT}`);
});

// Iniciar Telegram
try {
    require('./telegram');
    console.log('✅ Core inicializado.');
} catch (error) {
    console.error('❌ Erro ao iniciar o Telegram:', error.message);
}

// Evitar que o processo caia por erros não tratados
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});
