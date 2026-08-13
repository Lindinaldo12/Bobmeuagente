const { Bot, session } = require("grammy");
const config = require("../../config/config");
const ia = require("../../ia/gerenciador");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const status = require("../../dashboard/status");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const admin = require("./admin");
const comandosMemoria = require("./comandosMemoria");
const comandosAdmin = require("./comandosAdmin");
const comandosPlugins = require("./comandosPlugins");
const pluginManager = require("../../core/pluginManager");

console.log("✅ telegram.js atualizado");

function criarBot() {
  const bot = new Bot(config.telegram.token);

  bot.use(session({ initial: () => ({}) }));

  admin.registrarAdmin(bot);
  comandosMemoria.registrarComandosMemoria(bot);
  comandosAdmin.registrarComandosAdmin(bot);
  comandosPlugins.registrarComandosPlugins(bot);

  bot.on(":text", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
      const pergunta = ctx.message.text;
      const textoLower = pergunta.toLowerCase();

      // GATILHO 1: Cotações e Pesquisas em Tempo Real
      const termosTempoReal = [
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'temperatura', 'clima', 'tempo em', 'hoje', 
        'quem ganhou', 'resultado', 'último jogo', '/pesquisar', 'pesquise'
      ];

      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🚨 CHAMANDO AGENTE PESQUISADOR...");
        try {
          const pesquisador = require('../../agentes/pesquisador');
          const termoLimpo = pergunta.replace('/pesquisar', '').trim();
          const respostaWeb = await pesquisador.executar(termoLimpo || pergunta);
          
          if (respostaWeb) {
            await ctx.reply(respostaWeb, { parse_mode: 'Markdown' });
            return;
          }
        } catch (e) {
          console.error("Erro no pesquisador:", e);
        }
      }

      // PROCESSAMENTO PADRÃO DE TEXTO (Kernel/IA)
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
