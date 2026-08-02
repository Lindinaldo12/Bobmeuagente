const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "memoria.json");

function carregar() {
    if (!fs.existsSync(arquivo)) {
        return {};
    }

    try {
        const dados = fs.readFileSync(arquivo, "utf8");
        return JSON.parse(dados);
    } catch (error) {
        console.error("Erro ao carregar o arquivo JSON:", error.message);
        return {};
    }
}

function salvar(memoria) {
    try {
        fs.writeFileSync(arquivo, JSON.stringify(memoria, null, 2), "utf8");
    } catch (error) {
        console.error("Erro ao salvar no arquivo JSON:", error.message);
    }
}

function definir(chave, valor) {
    const memoria = carregar();
    memoria[chave] = valor;
    salvar(memoria);
}

function obter(chave) {
    const memoria = carregar();
    return memoria[chave];
}

// --- FUNÇÕES POR USUÁRIO ---

function definirUsuario(idUsuario, chave, valor) {
    const memoria = carregar();

    if (!memoria[idUsuario]) {
        memoria[idUsuario] = {};
    }

    memoria[idUsuario][chave] = valor;

    salvar(memoria);
}

function obterUsuario(idUsuario, chave) {
    const memoria = carregar();

    if (!memoria[idUsuario]) {
        return null;
    }

    return memoria[idUsuario][chave] ?? null;
}

module.exports = {
    carregar,
    salvar,
    definir,
    obter,
    definirUsuario,
    obterUsuario
};

