const carregador = require("./carregador");

function listar() {
    return carregador.carregarAgentes();
}

function obter(nome) {
    return listar().find(
        agente =>
            agente.nome.toLowerCase() === nome.toLowerCase()
    );
}

module.exports = {
    listar,
    obter
};
