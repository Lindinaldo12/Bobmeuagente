const fs = require("fs");
const path = require("path");

function indexar() {

    const arquivos = [];

    percorrer(__dirname, arquivos);

    fs.writeFileSync(
        path.join(__dirname, "index.json"),
        JSON.stringify(arquivos, null, 2)
    );

    console.log(`✅ ${arquivos.length} documentos indexados.`);

}

function percorrer(diretorio, lista) {

    const itens = fs.readdirSync(diretorio);

    for (const item of itens) {

        const caminho = path.join(diretorio, item);

        const stat = fs.statSync(caminho);

        if (stat.isDirectory()) {

            percorrer(caminho, lista);

        } else if (item.endsWith(".md")) {

            lista.push({
                nome: item,
                caminho
            });

        }

    }

}

module.exports = {
    indexar
};
