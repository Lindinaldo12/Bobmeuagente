function construir(resposta, contexto) {

    let texto = "";

    if (typeof resposta === "string") {
        texto = resposta;
    } else if (resposta && resposta.resposta) {
        texto = resposta.resposta;
    } else {
        texto = String(resposta);
    }

    texto = texto.trim();

    // Remove linhas em branco repetidas
    texto = texto.replace(/\n{3,}/g, "\n\n");

    // Remove espaços duplicados
    texto = texto.replace(/[ ]{2,}/g, " ");

    // Remove espaços no fim das linhas
    texto = texto
        .split("\n")
        .map(l => l.trimEnd())
        .join("\n");

    // Converte listas
    texto = texto.replace(/^- /gm, "• ");

    // Remove linhas repetidas
    const linhas = texto.split("\n");
    const resultado = [];
    const vistas = new Set();

    for (const linha of linhas) {
        const chave = linha.trim();

        if (!chave) {
            resultado.push("");
            continue;
        }

        if (!vistas.has(chave)) {
            vistas.add(chave);
            resultado.push(linha);
        }
    }

    texto = resultado.join("\n");

    // Limite para evitar mensagens gigantes
    if (texto.length > 3500) {
        texto = texto.substring(0, 3500);
        texto += "\n\n...(resposta resumida para caber no Telegram)";
    }

    return texto.trim();
}

module.exports = {
    construir
};
