const motor = require("./motor");

function consultar(pergunta) {

    const resultados = motor.buscar(pergunta);

    // ✅ LOGS DE DEBUG (ADICIONADOS!)
    console.log("===== GERENCIADOR =====");
    console.log("Quantidade de documentos:", resultados.length);

    for (const r of resultados) {
        console.log(
            `Documento: ${r.nome} | Pontos: ${r.pontos}`
        );
    }

    console.log("=======================");

    if (!resultados || resultados.length === 0) {

        return {
            encontrou: false,
            conhecimento: ""
        };

    }

    return {

        encontrou: true,

        conhecimento: resultados
            .slice(0, 3)
            .map(r => r.conteudo)
            .join("\n\n")

    };

}

module.exports = {
    consultar
};
