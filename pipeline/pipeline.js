function executar(fluxo) {

    fluxo.log = [];

    fluxo.log.push("Fluxo criado");

    fluxo.log.push("Mensagem recebida");

    fluxo.log.push("Pronto para roteamento");

    return fluxo;

}

module.exports = {
    executar
};
