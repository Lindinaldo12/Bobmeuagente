const registro = require("../agentes/registroCentral");

async function executarPlano(plano, contexto) {

    const respostas = [];

    for (const etapa of plano.etapas) {

        const agente = registro.obter(etapa.agente);

        if (!agente) continue;

        const resposta = await agente.executar({
            ...contexto,
            texto: contexto.texto
        });

        respostas.push({
            etapa: etapa.nome,
            agente: etapa.agente,
            resposta
        });

    }

    return respostas;
}

module.exports = {
    executarPlano
};
