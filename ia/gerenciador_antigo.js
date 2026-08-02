const gemini = require("./gemini");
const ollama = require("./ollama");
const perfil = require("./perfil");
const aprendizado = require("./aprendizado");
const conhecimento = require("./conhecimento");
const motorDecisao = require("./motorDecisao");
const executor = require("./executor");
const intencoes = require("./intencoes");
const tools = require("../tools");
const memoriaV2 = require("../memoria_v2");

let iaAtual = "ollama";

async function inicializar() {
    console.log("====================================");
    console.log("Inicializando Gerenciador de IA");
    console.log("====================================");

    // 1ª Tentativa: Ollama (IA Local)
    const ollamaOk = await ollama.conectar();

    if (ollamaOk) {
        iaAtual = "ollama";
        console.log("IA principal: Ollama");
        return;
    }

    // 2ª Tentativa: Gemini (Nuvem / Fallback)
    const geminiOk = await gemini.conectar();

    if (geminiOk) {
        iaAtual = "gemini";
        console.log("IA principal: Gemini");
        return;
    }

    console.log("❌ Nenhuma IA disponível.");
}

async function perguntar(texto, historico = [], usuario = null) {
    // --- LOGS DE ENTRADA ---
    console.log("=== GERENCIADOR ===");
    console.log("IA atual:", iaAtual);
    console.log("Pergunta:", texto);

    // --- DETECÇÃO DE INTENÇÃO ---
    const intencao = intencoes.detectar(texto);
    console.log("Intenção detectada:", intencao);

    // --- ROTEAMENTO POR INTENÇÃO ---
    if (intencao === "perfil") {
        const resposta = perfil.responder(usuario, texto);
        if (resposta) {
            return resposta;
        }
    }

    if (intencao === "aprendizado") {
        console.log("Entrou no módulo de aprendizado.");
        const resposta = aprendizado.processar(usuario, texto);
        if (resposta) {
            return resposta;
        }
    }

    // --- BLOCO DE FERRAMENTAS ---
    const pergunta = texto.toLowerCase();

    const decisao = motorDecisao.decidir(texto);

    console.log("Decisão:", decisao.tipo);

    const resposta = await executor.executar(decisao, {
        texto,
        usuario,
        historico,
        perfil,
        aprendizado,
        ia: iaAtual === "ollama" ? ollama : gemini
    });

    if (resposta) {
        return resposta;
    }

    // --- CONHECIMENTO ---
    if (
        pergunta.includes("o que você sabe sobre mim") ||
        pergunta.includes("o que voce sabe sobre mim") ||
        pergunta.includes("o que sabe sobre mim") ||
        pergunta.includes("o que você sabe de mim") ||
        pergunta.includes("o que voce sabe de mim")
    ) {
        return conhecimento.resumir(usuario);
    }

    // Data e hora
    if (
        pergunta.includes("que horas") ||
        pergunta.includes("data de hoje") ||
        pergunta.includes("dia de hoje")
    ) {
        return tools.dataHora.executar().resposta;
    }

    // Calculadora
    if (/^[0-9+\-*/(). ]+$/.test(texto.trim())) {
        return tools.calculadora.executar(texto).resposta;
    }

    // --- EXECUÇÃO DA IA ---
    try {
        if (iaAtual === "ollama") {
            console.log("Chamando Ollama...");
            const resposta = await ollama.perguntar(texto, historico);
            console.log("Ollama respondeu.");
            return resposta;
        }

        if (iaAtual === "gemini") {
            console.log("Chamando Gemini...");
            const resposta = await gemini.perguntar(texto, historico);
            console.log("Gemini respondeu.");
            return resposta;
        }

        return "Nenhuma IA está disponível no momento.";
    } catch (erro) {
        console.log("⚠️ IA principal falhou. Tentando alternativa...");

        if (iaAtual === "ollama") {
            const geminiOk = await gemini.conectar();
            if (geminiOk) {
                iaAtual = "gemini";
                return await gemini.perguntar(texto, historico);
            }
        } else if (iaAtual === "gemini") {
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
