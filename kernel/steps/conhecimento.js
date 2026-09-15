"use strict";
async function consultarConhecimento(ctx) {
  const { conhecimento } = ctx.deps;
  ctx.conhecimento = conhecimento.consultar(ctx.texto);
  return ctx;
}
module.exports = { consultarConhecimento };
