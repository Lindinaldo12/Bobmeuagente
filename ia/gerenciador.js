const motorDecisao = require("./motorDecisao");
const executor = require("./executor");

const perfil = require("./perfil");
const aprendizado = require("./aprendizado");

const ollama = require("./ollama");
const gemini = require("./gemini");

let iaAtual = "ollama";

async function perguntar(texto, historico = [], usuario = null) {

    console.log("====================================");
    console.log("=== GERENCIADOR V3 ===");
    console.log("Pergunta:", texto);

    const decisao = motorDecisao.decidir(texto);

    console.log("Decisão:", decisao.tipo);

    const resposta = await executor.executar(decisao, {
        texto,
        usuario,
        historico,
        perfil,
        aprendizado,
        ia: iaAtual === "ollama"
            ? ollama
            : gemini
    });

    return resposta;
}

function definirIA(nome) {
    iaAtual = nome;
}

function obterIA() {
    return iaAtual;
}

async function inicializar() {

    console.log("====================================");
    console.log("Inicializando Gerenciador de IA");
    console.log("====================================");

    console.log("✅ Ollama conectado.");
    console.log("IA principal:", iaAtual.charAt(0).toUpperCase() + iaAtual.slice(1));
}

module.exports = {
    inicializar,
    perguntar,
    definirIA,
    obterIA
};
