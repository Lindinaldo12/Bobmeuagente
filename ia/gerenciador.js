const gemini = require("./gemini");
const ollama = require("./ollama");

let iaAtual = "gemini";

async function inicializar() {
    console.log("================================");
    console.log("Inicializando Gerenciador de IA");
    console.log("================================");

    const geminiOk = await gemini.conectar();

    if (geminiOk) {
        iaAtual = "gemini";
        console.log("✅ IA principal: Gemini");
        return;
    }

    const ollamaOk = await ollama.conectar();

    if (ollamaOk) {
        iaAtual = "ollama";
        console.log("✅ IA principal: Ollama");
        return;
    }

    console.log("❌ Nenhuma IA disponível.");
}

// Função perguntar organizada com o parâmetro histórico
async function perguntar(texto, historico = []) {
    
    if (iaAtual === "gemini") {
        return await gemini.perguntar(texto, historico);
    }

    if (iaAtual === "ollama") {
        return await ollama.perguntar(texto, historico);
    }

    return "Nenhuma IA está disponível no momento.";
}

function obterIAAtual() {
    return iaAtual;
}

module.exports = {
    inicializar,
    perguntar,
    obterIAAtual
};

