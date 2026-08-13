const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js atualizado com suporte a tempo real!");

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

      // Gatilhos para buscar na web
      const termosTempoReal = [
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'temperatura', 'clima', 'tempo em', 'hoje', 
        'quem ganhou', 'resultado', 'último jogo', '/pesquisar', 'pesquise'
      ];

      let dadosWeb = null;
      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🌐 Pesquisando dados atualizados na internet...");
        const termoLimpo = pergunta.replace('/pesquisar', '').trim();
        dadosWeb = await pesquisador.executar(termoLimpo || pergunta);
      }

      let promptFinal = pergunta;
      if (dadosWeb) {
        promptFinal = `[INSTRUÇÃO PRIORITÁRIA]: O sistema realizou uma busca na internet em tempo real para responder o usuário. Você DEVE usar as informações fornecidas abaixo e NÃO deve dizer que não possui dados em tempo real ou acesso à internet.\n\n[DADOS EM TEMPO REAL]:\n${dadosWeb}\n\n[PERGUNTA DO USUÁRIO]:\n${pergunta}`;
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
