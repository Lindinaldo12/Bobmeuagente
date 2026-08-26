// Envio de mensagens longas em blocos (limite do Telegram: 4096 chars)
const LIMITE = 3800;

async function enviarEmBlocos(ctx, texto) {
  const msg = String(texto || "").trim();
  if (!msg) { await ctx.reply("..."); return; }
  if (msg.length <= LIMITE) { await ctx.reply(msg); return; }

  const blocos = [];
  let restante = msg;

  while (restante.length > 0) {
    let corte = LIMITE;
    if (restante.length > LIMITE) {
      const quebra = restante.lastIndexOf("\n", LIMITE);
      if (quebra > 500) corte = quebra;
    }
    blocos.push(restante.slice(0, corte));
    restante = restante.slice(corte);
  }

  for (const bloco of blocos) {
    await ctx.reply(bloco);
  }
}

module.exports = { enviarEmBlocos };
