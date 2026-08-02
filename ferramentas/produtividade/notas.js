const fs = require("fs");
const path = require("path");

const ARQUIVO = path.join(__dirname, "notas.json");

function carregar() {

    if (!fs.existsSync(ARQUIVO)) {
        return [];
    }

    return JSON.parse(
        fs.readFileSync(ARQUIVO, "utf8")
    );
}

function salvar(notas) {

    fs.writeFileSync(
        ARQUIVO,
        JSON.stringify(notas, null, 2)
    );
}

function executar(texto) {

    const pergunta = texto.trim();

    if (/^anote:/i.test(pergunta)) {

        const nota = pergunta.replace(/^anote:/i, "").trim();

        const notas = carregar();

        notas.push(nota);

        salvar(notas);

        return "📝 Anotado com sucesso.";
    }

    if (/quais são minhas notas/i.test(pergunta)) {

        const notas = carregar();

        if (notas.length === 0) {
            return "Você ainda não possui notas.";
        }

        return (
            "📝 Suas notas:\n\n" +
            notas.map((n, i) => `${i + 1}. ${n}`).join("\n")
        );
    }

    return null;
}

module.exports = {
    nome: "Notas",
    categoria: "Produtividade",
    versao: "1.0.0",
    descricao: "Salva e lista notas do usuário.",

    exemplos: [
        "Anote: comprar pão",
        "Anote: estudar Rust",
        "Quais são minhas notas?"
    ],

    executar
};
