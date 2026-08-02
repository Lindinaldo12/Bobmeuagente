const dataHora = require("./sistema/dataHora");
const calculadora = require("./sistema/calculadora");
const notas = require("./produtividade/notas");
const pesquisa = require("./web/pesquisa");
const historico = require("./web/historico");

async function executar(texto, usuario) {

    let resposta;

    resposta = await dataHora.executar(texto);

    if (resposta) {
        return resposta;
    }

    resposta = await calculadora.executar(texto);

    if (resposta) {
        return resposta;
    }

    resposta = await notas.executar(texto);

    if (resposta) {
        return resposta;
    }

    resposta = await pesquisa.executar(texto, usuario);

    if (resposta) {
        return resposta;
    }

    resposta = await historico.executar(texto);

    if (resposta) {
        return resposta;
    }

    return null;
}

module.exports = {
    executar
};
