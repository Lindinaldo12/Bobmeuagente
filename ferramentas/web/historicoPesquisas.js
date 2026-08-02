const fs = require("fs");
const path = require("path");

const ARQUIVO = path.join(__dirname, "pesquisas.json");

function carregar() {

    if (!fs.existsSync(ARQUIVO)) {
        return [];
    }

    return JSON.parse(
        fs.readFileSync(ARQUIVO, "utf8")
    );

}

function salvar(lista) {

    fs.writeFileSync(
        ARQUIVO,
        JSON.stringify(lista, null, 2)
    );

}

function adicionar(consulta) {

    const lista = carregar();

    lista.unshift({
        consulta,
        data: new Date().toISOString()
    });

    salvar(lista);

}

function listar() {

    return carregar();

}

module.exports = {
    adicionar,
    listar
};
