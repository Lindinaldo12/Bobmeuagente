const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js atualizado com injeção de contexto web!");

function criarBot() {
  const bot = new Bot(config.telegram.token);
  bot.use(session({ initial: () => ({}) }));

  bot.on(":text", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
      let pergunta = ctx.message.text;
      const textoLower = pergunta.toLowerCase();

      // Gatilhos para acionar a busca na web
      const termosTempoReal = [
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'temperatura', 'clima', 'tempo em', 'hoje', 
        'quem ganhou', 'resultado', 'último jogo', '/pesquisar', 'pesquise'
      ];

      let dadosWeb = null;
      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🌐 Buscando dados na web em tempo real...");
        const termoLimpo = pergunta.replace('/pesquisar', '').trim();
        dadosWeb = await pesquisador.executar(termoLimpo || pergunta);
      }

      // Se houver dados da web, injetamos no prompt da IA
      let promptFinal = pergunta;
      if (dadosWeb) {
        promptFinal = `[INFORMAÇÃO EM TEMPO REAL OBTIDA DA WEB]:\n${dadosWeb}\n\n[PERGUNTA DO USUÁRIO]:\n${pergunta}\n\nInstrução: Responda à pergunta do usuário usando com precisão os dados em tempo real fornecidos acima.`;
      }

      usuario = memoria.aprenderAutomaticamente(usuario, pergunta);
      memoria.salvarUsuario(usuario);

      const contexto = criarContexto({ texto: promptFinal });
      const resultado = await kernel.executar(contexto);
      const resposta = typeof resultado === "string" ? resultado : resultado.texto;

      usuario = memoria.adicionarHistorico(usuario, pergunta, resposta);
      memoria.salvarUsuario(usuario);

      await ctx.reply(resposta);

    } catch (erro) {
      console.error("Erro no processamento:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };
