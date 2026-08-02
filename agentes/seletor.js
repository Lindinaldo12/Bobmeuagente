const { carregarAgentes } = require("./carregador");

function selecionar(texto) {

    texto = texto.toLowerCase();

    // Pesquisa Web tem prioridade
    if (
        texto.startsWith("pesquise ") ||
        texto.startsWith("procure ")
    ) {
        return null;
    }

    const agentes = carregarAgentes();

    // Programador
    if (
        texto.includes("código") ||
        texto.includes("codigo") ||
        texto.includes("programa") ||
        texto.includes("função") ||
        texto.includes("funcao") ||
        texto.includes("classe") ||
        texto.includes("método") ||
        texto.includes("metodo") ||
        texto.includes("algoritmo") ||
        texto.includes("script") ||
        texto.includes("site") ||
        texto.includes("aplicativo") ||
        texto.includes("app") ||
        texto.includes("api") ||
        texto.includes("javascript") ||
        texto.includes("node") ||
        texto.includes("python") ||
        texto.includes("rust") ||
        texto.startsWith("crie ")
    ) {
        return agentes.find(a => a.nome === "Programador");
    }

    return null;
}

module.exports = {
    selecionar
};
