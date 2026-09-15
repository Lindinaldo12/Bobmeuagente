"use strict";
const { detectarContinuidade } = require("../config");
async function aplicarContinuidade(ctx) {
  ctx.perguntaOriginal = ctx.texto;
  if (ctx.ultimaPergunta && detectarContinuidade(ctx.texto)) {
    ctx.texto = `Pergunta anterior:\n${ctx.ultimaPergunta}\n\nNova solicitação:\n${ctx.texto}`;
  }
  return ctx;
}
module.exports = { aplicarContinuidade };
