function executar(texto) {

    const agora = new Date();

    const data = agora.toLocaleDateString("pt-BR");

    const hora = agora.toLocaleTimeString("pt-BR");

    const pergunta = texto.toLowerCase();

    if (
        pergunta.includes("que horas") ||
        pergunta.includes("hora")
    ) {
        return `Agora são ${hora}.`;
    }

    if (
        pergunta.includes("data") ||
        pergunta.includes("dia de hoje")
    ) {
        return `Hoje é ${data}.`;
    }

    return null;
}

module.exports = {
    nome: "Data e Hora",
    categoria: "Sistema",
    versao: "1.0.0",
    descricao: "Informa a data e a hora atuais.",

    exemplos: [
        "Que horas são?",
        "Qual é a data de hoje?",
        "Que dia é hoje?"
    ],

    executar
};
