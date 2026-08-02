const historicoPesquisas = require("./historicoPesquisas");
const contexto = require("../../ia/contexto");

function executar(texto) {

    const pergunta = texto.toLowerCase();

    if (
        pergunta.includes("minhas pesquisas") ||
        pergunta.includes("histórico de pesquisas")
    ) {
        const lista = historicoPesquisas.listar();

        if (lista.length === 0) {
            return "Você ainda não realizou nenhuma pesquisa.";
        }

        let resposta = "📚 Histórico de pesquisas:\n\n";

        lista.forEach((item, indice) => {
            resposta += `${indice + 1}. ${item.consulta}\n`;
        });

        return resposta;
    }

    if (
        pergunta.includes("última pesquisa") ||
        pergunta.includes("ultima pesquisa")
    ) {
        const ultima = contexto.obter(
            "web",
            "ultima_pesquisa"
        );

        if (!ultima) {
            return "Ainda não há pesquisas nesta conversa.";
        }

        return `Sua última pesquisa foi: ${ultima}.`;
    }

    return null;
}

module.exports = {
    nome: "Histórico de Pesquisas",
    categoria: "Web",
    versao: "1.0.0",
    descricao: "Mostra as pesquisas realizadas.",
    executar
};
