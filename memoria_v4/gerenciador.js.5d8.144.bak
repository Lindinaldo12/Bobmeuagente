const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "usuarios");

function caminhoUsuario(id) {
    return path.join(DIR, `${id}.json`);
}

function carregar(id) {
    const arquivo = caminhoUsuario(id);

    if (!fs.existsSync(arquivo)) {
        return {
            id,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            perfil: {},
            preferencias: {},
            projetos: [],
            conhecimentos: [],
            conversas: [],
            resumo: ""
        };
    }

    return JSON.parse(
        fs.readFileSync(arquivo, "utf8")
    );
}

function salvar(id, memoria) {
    // ✅ NOVO: Extrator de informações
    const extrator = require("./extrator");

    if (memoria.ultimaMensagem) {
        const dados = extrator.extrair(memoria.ultimaMensagem);

        if (dados.nome) {
            memoria.perfil.nome = dados.nome;
        }

        if (dados.projeto) {
            memoria.projetos.push(dados.projeto);
        }

        if (dados.estuda) {
            memoria.conhecimentos.push(dados.estuda);
        }
    }

    memoria.atualizadoEm = new Date().toISOString();

    fs.writeFileSync(
        caminhoUsuario(id),
        JSON.stringify(memoria, null, 2)
    );
}

// ✅ NOVA FUNÇÃO: Adiciona conversa ao histórico
function adicionarConversa(memoria, pergunta, resposta) {

    memoria.conversas.push({
        data: new Date().toISOString(),
        pergunta,
        resposta
    });

    // Mantém apenas as últimas 100 conversas
    if (memoria.conversas.length > 100) {
        memoria.conversas.shift();
    }

}

module.exports = {
    carregar,
    salvar,
    adicionarConversa
};
