function validar(resposta, conhecimento = "") {

    // Remove repetições de parágrafos
    const partes = resposta.split("\n\n");
    const unicas = [...new Set(partes)];
    resposta = unicas.join("\n\n");

    // Limita respostas muito longas
    if (resposta.length > 4000) {
        resposta = resposta.substring(0, 4000);
    }

    // Remove excesso de linhas em branco
    resposta = resposta.replace(/\n{3,}/g, "\n\n");

    return resposta.trim();
}

module.exports = {
    validar
};
