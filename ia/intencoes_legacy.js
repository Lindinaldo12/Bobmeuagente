const PREFERENCIAS = require("./configPreferencias");

function detectar(texto) {
    texto = texto.toLowerCase().trim();

    // Preferências cadastradas
    for (const pref of PREFERENCIAS) {
        if (texto.includes(pref.aprender)) {
            return "aprendizado";
        }

        if (texto.includes(pref.perguntar)) {
            return "perfil";
        }
    }

    // ===== APRENDIZADO =====
    if (
        texto.includes("meu nome é") ||
        texto.includes("eu moro em") ||
        texto.includes("eu sou") ||
        texto.includes("meu projeto é") ||
        texto.includes("meu objetivo é") ||
        texto.includes("quero") ||
        texto.includes("pretendo") ||
        texto.includes("meu filme favorito é")
    ) {
        return "aprendizado";
    }

    // ===== PERFIL =====
    if (
        texto.includes("qual é meu nome") ||
        texto.includes("quem sou eu") ||
        texto.includes("onde eu moro") ||
        texto.includes("qual é minha profissão") ||
        texto.includes("quais são meus projetos") ||
        texto.includes("qual é meu projeto") ||
        texto.includes("quais são meus objetivos") ||
        texto.includes("qual é meu objetivo") ||
        texto.includes("qual é meu filme favorito") ||
        texto.includes("esse projeto") ||
        texto === "ele" ||
        texto === "ela" ||
        texto === "esse" ||
        texto === "essa" ||
        texto === "isso" ||
        texto.includes("o que você sabe sobre mim") ||
        texto.includes("o que voce sabe sobre mim") ||
        texto.includes("o que sabe sobre mim") ||
        texto.includes("o que você sabe de mim") ||
        texto.includes("o que voce sabe de mim")
    ) {
        return "perfil";
    }

    return "ia";
}

module.exports = {
    detectar
};
