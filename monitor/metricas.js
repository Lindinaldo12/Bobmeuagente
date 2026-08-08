const metricas = {
    totalRequisicoes: 0,
    totalErros: 0,
    agentes: {}
};

function registrarSucesso(nomeAgente, tempo) {

    metricas.totalRequisicoes++;

    if (!metricas.agentes[nomeAgente]) {

        metricas.agentes[nomeAgente] = {
            chamadas: 0,
            erros: 0,
            tempoTotal: 0
        };

    }

    metricas.agentes[nomeAgente].chamadas++;
    metricas.agentes[nomeAgente].tempoTotal += tempo;

}

function registrarErro(nomeAgente) {

    metricas.totalErros++;

    if (!metricas.agentes[nomeAgente]) {

        metricas.agentes[nomeAgente] = {
            chamadas: 0,
            erros: 0,
            tempoTotal: 0
        };

    }

    metricas.agentes[nomeAgente].erros++;

}

function obter() {
    return metricas;
}

module.exports = {
    registrarSucesso,
    registrarErro,
    obter
};
