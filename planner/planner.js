const { classificar } = require("./classificador");

function criarPlano(texto) {

    const tipo = classificar(texto);

    switch (tipo) {

        case "professor":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Responder",
                        agente: "Professor"
                    }
                ]
            };

        case "analista":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Analisar",
                        agente: "Analista"
                    }
                ]
            };

        case "programador":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Programar",
                        agente: "Programador"
                    }
                ]
            };

        case "escritor":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Escrever",
                        agente: "Escritor"
                    }
                ]
            };

        case "seguranca":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Segurança",
                        agente: "Segurança"
                    }
                ]
            };

        case "pesquisador":
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Pesquisar",
                        agente: "Pesquisador"
                    }
                ]
            };

        default:
            return {
                objetivo: texto,
                etapas: [
                    {
                        nome: "Responder",
                        agente: "Professor"
                    }
                ]
            };

    }

}

module.exports = {
    criarPlano
};
