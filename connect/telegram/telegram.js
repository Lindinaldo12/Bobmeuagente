const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js configurado com respostas diretas!");

function criarBot() {
  const bot = new Bot(config.telegram.token);
  bot.use(session({ initial: () => ({}) }));

  // Interceptador global para QUALQUER texto no Telegram
  bot.on(":text", async (ctx) => {
    const pergunta = ctx.message.text;
    console.log(`📩 MENSAGEM RECEBIDA NO TELEGRAM: "${pergunta}"`);

    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      const textoLower = pergunta.toLowerCase();

      // Lista de termos para acionar pesquisa direta
      const termosTempoReal = [
        'temperatura', 'clima', 'tempo em', 
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'ultimo jogo', 'último jogo', 'quem ganhou', '/pesquisar'
      ];

      // Se contiver qualquer termo de tempo real
      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🌐 BUSCANDO NA WEB E RESPONDENDO DIRETO...");
        const respostaWeb = await pesquisador.executar(pergunta);
        
        if (respostaWeb) {
          await ctx.reply(respostaWeb, { parse_mode: 'Markdown' });
          return; // Para aqui para evitar travas de IA!
        }
      }

      // Se for conversa comum
      await ctx.reply(`🤖 Bob respondendo: Recebi sua mensagem: "${pergunta}"`);

    } catch (erro) {
      console.error("Erro no Telegram:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };
