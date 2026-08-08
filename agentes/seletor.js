const { carregarAgentes, carregarAgente } = require("./carregador");

function normalizar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function selecionar(texto) {

    texto = normalizar(texto);

    const agentes = carregarAgentes();

    let melhor = null;
    let maiorPontuacao = 0;

    for (const info of agentes) {

        if (!info.palavrasChave) continue;

        let pontos = 0;

        for (const palavra of info.palavrasChave) {

            const chave = normalizar(palavra);

            if (texto.includes(chave)) {
                pontos++;
            }
        }

        if (pontos > maiorPontuacao) {
            maiorPontuacao = pontos;
            melhor = info;
        }

    }

    if (!melhor) {
        return null;
    }

    console.log(
        `🎯 Agente escolhido: ${melhor.nome} (${maiorPontuacao} pontos)`
    );

    return carregarAgente(melhor.nome.toLowerCase());

}

module.exports = {
    selecionar,
    carregarAgente
};
