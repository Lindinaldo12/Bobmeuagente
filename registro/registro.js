const { carregarAgentes } = require("../agentes/carregador");

function listarAgentes() {
    return carregarAgentes();
}

function buscarPorNome(nome) {
    return carregarAgentes().find(
        a => a.nome === nome
    );
}

function listarCapacidades() {

    return carregarAgentes().map(a => ({

        nome: a.nome,

        descricao: a.descricao,

        ferramentas: a.ferramentas || []

    }));

}

module.exports = {

    listarAgentes,
    buscarPorNome,
    listarCapacidades

};
