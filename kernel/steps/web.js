"use strict";
async function pesquisarWeb(ctx) {
  const { detectorWeb, pesquisador, logger } = ctx.deps;
  const precisa = detectorWeb.precisaWeb(ctx.texto);
  ctx.precisaWeb = precisa;
  if (!precisa) { ctx.dadosWeb = ""; return ctx; }
  logger.info("Iniciando pesquisa web", { consulta: ctx.texto });
  try {
    const resultado = await pesquisador.executar(ctx.texto);
    ctx.dadosWeb = resultado || "";
    logger.info("Dados web obtidos", { temDados: Boolean(resultado) });
  } catch (erro) {
    ctx.dadosWeb = "";
    logger.error("Falha na pesquisa web", { erro: erro.message });
  }
  return ctx;
}
module.exports = { pesquisarWeb };
