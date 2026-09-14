// ia/pesquisa_web.js
// Busca em Wikipedia (PT) + DuckDuckGo, sem chave de API, no Node 18+.

const conhecimento = require("../conhecimento/gerenciador");

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function limparTermo(texto) {
    return normalizar(texto)
        .replace(/\b(clima|previsao|tempo|hoje|agora|por favor|quero saber|quero)\b/g, "")
        .replace(/[^\s\w]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
}

async function buscarWikipedia(termo) {
    const url =
        "https://pt.wikipedia.org/w/api.php" +
        "?action=query&list=search&srsearch=" +
        encodeURIComponent(termo) +
        "&format=json&srlimit=3";

    const res = await fetch(url, {
        headers: { "User-Agent": "BobMeuAgente/1.0" }
    });
    if (!res.ok) return [];

    const dados = await res.json();
    return (dados?.query?.search || []).map((r) => ({
        titulo: r.title,
        trecho: r.snippet.replace(/<[^>]+>/g, ""),
        url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`
    }));
}

async function buscarDuckDuckGo(termo) {
    const url =
        "https://api.duckduckgo.com/" +
        "?q=" + encodeURIComponent(termo) +
        "&format=json&no_html=1&skip_disambig=1";

    const res = await fetch(url, {
        headers: { "User-Agent": "BobMeuAgente/1.0" }
    });
    if (!res.ok) return [];

    const dados = await res.json();
    const resultados = [];

    if (dados?.AbstractText) {
        resultados.push({
            titulo: dados.Heading || termo,
            trecho: dados.AbstractText,
            url: dados.AbstractURL || ""
        });
    }

    (dados?.RelatedTopics || []).forEach((r) => {
        if (r.Text && r.Text.length > 30) {
            resultados.push({
                titulo: r.Text.split(" - ")[0],
                trecho: r.Text,
                url: r.FirstURL || ""
            });
        }
    });

    return resultados.slice(0, 4);
}

async function pesquisar(texto) {
    const termo = limparTermo(texto);
    if (!termo) return { sucesso: false, termo, resultados: [], textoFormatado: "" };

    let resultados = [];
    try {
        const [wiki, ddg] = await Promise.all([
            buscarWikipedia(termo),
            buscarDuckDuckGo(termo)
        ]);
        resultados = [...wiki, ...ddg];
    } catch (erro) {
        console.log("⚠️ ERRO NA BUSCA:", erro?.message);
    }

    const vistos = new Set();
    resultados = resultados.filter((r) => {
        const chave = normalizar(r.titulo);
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
    });

    const textoFormatado = resultados
        .map((r, i) => `${i + 1}. ${r.titulo}\n${r.trecho}\nFonte: ${r.url}`)
        .join("\n\n");

    if (resultados.length) {
        conhecimento.registrar({
            categoria: "web",
            titulo: termo,
            conteudo: textoFormatado.slice(0, 1500),
            fonte: "pesquisa_web"
        });
    }

    return { sucesso: resultados.length > 0, termo, resultados, textoFormatado };
}

module.exports = { pesquisar, limparTermo };
