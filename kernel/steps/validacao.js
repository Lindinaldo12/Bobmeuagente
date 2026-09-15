"use strict";
async function validarResposta(ctx) {
  const { validadorResposta, detectorAlucinacao, autoavaliador, logger } = ctx.deps;
  const baseConhecimento = ctx.conhecimento?.conhecimento || "";
  let respostaFinal = ctx.resposta?.resposta || "";
  respostaFinal = validadorResposta.validar(respostaFinal, baseConhecimento);
  const verificacao = detectorAlucinacao.verificar(respostaFinal, baseConhecimento);
  respostaFinal = verificacao.resposta;
  const avaliacao = autoavaliador.avaliar(respostaFinal);
  if (!avaliacao.aprovada) logger.warn("Autoavaliador reprovou resposta", { problemas: avaliacao.problemas });
  ctx.respostaFinal = respostaFinal;
  return ctx;
}
module.exports = { validarResposta };
