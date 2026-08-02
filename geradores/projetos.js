const fs = require("fs");
const path = require("path");

function criarProjeto(nome) {

    const destino = path.join(process.cwd(), nome);

    if (fs.existsSync(destino)) {
        return "Projeto já existe.";
    }

    fs.mkdirSync(destino);

    fs.writeFileSync(
        path.join(destino, "README.md"),
        `# ${nome}\n\nProjeto criado pelo Bob AI X.\n`
    );

    fs.writeFileSync(
        path.join(destino, "index.js"),
        `console.log("Olá, ${nome}!");\n`
    );

    return `Projeto "${nome}" criado com sucesso.`;
}

module.exports = {
    criarProjeto
};
