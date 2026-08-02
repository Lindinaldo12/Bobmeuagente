require("dotenv").config();

const { inicializar } = require("./core/inicializar");
const { criarBot } = require("./connect/telegram/telegram");
const ia = require("./ia/gerenciador");

(async () => {
    try {

        // Inicializa o Core
        inicializar();

        console.log("");
        console.log("=================================");
        console.log("🧠 Inicializando Inteligência Artificial...");
        console.log("=================================");

        await ia.inicializar();

        console.log("");
        console.log("=================================");
        console.log("🤖 Iniciando Telegram...");
        console.log("=================================");

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
                console.log("=================================");
                console.log("✅ Telegram conectado com sucesso.");
                console.log("🚀 Bob está ONLINE.");
                console.log("=================================");
            }
        });

    } catch (erro) {

        console.error("");
        console.error("=================================");
        console.error("❌ ERRO AO INICIAR O BOB");
        console.error("=================================");
        console.error(erro);

    }
})();

process.on("unhandledRejection", (erro) => {
    console.error("");
    console.error("❌ Unhandled Rejection:");
    console.error(erro);
});

process.on("uncaughtException", (erro) => {
    console.error("");
    console.error("❌ Uncaught Exception:");
    console.error(erro);
});
