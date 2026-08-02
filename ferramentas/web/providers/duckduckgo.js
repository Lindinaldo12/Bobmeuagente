function pesquisar(consulta) {

    return {
        fonte: "DuckDuckGo",
        consulta,
        resultado: "Provider preparado para integração."
    };

}

module.exports = {
    nome: "DuckDuckGo",
    pesquisar
};
