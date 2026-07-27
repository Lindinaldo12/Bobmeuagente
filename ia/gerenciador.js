const gemini = require("./gemini");
const ollama = require("./ollama");
const tools = require("../tools"); // <-- ADICIONADO

let iaAtual = "gemini";

async function inicializar() {
    console.log("==========================================");
    console.log("Inicializando Gerenciador de IA");
    console.log("==========================================");

    const geminiOk = await gemini.conectar();

    if (geminiOk) {
        iaAtual = "gemini";
        console.log("IA principal: Gemini");
        return;
    }

    const ollamaOk = await ollama.conectar();

    if (ollamaOk) {
        iaAtual = "ollama";
        console.log("IA principal: Ollama");
        return;
    }

    console.log("X Nenhuma IA disponível.");
}

// Função perguntar no gerenciador.js - VERSÃO COM FERRAMENTAS
async function perguntar(texto, historico = []) {
    // --- BLOCO DE FERRAMENTAS (ANTES DE CHAMAR A IA) ---
    const pergunta = texto.toLowerCase();

    // Data e hora
    if (
        pergunta.includes("que horas") ||
        pergunta.includes("data de hoje") ||
        pergunta.includes("dia de hoje")
    ) {
        return tools.dataHora.executar().resposta;
    }

    // Calculadora (se a string contiver apenas números, operadores e espaços)
    if (/^[0-9+\-*/(). ]+$/.test(texto.trim())) {
        return tools.calculadora.executar(texto).resposta;
    }
    // ---------------------------------------------------

    try {
        if (iaAtual === "gemini") {
            return await gemini.perguntar(texto, historico);
        }

        if (iaAtual === "ollama") {
            return await ollama.perguntar(texto, historico);
        }

        return "Nenhuma IA está disponível no momento.";
    } catch (erro) {
        console.log("⚠️ Gemini indisponível. Tentando Ollama...");

        if (iaAtual === "gemini") {
            const ollamaOk = await ollama.conectar();

            if (ollamaOk) {
                iaAtual = "ollama";
                return await ollama.perguntar(texto, historico);
            }
        }

        return "Nenhuma IA está disponível no momento.";
    }
}

function obterIAAtual() {
    return iaAtual;
}

module.exports = {
    inicializar,
    perguntar,
    obterIAAtual
};
