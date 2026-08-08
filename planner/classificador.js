function classificar(texto) {

    texto = texto.toLowerCase();

    // Professor
    if (
        texto.includes("explique") ||
        texto.includes("ensine") ||
        texto.includes("o que é") ||
        texto.includes("defina")
    ) {
        return "professor";
    }

    // Analista
    if (
        texto.includes("analise") ||
        texto.includes("analisar") ||
        texto.includes("compare") ||
        texto.includes("comparar")
    ) {
        return "analista";
    }

    // Escritor
    if (
        texto.includes("escreva") ||
        texto.includes("artigo") ||
        texto.includes("texto") ||
        texto.includes("resuma") ||
        texto.includes("resumo")
    ) {
        return "escritor";
    }

    // Programador
    if (
        texto.includes("código") ||
        texto.includes("codigo") ||
        texto.includes("node") ||
        texto.includes("python") ||
        texto.includes("api") ||
        texto.includes("programa")
    ) {
        return "programador";
    }

    // Segurança
    if (
        texto.includes("vulnerabilidade") ||
        texto.includes("pentest") ||
        texto.includes("hacking") ||
        texto.includes("exploit") ||
        texto.includes("criptografia") ||
        texto.includes("firewall")
    ) {
        return "seguranca";
    }

    // Pesquisador
    if (
        texto.includes("pesquise") ||
        texto.includes("procure") ||
        texto.includes("busque")
    ) {
        return "pesquisador";
    }

    return "professor";
}

module.exports = {
    classificar
};
