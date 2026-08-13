const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js configurado para respostas diretas em tempo real!");

function criarBot() {
  const bot = new Bot(config.telegram.token);
  bot.use(session({ initial: () => ({}) }));

  // Comando dedicado /pesquisar
  bot.command("pesquisar", async (ctx) => {
    const busca = ctx.match;
    if (!busca) return ctx.reply("⚠️ Digite o que deseja pesquisar. Ex: `/pesquisar temperatura em sao paulo`", { parse_mode: "Markdown" });
    
    await ctx.reply("🔍 Pesquisando na web em tempo real...");
    const res = await pesquisador.executar(busca);
    if (res) return ctx.reply(res, { parse_mode: "Markdown" });
    return ctx.reply("❌ Não encontrei resultados para essa busca.");
  });

  // Interceptador para mensagens de texto comuns
  bot.on(":text", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let pergunta = ctx.message.text;
      const textoLower = pergunta.toLowerCase();

      // Gatilhos de busca em tempo real
      const gatilhos = ['temperatura', 'clima', 'tempo em', 'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 'ultimo jogo', 'quem ganhou'];
      
      if (gatilhos.some(g => textoLower.includes(g))) {
        console.log("🌐 Busca em tempo real solicitada...");
        const resWeb = await pesquisador.executar(pergunta);
        if (resWeb) {
          await ctx.reply(resWeb, { parse_mode: "Markdown" });
          return; // Responde direto e encerra o fluxo!
        }
      }

      // Se não for termo de tempo real, responde com mensagem padrão sem quebrar
      await ctx.reply("🤖 Recebi sua mensagem! Para fazer pesquisas em tempo real, você também pode usar `/pesquisar <termo>`.", { parse_mode: "Markdown" });

    } catch (erro) {
      console.error("Erro no processamento:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };
