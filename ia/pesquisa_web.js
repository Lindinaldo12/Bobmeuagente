// ia/pesquisa_web.js
// Busca em Wikipedia (PT) + DuckDuckGo, sem chave de API, no Node 18+.

const conhecimento = require("../conhecimento/gerenciador");

const TIMEOUT_MS = 8000;
const USER_AGENT = "BobMeuAgente/1.0";

// Palavras de contexto que não devem ir para a busca.
// Aceita "previsão" e "previsao" (com e sem acento).
const STOPWORDS = /\b(clima|previs[ãa]o|tempo|hoje|agora|por favor|quero saber|quero)\b/gi;

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Mantém acentos no termo de busca (melhor resultado no Wikipedia),
// removendo apenas as stopwords e pontuação.
function limparTermo(texto) {
    return String(texto || "")
        .replace(STOPWORDS, " ")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
}

// Converte entidades HTML (&#160;, ", etc.) em texto legível.
function decodificarEntidades(texto) {
    return String(texto || "")
        .replace(/"/g, '"')
        .replace(/&#0*39;/g, "'")
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/ /g, " ")
        .replace(/&#\d+;/g, " ")
        .replace(/<[^>]+>/g, "");
}

// fetch com timeout, para a busca nunca travar o kernel.
async function buscarComTimeout(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) return null;
    return res;
}

async function buscarWikipedia(termo) {
    const url =
        "https://pt.wikipedia.org/w/api.php" +
        "?action=query&list=search&srsearch=" +
        encodeURIComponent(termo) +
        "&format=json&srlimit=3";

    try {
        const res = await buscarComTimeout(url);
        if (!res) return [];

        const dados = await res.json();
        return (dados?.query?.search || []).map((r) => ({
            titulo: r.title,
            trecho: decodificarEntidades(r.snippet),
            url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/\s+/g, "_"))}`
        }));
    } catch (erro) {
        console.log("⚠️ ERRO WIKIPEDIA:", erro?.message);
        return [];
    }
}

async function buscarDuckDuckGo(termo) {
    const url =
        "https://api.duckduckgo.com/" +
        "?q=" + encodeURIComponent(termo) +
        "&format=json&no_html=1&skip_disambig=1";

    try {
        const res = await buscarComTimeout(url);
        if (!res) return [];

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
    } catch (erro) {
        console.log("⚠️ ERRO DUCKDUCKGO:", erro?.message);
        return [];
    }
}

async function pesquisar(texto) {
    const termo = limparTermo(texto);
    if (!termo) {
        return { sucesso: false, termo, resultados: [], textoFormatado: "" };
    }

    let resultados = [];

    try {
        const [wiki, ddgs] = await Promise.all([
            buscarWikipedia(termo),
            buscarDuckDuckGo(termo)
        ]);
        resultados = [...wiki, ...ddgs];
    } catch (erro) {
        console.log("⚠️ ERRO NA BUSCA:", erro?.message);
    }

    // Deduplica por título normalizado (sem acento, minúsculo).
    const vistos = new Set();
    resultados = resultados.filter((r) => {
        const chave = normalizar(r.titulo);
        if (!chave || vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
    });

    const textoFormatado = resultados
        .map((r, i) => `${i + 1}. ${r.titulo}\n${r.trecho}\nFonte: ${r.url}`)
        .join("\n\n");

    // Registra no conhecimento, sem deixar erro derrubar a pesquisa.
    if (resultados.length && typeof conhecimento.registrar === "function") {
        try {
            conhecimento.registrar({
                categoria: "web",
                titulo: termo,
                conteudo: textoFormatado.slice(0, 1500),
                fonte: "pesquisa_web"
            });
        } catch (erro) {
            console.log("⚠️ ERRO AO REGISTRAR CONHECIMENTO:", erro?.message);
        }
    }

    return { sucesso: resultados.length > 0, termo, resultados, textoFormatado };
}

module.exports = { pesquisar, limparTermo };
