function validar(resposta, conhecimento) {

    if (!conhecimento || !conhecimento.trim()) {
        return resposta;
    }

    resposta = resposta.trim();

    // Remove repetições de parágrafos
    const paragrafos = resposta.split("\n\n");
    const vistos = new Set();

    const resultado = [];

    for (const p of paragrafos) {
        const chave = p.trim();

        if (!vistos.has(chave)) {
            vistos.add(chave);
            resultado.push(p);
        }
    }

    return resultado.join("\n\n");
}

module.exports = {
    validar
};
