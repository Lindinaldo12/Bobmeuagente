"use strict";
const { carregarMemoria, salvarMemoria } = require("./memoria");
const { aplicarContinuidade } = require("./continuidade");
const { pesquisarWeb } = require("./web");
const { consultarConhecimento } = require("./conhecimento");
const { orquestrar } = require("./orquestracao");
const { validarResposta } = require("./validacao");
module.exports = {
  carregarMemoria,
  aplicarContinuidade,
  pesquisarWeb,
  consultarConhecimento,
  orquestrar,
  validarResposta,
  salvarMemoria,
};
