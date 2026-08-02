const { carregarAgentes } = require("./carregador");

function listar() {

    return carregarAgentes().map(agente => ({

        nome: agente.nome,
        versao: agente.versao,
        autor: agente.autor,
        descricao: agente.descricao,
        categoria: agente.categoria

    }));

}

function obter(nome) {

    return carregarAgentes().find(
        agente =>
            agente.nome.toLowerCase() === nome.toLowerCase()
    );

}

function ajuda() {

    const agentes = listar();

    if (agentes.length === 0) {
        return "Nenhum agente instalado.";
    }

    let resposta = "🤖 Agentes disponíveis:\n\n";

    for (const agente of agentes) {

        resposta += `👤 ${agente.nome}\n`;
        resposta += `📂 ${agente.categoria}\n`;
        resposta += `📝 ${agente.descricao}\n\n`;

    }

    return resposta;

}

module.exports = {
    listar,
    obter,
    ajuda
};
