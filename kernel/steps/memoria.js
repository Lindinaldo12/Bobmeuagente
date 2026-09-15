"use strict";
async function carregarMemoria(ctx) {
  const { memoria, memoriaContexto } = ctx.deps;
  const idUsuario = String(ctx.usuario?.id || "anonimo");
  ctx.idUsuario = idUsuario;
  ctx.memoria = memoria.carregar(idUsuario);
  ctx.usuarioMemoria = ctx.memoria;
  ctx.usuarioMemoria.ultimaMensagem = ctx.texto;
  const ultimoContexto = memoriaContexto.obter(ctx.usuario?.id);
  ctx.ultimaPergunta = ultimoContexto?.pergunta || "";
  return ctx;
}
async function salvarMemoria(ctx) {
  const { memoria, memoriaContexto } = ctx.deps;
  if (!ctx.idUsuario) return ctx;
  const respostaFinal = ctx.respostaFinal || ctx.resposta?.resposta || "";
  memoriaContexto.salvar(ctx.usuario?.id, {
    pergunta: ctx.perguntaOriginal ?? ctx.texto,
    resposta: respostaFinal,
  });
  memoria.salvar(ctx.idUsuario, ctx.usuarioMemoria);
  return ctx;
}
module.exports = { carregarMemoria, salvarMemoria };
