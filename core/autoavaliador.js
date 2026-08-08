function avaliar(resposta) {

    const problemas = [];

    if (resposta.length < 30) {
        problemas.push("Resposta muito curta.");
    }

    if (resposta.length > 3500) {
        problemas.push("Resposta muito longa.");
    }

    const repeticoes = /(.)\1{10,}/;

    if (repeticoes.test(resposta)) {
        problemas.push("Texto com repetição suspeita.");
    }

    return {
        aprovada: problemas.length === 0,
        problemas
    };
}

module.exports = {
    avaliar
};
