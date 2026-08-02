function decidir(pergunta) {

    const texto = pergunta.toLowerCase();

    // ===== PESQUISA WEB =====
    if (
        texto.startsWith("pesquise ") ||
        texto.startsWith("procure ")
    ) {
        return {
            tipo: "ferramenta"
        };
    }

    // ===== HISTÓRICO DE PESQUISAS =====
    if (
        texto.includes("minhas pesquisas") ||
        texto.includes("histórico de pesquisas") ||
        texto.includes("historico de pesquisas") ||
        texto.includes("última pesquisa") ||
        texto.includes("ultima pesquisa")
    ) {
        return {
            tipo: "ferramenta"
        };
    }

    // Matemática (contas simples)
    if (/^\d+(\.\d+)?\s*[\+\-\*\/]\s*\d+(\.\d+)?$/.test(texto)) {
        return {
            tipo: "ferramenta"
        };
    }

    // Perfil
    if (
        texto.includes("meu nome") ||
        texto.includes("onde eu moro") ||
        texto.includes("minha profissão") ||
        texto.includes("minha profissao") ||
        texto.includes("meus projetos") ||
        texto.includes("meus objetivos") ||
        texto.includes("filme favorito") ||
        texto.includes("quais ferramentas") ||
        texto.includes("que ferramentas") ||
        texto.includes("liste suas ferramentas") ||
        texto.includes("liste as ferramentas") ||
        texto === "ele" ||
        texto === "ela" ||
        texto === "esse" ||
        texto === "essa" ||
        texto === "isso"
    ) {
        return {
            tipo: "perfil"
        };
    }

    // Aprendizado
    if (
        texto.includes("meu nome é") ||
        texto.includes("eu moro em") ||
        texto.includes("eu sou") ||
        texto.includes("meu projeto é") ||
        texto.includes("meu objetivo é")
    ) {
        return {
            tipo: "aprendizado"
        };
    }

    // Ferramentas (data/hora e notas)
    if (
        texto.includes("que horas") ||
        texto.includes("data de hoje") ||
        texto.includes("anote:") ||
        texto.includes("minhas notas") ||
        texto.includes("quais são minhas notas")
    ) {
        return {
            tipo: "ferramenta"
        };
    }

    // IA (padrão)
    return {
        tipo: "ia"
    };
}

module.exports = {
    decidir
};
