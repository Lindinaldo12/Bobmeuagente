const seletor = require("../agentes/seletor");

function processar(contexto) {

    const agente = seletor.selecionar(
        contexto.texto
    );

    if (agente) {

        return {

            status: "agente",

            agente: agente.nome,

            resposta: agente.executar(contexto)

        };

    }

    return {

        status: "ia",

        agente: null,

        resposta: null

    };

}

module.exports = {
    processar
};
