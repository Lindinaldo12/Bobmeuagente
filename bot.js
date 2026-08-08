require("dotenv").config();

// Novas dependências para o sistema de log
const fs = require("fs");
const path = require("path");
const pipeline = require("./pipeline/pipeline");
const fluxo = require("./core/fluxo");

const express = require("express");

const { inicializar } = require("./core/inicializar");
const { criarBot } = require("./connect/telegram/telegram");
const ia = require("./ia/gerenciador");
const indexador = require("./conhecimento/indexador");
const kernel = require("./kernel/kernel");
const { inicializarBanco } = require("./database/init");

// --- Configuração do Sistema de Log ---
const LOG_FILE = path.join(__dirname, "bob.log");

// Função para registrar logs em arquivo e no console
function log(mensagem) {
    const dataHora = new Date().toISOString();
    const linha = `[${dataHora}] ${mensagem}\n`;
    fs.appendFileSync(LOG_FILE, linha);
    console.log(mensagem);
}

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bob Agente v2.0.0 ONLINE");
});

app.listen(PORT, () => {
    log(` Servidor Web iniciado na porta ${PORT}`);
});

(async () => {
    try {
        // Inicializa o Core (Aguardando a verificação do DB)
        await inicializar();
        
        // ✅ NOVO: Inicializa o banco de dados
        await inicializarBanco();

        console.log("");
        console.log("========================================");
        log(" Inicializando Inteligência Artificial...");
        console.log("========================================");

        await ia.inicializar();

        // Indexar Base de Conhecimento
        console.log("========================================");
        console.log("📚 Indexando Base de Conhecimento...");
        console.log("========================================");

        indexador.indexar();

        console.log("");
        console.log("========================================");
        log("📱 Iniciando Telegram...");
        console.log("========================================");

        const bot = criarBot();

        bot.catch((err) => {
            console.error("");
            console.error("❌ Erro do Bot:");
            console.error(err);
        });

        await bot.start({
            drop_pending_updates: true,
            onStart: () => {
                console.log("");
                console.log("========================================");
                log("✅ Telegram conectado com sucesso.");
                log("🚀 Bob está ONLINE.");
                console.log("========================================");
            }
        });

    } catch (erro) {
        console.error("");
        console.error("========================================");
        log(" ERRO AO INICIAR O BOB");
        console.error("========================================");
        console.error(erro);
    }
})();

// Tratamento de rejeições de Promises não capturadas
process.on("unhandledRejection", (erro) => {
    console.error("");
    log(" Unhandled Rejection:");
    console.error(erro);
});

// Tratamento de exceções não capturadas
process.on("uncaughtException", (erro) => {
    console.error("");
    log("❌ Uncaught Exception:");
    console.error(erro);
});
