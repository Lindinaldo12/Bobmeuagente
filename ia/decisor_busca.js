// ia/decisor_busca.js
// Decide quando buscar na internet e monta o termo de busca limpo.

const pesquisaWeb = require("./pesquisa_web");

// Palavras que indicam necessidade de dado ao vivo
const GATILHOS = [
    "clima", "previsao", "tempo", "cotacao", "preco", "noticia",
    "noticias", "hoje", "agora", "ultima", "ultimas", "resultado",
    "data", "campeonato", "jogo", "placar", "eleicao", "dolar",
    "euro", "bitcoin", "acao", "acoes", "fazenda", "horario",
    "quem venceu", "o que aconteceu", "novo", "lancamento"
];

function deveBuscar(texto) {
    const t = String(texto || "").toLowerCase();
    return GATILHOS.some((g) => t.includes(g));
}

async function buscarSeNecessario(texto) {
    const t = String(texto || "").trim();

    // Não busca comandos ou mensagens vazias
    if (!t || t.startsWith("/")) {
        return { buscou: false, dadosWeb: "" };
    }

    // Só busca se houver gatilho de dado ao vivo
    if (!deveBuscar(t)) {
        return { buscou: false, dadosWeb: "" };
    }

    const resultado = await pesquisaWeb.pesquisar(t);

    return {
        buscou: resultado.sucesso,
        dadosWeb: resultado.textoFormatado || ""
    };
}

module.exports = { deveBuscar, buscarSeNecessario };
