const { Bot, session } = require("grammy");
const config = require("../../config/config");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const { criarContexto } = require("../../core/contexto");
const auth = require("../../core/auth");
const pesquisador = require("../../agentes/pesquisador");

console.log("✅ telegram.js atualizado com comando /pesquisar e bypass direto!");

function criarBot() {
  const bot = new Bot(config.telegram.token);
  bot.use(session({ initial: () => ({}) }));

  // COMANDO OFICIAL DE PESQUISA (Resolve o /pesquisar)
  bot.command("pesquisar", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) return ctx.reply('🔒 Faça login primeiro.');
    
    const termo = ctx.match;
    if (!termo) return ctx.reply('⚠️ Use: `/pesquisar <sua busca>`', { parse_mode: 'Markdown' });

    await ctx.reply('🔎 Pesquisando na web em tempo real...');
    const resposta = await pesquisador.executar(termo);
    await ctx.reply(resposta, { parse_mode: 'Markdown' });
  });

  // MENSAGENS COMUNS DE TEXTO
  bot.on(":text", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
      let pergunta = ctx.message.text;
      const textoLower = pergunta.toLowerCase();

      // Interceptação automática por palavras-chave sem precisar usar o comando /
      const termosTempoReal = [
        'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 
        'temperatura', 'clima', 'tempo em', 'hoje', 
        'quem ganhou', 'resultado do jogo', 'ultimo jogo'
      ];

      if (termosTempoReal.some(t => textoLower.includes(t))) {
        console.log("🌐 DADOS EM TEMPO REAL DETECTADOS NA MENSAGEM!");
        const respostaDireta = await pesquisador.executar(pergunta);
        if (respostaDireta) {
          await ctx.reply(respostaDireta, { parse_mode: 'Markdown' });
          return; // Para aqui e NÃO passa para o Ollama/Kernel!
        }
      }

      // PROCESSAMENTO NORMAL VIA OLLAMA/KERNEL (Para bate-papo comum)
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
