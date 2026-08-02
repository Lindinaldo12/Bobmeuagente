const fs = require("fs");
const path = require("path");

function criarArquivo(projeto, nomeArquivo, conteudo) {

    const pasta = path.join(process.cwd(), projeto);

    if (!fs.existsSync(pasta)) {
        return "Projeto não encontrado.";
    }

    const caminho = path.join(pasta, nomeArquivo);

    fs.writeFileSync(caminho, conteudo);

    return `Arquivo "${nomeArquivo}" criado com sucesso.`;

}

module.exports = {
    criarArquivo
};
