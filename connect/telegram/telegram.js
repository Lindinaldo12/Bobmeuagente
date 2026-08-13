const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js atualizado com resposta direta em tempo real!");

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

      // Lista de gatilhos para tempo real
      const termosTempoReal = [
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'temperatura', 'clima', 'tempo em', 'hoje', 
        'quem ganhou', 'resultado', 'último jogo', '/pesquisar', 'pesquise'
      ];

      // Se for pergunta de tempo real, responde DIRETO sem passar pelo Kernel travado
      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🌐 PROCESSANDO CONSULTA EM TEMPO REAL...");
        const termoLimpo = pergunta.replace('/pesquisar', '').trim();
        const respostaDireta = await pesquisador.executar(termoLimpo || pergunta);
        
        if (respostaDireta) {
          usuario = memoria.adicionarHistorico(usuario, pergunta, respostaDireta);
          memoria.salvarUsuario(usuario);
          await ctx.reply(respostaDireta, { parse_mode: 'Markdown' });
          return; // Finaliza aqui para a IA não interferir!
        }
      }

      // PROCESSAMENTO NORMAL PARA OUTROS ASSUNTOS (Kernel/IA)
      usuario = memoria.aprenderAutomaticamente(usuario, pergunta);
      memoria.salvarUsuario(usuario);

      const contexto = criarContexto({ texto: pergunta });
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
