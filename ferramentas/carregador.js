const fs = require("fs");
const path = require("path");

function carregarDiretorio(diretorio, lista) {

    const arquivos = fs.readdirSync(diretorio);

    for (const arquivo of arquivos) {

        const caminho = path.join(diretorio, arquivo);

        const stat = fs.statSync(caminho);

        if (stat.isDirectory()) {

            carregarDiretorio(caminho, lista);

        } else if (
            arquivo.endsWith(".js") &&
            arquivo !== "index.js" &&
            arquivo !== "carregador.js"
        ) {

            const modulo = require(caminho);

            if (typeof modulo.executar === "function") {
                lista.push(modulo);
            }

        }
    }
}

function carregarFerramentas() {

    const ferramentas = [];

    carregarDiretorio(__dirname, ferramentas);

    return ferramentas;
}

module.exports = {
    carregarFerramentas
};
