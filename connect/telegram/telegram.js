const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js configurado sem travas!");

function criarBot() {
  const bot = new Bot(config.telegram.token);
  bot.use(session({ initial: () => ({}) }));

  // Trata o comando /pesquisar
  bot.command("pesquisar", async (ctx) => {
    const busca = ctx.match;
    if (!busca) return ctx.reply("⚠️ Digite o que deseja pesquisar. Ex: `/pesquisar temperatura em sao paulo`", { parse_mode: "Markdown" });
    
    await ctx.reply("🔍 Pesquisando...");
    const res = await pesquisador.executar(busca);
    if (res) return ctx.reply(res, { parse_mode: "Markdown" });
    return ctx.reply("❌ Não encontrei resultados para essa busca.");
  });

  bot.on(":text", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
      let pergunta = ctx.message.text;
      const textoLower = pergunta.toLowerCase();

      // Gatilhos de Busca em Tempo Real
      const gatilhos = ['temperatura', 'clima', 'tempo em', 'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 'ultimo jogo', 'quem ganhou'];
      
      if (gatilhos.some(g => textoLower.includes(g))) {
        console.log("🌐 Acionando agente pesquisador...");
        const resWeb = await pesquisador.executar(pergunta);
        if (resWeb) {
          await ctx.reply(resWeb, { parse_mode: "Markdown" });
          return; // Encerra aqui para evitar respostas engessadas do Kernel
        }
      }

      // Processamento Normal do Kernel
      const contexto = criarContexto({ texto: pergunta });
      let resposta = "Desculpe, tive um problema ao processar sua resposta.";
      
      try {
        const resultado = await kernel.executar(contexto);
        resposta = typeof resultado === "string" ? resultado : (resultado.texto || resposta);
      } catch (errKernel) {
        console.error("Erro no Kernel/Ollama:", errKernel.message);
        resposta = "⚠️ O módulo de inteligência offline (Ollama) está indisponível no servidor Render no momento.";
      }

      await ctx.reply(resposta);

    } catch (erro) {
      console.error("Erro geral no Telegram:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };
