const ferramentas = require("../ferramentas");

async function executar(decisao, contexto) {

    switch (decisao.tipo) {

        case "perfil":
            return contexto.perfil.responder(
                contexto.usuario,
                contexto.texto
            );

        case "aprendizado":
            return contexto.aprendizado.processar(
                contexto.usuario,
                contexto.texto
            );

        case "ia":
            return await contexto.ia.perguntar(
                contexto.texto,
                contexto.historico
            );

        case "ferramenta":
            return await ferramentas.executar(
                contexto.texto,
                contexto.usuario
            );

        default:
            return "Não consegui decidir como responder.";
    }
}

module.exports = {
    executar
};
