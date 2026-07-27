const usuario = require("./usuario");
const historico = require("./historico");
const aprendizado = require("./aprendizado");

module.exports = {

    carregarUsuario: usuario.carregarUsuario,

    salvarUsuario: usuario.salvarUsuario,

    adicionarHistorico: historico.adicionarHistorico,

    obterHistorico: historico.obterHistorico,

    aprenderAutomaticamente: aprendizado.aprender

};

