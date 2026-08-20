const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "usuarios");

if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

function caminhoUsuario(id) {
    return path.join(DIR, `${id}.json`);
}

function garantirEstrutura(memoria, id) {
    memoria.id ??= String(id);

    memoria.criadoEm ??= new Date().toISOString();

    memoria.atualizadoEm ??= new Date().toISOString();

    memoria.perfil ??= {};
    memoria.preferencias ??= {};

    memoria.perfil.projetos ??= [];
    memoria.perfil.objetivos ??= [];
    memoria.perfil.interesses ??= [];
    memoria.perfil.ultimoProjeto ??= null;

    memoria.conhecimentos ??= [];
    memoria.conversas ??= [];

    memoria.resumo ??= "";

    return memoria;
}

function carregar(id) {
    const arquivo = caminhoUsuario(id);

    if (!fs.existsSync(arquivo)) {
        return garantirEstrutura({
            id: String(id),
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            perfil: {},
            preferencias: {},
            conhecimentos: [],
            conversas: [],
            resumo: ""
        }, id);
    }

    let memoria;

    try {
        memoria = JSON.parse(
            fs.readFileSync(arquivo, "utf8")
        );
    } catch (erro) {
        throw new Error(
            `Não foi possível ler a memória do usuário ${id}: ${erro.message}`
        );
    }

    return garantirEstrutura(memoria, id);
}

function salvar(id, memoria) {
    memoria = garantirEstrutura(memoria, id);

    memoria.atualizadoEm = new Date().toISOString();

    fs.writeFileSync(
        caminhoUsuario(id),
        JSON.stringify(memoria, null, 2)
    );
}

function adicionarConversa(memoria, pergunta, resposta) {
    if (!memoria) return false;

    garantirEstrutura(memoria, memoria.id);

    memoria.conversas.push({
        data: new Date().toISOString(),
        pergunta,
        resposta
    });

    if (memoria.conversas.length > 100) {
        memoria.conversas.shift();
    }

    return true;
}

module.exports = {
    carregar,
    salvar,
    adicionarConversa
};
