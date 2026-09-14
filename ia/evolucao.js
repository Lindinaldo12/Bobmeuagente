const conhecimento = require("../conhecimento/gerenciador");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "..", "dados", "evolucao");
const ARQUIVO = path.join(DIR, "historico.json");
const LIMITE_HISTORICO = 500;

function garantir() {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    if (!fs.existsSync(ARQUIVO)) {
        fs.writeFileSync(ARQUIVO, JSON.stringify({ interacoes: [] }, null, 2));
    }
}

function carregar() {
    garantir();
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO, "utf-8"));
    } catch {
        return { interacoes: [] };
    }
}

function salvar(dados) {
    garantir();
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2));
}

function extrairPreferencias(texto) {
    const prefs = [];
    const regras = [
        { padrao: /\b(sempre|sempre que|toda vez)\b.*?(?:use|utilize|faça|responda)\s+([^.,;]+)/i, tipo: "comportamento" },
        { padrao: /\b(nao|não|evite|evita)\b.*?(?:use|usar|falar|dizer)\s+([^.,;]+)/i, tipo: "evitar" },
        { padrao: /\b(meu nome é|me chamo|sou)\s+([A-ZÀ-Ú\s]{2,})/i, tipo: "identidade" },
        { padrao: /\b(gosto de|prefiro|adoro)\s+([^.,;]+)/i, tipo: "preferencia" }
    ];
    for (const regra of regras) {
        const match = String(texto).match(regra.padrao);
        if (match) {
            prefs.push({ tipo: regra.tipo, valor: match[2].trim() });
        }
    }
    return prefs;
}

function deveAprender(pergunta, resposta) {
    if (!pergunta || !resposta) return false;
    if (resposta.length < 40) return false;
    const termosAprendizado = /(o que é|como funciona|explique|o que significa|defina|como fazer|tutorial|guia)/i;
    return termosAprendizado.test(pergunta) || resposta.length > 120;
}

function extrairTitulo(pergunta) {
    const limpo = pergunta.replace(/\s+/g, " ").trim();
    return limpo.length > 60 ? limpo.slice(0, 57) + "..." : limpo;
}

function processar(interacao) {
    const { pergunta, resposta, categoria } = interacao;
    const evolucao = carregar();

    const registro = {
        pergunta,
        resposta,
        categoria: categoria || "geral",
        prefs: extrairPreferencias(pergunta),
        timestamp: new Date().toISOString()
    };

    evolucao.interacoes.push(registro);

    while (evolucao.interacoes.length > LIMITE_HISTORICO) {
        evolucao.interacoes.shift();
    }

    salvar(evolucao);

    if (deveAprender(pergunta, resposta)) {
        conhecimento.registrar({
            categoria: categoria || "geral",
            titulo: extrairTitulo(pergunta),
            conteudo: resposta,
            fonte: "evolucao"
        });
    }

    return {
        aprendido: deveAprender(pergunta, resposta),
        preferencias: registro.prefs
    };
}

function obterPreferencias() {
    const evolucao = carregar();
    const todas = evolucao.interacoes.flatMap((i) => i.prefs || []);
    const unicas = [];
    const seen = new Set();
    for (const p of todas) {
        const chave = p.tipo + ":" + p.valor.toLowerCase();
        if (!seen.has(chave)) {
            seen.add(chave);
            unicas.push(p);
        }
    }
    return unicas;
}

module.exports = {
    processar,
    obterPreferencias,
    carregar
};
