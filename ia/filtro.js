// ia/filtro.js
// Corrige o bug de poluição de contexto: remove comandos (/...)
// e mensagens irrelevantes antes de montar contexto e termo de busca.

// Filtra comandos e mensagens vazias; retorna as N últimas relevantes
function limparHistorico(historico, limite = 5) {
    return (historico || [])
        .map((m) => String(m || "").trim())
        .filter((texto) => {
            if (!texto) return false;
            if (texto.startsWith("/")) return false; // /menu, /desenhar, /simplificar
            return true;
        })
        .slice(-limite);
}

// Monta o termo de busca limpo (sem comandos)
function montarTermoBusca(historico, perguntaAtual) {
    const limpo = limparHistorico(historico, 3);
    const base = limpo.join(" ");
    const atual = String(perguntaAtual || "").trim().replace(/^\//, "");
    return (base + " " + atual).trim();
}

module.exports = {
    limparHistorico,
    montarTermoBusca
};
