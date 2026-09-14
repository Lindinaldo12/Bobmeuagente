const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "..", "dados", "conhecimento");
const ARQUIVO = path.join(DIR, "base.json");
const LIMITE_POR_CATEGORIA = 200;

function garantirBase() {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    if (!fs.existsSync(ARQUIVO)) {
        fs.writeFileSync(ARQUIVO, JSON.stringify({ itens: [] }, null, 2));
    }
}

function carregar() {
    garantirBase();
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO, "utf-8"));
    } catch {
        return { itens: [] };
    }
}

function salvar(base) {
    garantirBase();
    fs.writeFileSync(ARQUIVO, JSON.stringify(base, null, 2));
}

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function extrairTermos(texto) {
    const palavras = normalizar(texto).match(/[a-z0-9]{3,}/g) || [];
    const stopwords = new Set([
        "para", "como", "com", "que", "uma", "dos", "das", "pode",
        "sobre", "ser", "tem", "mais", "mas", "por", "sua", "seu", "isso",
        "este", "estaque", "quando", "onde", "qual", "quais", "tambem", "voce"
    ]);
    return palavras.filter((p) => !stopwords.has(p));
}

function registrar(conhecimento) {
    const base = carregar();
    const novo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        categoria: conhecimento.categoria || "geral",
        titulo: conhecimento.titulo || "Sem título",
        conteudo: conhecimento.conteudo || "",
        fonte: conhecimento.fonte || "chat",
        tags: conhecimento.tags || [],
        criadoEm: new Date().toISOString(),
        uso: 0
    };

    base.itens.push(novo);

    const daCategoria = base.itens.filter((i) => i.categoria === novo.categoria);
    while (daCategoria.length > LIMITE_POR_CATEGORIA) {
        const maisAntigo = daCategoria.shift();
        base.itens = base.itens.filter((i) => i.id !== maisAntigo.id);
    }

    salvar(base);
    return novo;
}

function consultar(texto, limite = 5) {
    const base = carregar();
    if (!base.itens.length) return { conhecimento: "", itens: [] };

    const termos = extrairTermos(texto);
    if (!termos.length) return { conhecimento: "", itens: [] };

    const pontuados = base.itens.map((item) => {
        const textoItem = normalizar(item.titulo + " " + item.conteudo + " " + item.tags.join(" "));
        let pontos = 0;
        for (const termo of termos) {
            if (textoItem.includes(termo)) pontos += 1;
        }
        pontos += Math.min(item.uso || 0, 10) * 0.1;
        return { item, pontos };
    });

    const relevantes = pontuados
        .filter((p) => p.pontos > 0)
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, limite);

    const relevantesIds = new Set(relevantes.map((r) => r.item.id));
    base.itens = base.itens.map((i) =>
        relevantesIds.has(i.id) ? { ...i, uso: (i.uso || 0) + 1 } : i
    );
    salvar(base);

    const conhecimento = relevantes
        .map((r, i) => `${i + 1}. [${r.item.categoria}] ${r.item.titulo}\n${r.item.conteudo}`)
        .join("\n\n");

    return {
        conhecimento,
        itens: relevantes.map((r) => r.item)
    };
}

function listarPorCategoria(categoria) {
    const base = carregar();
    return base.itens.filter((i) => i.categoria === categoria);
}

function remover(id) {
    const base = carregar();
    base.itens = base.itens.filter((i) => i.id !== id);
    salvar(base);
}

module.exports = {
    registrar,
    consultar,
    listarPorCategoria,
    remover,
    carregar
};
