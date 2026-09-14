#!/bin/bash
set -e
echo "=== Instalando upgrade de conhecimento + evolução ==="

mkdir -p dados/conhecimento dados
mkdir -p dados/evolucao dados/perfil
mkdir -p ia

# ============================================================
# 1. conhecimento/gerenciador.js
# ============================================================
cat > conhecimento/gerenciador.js << 'JS'
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
JS
echo "OK: conhecimento/gerenciador.js"

# ============================================================
# 2. ia/filtro.js  (corrige o bug de poluição de contexto)
# ============================================================
cat > ia/filtro.js << 'JS'
// ia/filtro.js
// Corrige o bug de poluição de contexto: remove comandos (/...)
// e mensagens irrelevantes antes de montar contexto e termo de busca.

// Filtra comandos e mensagens vazias; retorna as N últimas relevantes
function limparHistorico(historico, limite = 5) {
    return (historico || [])
        .map((m) => String(m || "").trim())
        .filter((texto) => {
            if (!texto) return false;
            if (texto.startsWith("/")) return false; // /menu, /desenhar, /simplificar
            return true;
        })
        .slice(-limite);
}

// Monta o termo de busca limpo (sem comandos)
function montarTermoBusca(historico, perguntaAtual) {
    const limpo = limparHistorico(historico, 3);
    const base = limpo.join(" ");
    const atual = String(perguntaAtual || "").trim().replace(/^\//, "");
    return (base + " " + atual).trim();
}

module.exports = {
    limparHistorico,
    montarTermoBusca
};
JS
echo "OK: ia/filtro.js"

# ============================================================
# 3. ia/evolucao.js
# ============================================================
cat > ia/evolucao.js << 'JS'
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
JS
echo "OK: ia/evolucao.js"

# ============================================================
# 4. ia/perfil.js
# ============================================================
cat > ia/perfil.js << 'JS'
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "..", "dados", "perfis");
const LIMITE_PREFS = 30;

function caminhoPerfil(idUsuario) {
    return path.join(DIR, `perfil_${idUsuario}.json`);
}

function garantir() {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function carregar(idUsuario) {
    garantir();
    const caminho = caminhoPerfil(idUsuario);
    try {
        return JSON.parse(fs.readFileSync(caminho, "utf-8"));
    } catch {
        return {
            id: idUsuario,
            preferencias: [],
            fatos: [],
            criadoEm: new Date().toISOString()
        };
    }
}

function salvar(perfil) {
    garantir();
    fs.writeFileSync(caminhoPerfil(perfil.id), JSON.stringify(perfil, null, 2));
}

function adicionarPreferencia(idUsuario, preferencia) {
    const perfil = carregar(idUsuario);
    const existe = perfil.preferencias?.some(
        (p) => p.tipo === preferencia.tipo && p.valor.toLowerCase() === preferencia.valor.toLowerCase()
    );
    if (!existe) {
        perfil.preferencias.push({ ...preferencia, aprendidoEm: new Date().toISOString() });
        while (perfil.preferencias.length > LIMITE_PREFS) perfil.preferencias.shift();
        salvar(perfil);
    }
    return perfil;
}

function atualizarPreferencias(usuarioMemoria, texto) {
    if (!usuarioMemoria?.id) return;
    const perfil = carregar(usuarioMemoria.id);
    perfil.ultimoTexto = String(texto || "").slice(0, 2000);
    salvar(perfil);
    return perfil;
}

function montarContextoPerfil(idUsuario) {
    const perfil = carregar(idUsuario);
    const partes = [];
    if (perfil.preferencias?.length) {
        partes.push("PREFERÊNCIAS DO USUÁRIO:\n" +
            perfil.preferencias.map((p) => `- [${p.tipo}] ${p.valor}`).join("\n"));
    }
    if (perfil.fatos?.length) {
        partes.push("FATOS SOBRE O USUÁRIO:\n" + perfil.fatos.join("\n"));
    }
    return partes.join("\n\n");
}

module.exports = {
    carregar,
    salvar,
    adicionarPreferencia,
    atualizarPreferencias,
    montarContextoPerfil
};
JS
echo "OK: ia_percentes.js"

echo ""
echo "=== Instalação concluída! ==="
echo "Arquivos criados:"
echo "  - conhecimento/gerenciador.js"
echo "  - ia/filtro.js"
echo "  - ia/evolucao.js"
echo "  - ia/perfil.js"
