function verificar(resposta, conhecimento) {

    if (!conhecimento || !conhecimento.trim()) {
        return {
            confiavel: true,
            resposta
        };
    }

    const frasesSuspeitas = [
        "eu acredito",
        "provavelmente",
        "talvez",
        "imagino",
        "suponho"
    ];

    const texto = resposta.toLowerCase();

    for (const frase of frasesSuspeitas) {
        if (texto.includes(frase)) {
            return {
                confiavel: false,
                resposta:
                    "⚠️ A resposta foi bloqueada porque contém informações de baixa confiança."
            };
        }
    }

    return {
        confiavel: true,
        resposta
    };
}

module.exports = {
    verificar
};
