"use strict";
async function orquestrar(ctx) {
  const { planner, orquestrador, ia, config } = ctx.deps;
  ctx.plano = planner.criarPlano(ctx.texto);
  let resposta = await orquestrador.processar(ctx);
  if (resposta.status === "ia") {
    resposta.resposta = await chamarIaComTimeout(ia, ctx, config);
  }
  ctx.resposta = resposta;
  return ctx;
}
async function chamarIaComTimeout(ia, ctx, config) {
  if (!ia?.perguntar) throw new Error("Serviço de IA não configurado");
  const timeoutMs = config?.ia?.timeoutMs || 15000;
  return Promise.race([
    ia.perguntar(ctx.texto, ctx.historico, ctx.usuario),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout no serviço de IA")), timeoutMs)
    ),
  ]);
}
module.exports = { orquestrar };
