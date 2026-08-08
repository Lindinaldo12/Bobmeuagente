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
        texto === "isso" ||
        // ✅ IDENTIDADE DO BOB (ADICIONADO CONFORME TUTORIAL)
        texto.includes("quem é você") ||
        texto.includes("quem e voce") ||
        texto.includes("qual é o seu nome") ||
        texto.includes("qual e o seu nome") ||
        texto.includes("como você se chama") ||
        texto.includes("como voce se chama") ||
        texto.includes("quem criou você") ||
        texto.includes("quem criou voce") ||
        texto.includes("você é qwen") ||
        texto.includes("voce e qwen") ||
        texto.includes("você é chatgpt") ||
        texto.includes("voce e chatgpt") ||
        texto.includes("você é openai") ||
        texto.includes("voce e openai") ||
        texto.includes("você é alibaba") ||
        texto.includes("voce e alibaba")
    ) {
        return {
            tipo: "perfil"
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
