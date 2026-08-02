const providers = require("./providers");
const historico = require("./historicoPesquisas");
const contexto = require("../../ia/contexto");

async function executar(texto, usuarioId) {

    const pergunta = texto.toLowerCase();

    if (
        pergunta.startsWith("pesquise ") ||
        pergunta.startsWith("procure ")
    ) {

        const consulta = texto
            .replace(/^pesquise\s+/i, "")
            .replace(/^procure\s+/i, "");

        // Registra a pesquisa no histórico
        historico.adicionar(consulta);

        const resultado = await providers.pesquisar(consulta);

        // Log de debug para ver o usuário
        console.log("USUÁRIO DA PESQUISA:");
        console.log(usuarioId);

        // Registra no contexto global (com ID do usuário)
        contexto.definir(
            usuarioId,
            "ultima_pesquisa",
            consulta
        );

        if (!resultado) {
            return "Não encontrei resultados.";
        }

        if (resultado.erro) {
            return resultado.erro;
        }

        return `🌐 Pesquisa concluída

📖 Título:
${resultado.titulo}

 Resumo:
${resultado.resumo}

 Fonte:
${resultado.fonte}`;
    }

    return null;
}

module.exports = {
    nome: "Pesquisa Web",
    categoria: "Web",
    versao: "1.0.0",
    descricao: "Pesquisa informações na internet.",
    executar
};
