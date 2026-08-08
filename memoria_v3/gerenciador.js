const fs = require("fs");
const path = require("path");

const PASTA = __dirname + "/usuarios";

if (!fs.existsSync(PASTA)) {
    fs.mkdirSync(PASTA);
}

function salvar(id, memoria) {

    fs.writeFileSync(
        path.join(PASTA, id + ".json"),
        JSON.stringify(memoria, null, 4)
    );

}

function carregar(id) {

    const arquivo = path.join(PASTA, id + ".json");

    if (!fs.existsSync(arquivo)) {

        return {
            perfil: {},
            projetos: [],
            preferencias: [],
            fatos: []
        };

    }

    return JSON.parse(
        fs.readFileSync(arquivo)
    );

}

module.exports = {
    salvar,
    carregar
};
