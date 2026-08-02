const usuario = require("./usuario");
const historico = require("./historico");
const aprendizado = require("./aprendizado");

module.exports = {
    carregarUsuario: usuario.carregarUsuario,

    salvarUsuario: usuario.salvarUsuario,

    adicionarHistorico: historico.adicionarHistorico,

    obterHistorico: historico.obterHistorico,

    // Compatibilidade com o código antigo
    aprender: aprendizado.aprender,

    // Novo nome da função
    aprenderAutomaticamente: aprendizado.aprender
};

