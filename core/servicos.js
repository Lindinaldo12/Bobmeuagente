const net = require("net");

function verificarPorta(porta, host = "127.0.0.1") {
    return new Promise((resolve) => {

        const socket = new net.Socket();

        socket.setTimeout(1500);

        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        });

        socket.once("timeout", () => {
            socket.destroy();
            resolve(false);
        });

        socket.once("error", () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(porta, host);
    });
}


// ========================================
// VERIFICAR OLLAMA
// ========================================

async function verificarOllama() {

    const porta = 11434;

    const funcionando = await verificarPorta(porta);

    if (funcionando) {

        console.log("✅ Ollama já está em execução.");

        return true;

    }

    console.log("⚠️ Ollama não está rodando.");
    console.log("📡 O Bob continuará utilizando os serviços disponíveis.");

    return false;
}


// ========================================
// VERIFICAR SERVIÇOS
// ========================================

async function verificarServicos() {

    console.log("🔧 Verificando serviços...");

    const portaWeb = process.env.PORT || 3000;

    console.log(
        ` Servidor Web iniciado na porta ${portaWeb}`
    );

    await verificarOllama();
}


// ========================================
// EXPORTAÇÕES
// ========================================

module.exports = {
    verificarPorta,
    verificarOllama,
    verificarServicos
};
