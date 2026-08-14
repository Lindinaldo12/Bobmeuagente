function precisaWeb(texto) {

    if (!texto) {
        return false;
    }

    const pergunta = String(texto).toLowerCase();

    const indicadores = [

        // 🌤️ Clima e tempo
        "temperatura",
        "clima",
        "tempo agora",
        "tempo em",
        "previsão do tempo",
        "previsao do tempo",
        "vai chover",
        "está chovendo",
        "esta chovendo",

        // 💰 Finanças e cotações
        "dólar",
        "dolar",
        "euro",
        "cotação",
        "cotacao",
        "bitcoin",
        "ethereum",
        "criptomoeda",
        "preço atual",
        "preco atual",
        "valor atual",

        // 📰 Atualidade
        "agora",
        "atualmente",
        "atual",
        "hoje",
        "ontem",
        "amanhã",
        "amanha",
        "últimas notícias",
        "ultimas noticias",
        "notícias de hoje",
        "noticias de hoje",
        "recentemente",
        "recente",

        // 🌐 Pesquisa explícita
        "pesquise",
        "pesquisar",
        "procure na internet",
        "procure na web",
        "busque na internet",
        "busque na web",

        // ⚽ Resultados
        "placar",
        "resultado",
        "último jogo",
        "ultimo jogo",
        "jogo de hoje",
        "jogo de ontem",

        // 🛒 Preços
        "preço",
        "preco",
        "quanto custa",
        "valor de hoje",

        // 🔎 Internet
        "na internet",
        "na web",
        "online"
    ];

    return indicadores.some(indicador =>
        pergunta.includes(indicador)
    );
}

module.exports = {
    precisaWeb
};
