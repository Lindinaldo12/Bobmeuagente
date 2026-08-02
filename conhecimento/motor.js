const fs = require("fs");
const path = require("path");

function buscar(assunto) {

    assunto = assunto.toLowerCase();

    const pasta = __dirname;

    return procurar(pasta, assunto);

}

function procurar(diretorio, assunto) {

    const arquivos = fs.readdirSync(diretorio);

    for (const arquivo of arquivos) {

        const caminho = path.join(diretorio, arquivo);

        const stat = fs.statSync(caminho);

        if (stat.isDirectory()) {

            const resultado = procurar(caminho, assunto);

            if (resultado) {
                return resultado;
            }

        } else if (arquivo.endsWith(".md")) {

            const texto = fs.readFileSync(caminho, "utf8");

            if (
                arquivo.toLowerCase().includes(assunto) ||
                texto.toLowerCase().includes(assunto)
            ) {

                return {
                    arquivo,
                    caminho,
                    conteudo: texto
                };

            }

        }

    }

    return null;

}

module.exports = {
    buscar
};
