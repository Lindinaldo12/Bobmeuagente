const { Bot } = require("grammy");

const config = require("../../config/config");
const ia = require("../../ia/gerenciador"); // corrigido: gerenciador
const memoria = require("../../memoria_v2");

const auth = require("../../core/auth");
const authSession = require("../../core/authSession");
const admin = require("./admin");

function criarBot() {
  const bot = new Bot(config.telegram.token);

  admin.registrarAdmin(bot);

  bot.command("start", async (ctx) => {
    // CORRIGIDO: carregarUsuario com 'r'
    let usuario = memoria.carregarUsuario(
      ctx.from.id,
      ctx.from.first_name
    );

    memoria.salvarUsuario(usuario);

    await ctx.reply(
      `Olá, ${usuario.nome}! \n\nBob AI está pronto para ajudar!`
    );
  });

  bot.on("message:text", async (ctx) => {
    console.log("📨 Mensagem recebida:", ctx.message.text);

    try {
      // CORRIGIDO: carregarUsuario com 'r'
      let usuario = memoria.carregarUsuario(
        ctx.from.id,
        ctx.from.first_name
      );

      const pergunta = ctx.message.text;

      usuario = memoria.aprenderAutomaticamente(
        usuario,
        pergunta
      );

      memoria.salvarUsuario(usuario);

      const historico = memoria.obterHistorico(usuario);

      // CORRIGIDO: Historico enviado junto da pergunta para a IA
      const resposta = await ia.perguntar(pergunta, historico);
      console.log("✅ IA respondeu");

      // Envia a resposta ao usuario
      await ctx.reply(resposta);
      console.log("✅ Resposta enviada ao Telegram");

    } catch (erro) {
      console.error("Erro no processamento:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };

