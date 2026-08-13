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
const { processarArquivo } = require("../../ia/leitorArquivos");

console.log("✅ telegram.js carregado com sucesso");

function criarBot() {
  const bot = new Bot(config.telegram.token);

  bot.use(session({ initial: () => ({}) }));

  bot.use(async (ctx, next) => {
    console.log("===== UPDATE RECEBIDO =====");
    console.dir(ctx.update, { depth: null });
    await next();
  });

  admin.registrarAdmin(bot);
  comandosMemoria.registrarComandosMemoria(bot);
  comandosAdmin.registrarComandosAdmin(bot);
  comandosPlugins.registrarComandosPlugins(bot);

  bot.command("start", async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length > 0 && args[0].startsWith('convite_')) {
      const token = args[0].replace('convite_', '');
      if (auth.isAutenticado(ctx.from.id)) {
        return ctx.reply('✅ Você já tem uma conta ativa!');
      }
      const resultado = auth.usarConvite(token, ctx.from.id);
      if (resultado.sucesso) {
        await ctx.reply(`🎉 BEM-VINDO(A) AO BOB AI X!\nSua conta foi ativada com sucesso.`);
      } else {
        await ctx.reply(resultado.mensagem);
      }
      return;
    }

    let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
    memoria.salvarUsuario(usuario);

    if (auth.isMaster(ctx.from.id)) {
      await ctx.reply(`👑 Olá MASTER!\nBob AI X está online.`);
    } else if (auth.isAutenticado(ctx.from.id)) {
      await ctx.reply(`✅ Olá, ${usuario.nome}!\nComo posso ajudar?`);
    } else {
      await ctx.reply(`🔒 Olá!\nPeça ao administrador um convite.`);
    }
  });

  bot.command("status", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) return ctx.reply("🔒 Acesso negado.");
    await ctx.reply(status.gerarStatus());
  });

  bot.on(":document", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) return ctx.reply("🔒 Acesso negado.");
    console.log("📎 Documento detectado:", ctx.message.document.file_name);
    ctx.session.lastDocument = {
      fileId: ctx.message.document.file_id,
      fileName: ctx.message.document.file_name,
      mimeType: ctx.message.document.mime_type
    };
    await ctx.reply("📄 Arquivo recebido! O que deseja fazer com ele?");
  });

  bot.on(":photo", async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) return ctx.reply("🔒 Acesso negado.");
    console.log("📷 Foto detectada");
    ctx.session.lastDocument = {
      fileId: ctx.message.photo[ctx.message.photo.length - 1].file_id,
      fileName: 'imagem.jpg',
      mimeType: 'image/jpeg'
    };
    await ctx.reply("📷 Imagem recebida! O que deseja fazer com ela?");
  });

  bot.on(":text", async (ctx) => {
    console.log("========================================");
    console.log(" EVENTO DO TELEGRAM DISPARADO");
    console.log("Mensagem:", ctx.message.text);
    console.log("========================================");

    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🔒 Você precisa fazer login primeiro.');
    }

    try {
      let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
      const pergunta = ctx.message.text;

      // GATILHO DE APRENDIZADO EVOLUTIVO
      const textoLower = ctx.message.text.toLowerCase();
      const gatilhosAprendizado = ['anote', 'não esqueça', 'lembre-se', 'grave isso', 'salve isso'];

      if (gatilhosAprendizado.some(g => textoLower.includes(g))) {
        console.log("📝 Gatilho de aprendizado detectado!");
        try {
          const userId = ctx.from.id.toString();
          const memoriaPath = require('path').join(__dirname, '../../memoria_usuarios', `${userId}.json`);
          let memoriaUser = { historico: [], memoriaLongoPrazo: [] };
          if (require('fs').existsSync(memoriaPath)) {
            memoriaUser = JSON.parse(require('fs').readFileSync(memoriaPath, 'utf-8'));
          }
          if (!Array.isArray(memoriaUser.memoriaLongoPrazo)) memoriaUser.memoriaLongoPrazo = [];

          memoriaUser.memoriaLongoPrazo.push({
            fato: ctx.message.text,
            aprendido_em: new Date().toISOString(),
            fonte: 'ensino_direto_do_mestre'
          });

          require('fs').writeFileSync(memoriaPath, JSON.stringify(memoriaUser, null, 2));
          await ctx.reply("✅ *Aprendi e gravei no meu diário!*", { parse_mode: 'Markdown' });
          return;
        } catch (e) {
          console.error("Erro ao salvar memória:", e);
          await ctx.reply("⚠️ Tive um problema técnico ao gravar a memória.");
          return;
        }
      }

      // 🧠 MEMÓRIA EVOLUTIVA (Comando /lembrar)
      if (pergunta.toLowerCase().startsWith('/lembrar')) {
        const novoFato = pergunta.toLowerCase().replace('/lembrar', '').trim();
        if (novoFato) {
          try {
            const fsMem = require('fs');
            const pathMem = require('path');
            const userId = ctx.from.id;
            const memoriaPath = pathMem.join(__dirname, '../../memoria_usuarios', `${userId}.json`);
            let mem = { historico: [], memoriaLongoPrazo: [] };
            if (fsMem.existsSync(memoriaPath)) {
              mem = JSON.parse(fsMem.readFileSync(memoriaPath, 'utf-8'));
            }
            if (!Array.isArray(mem.memoriaLongoPrazo)) mem.memoriaLongoPrazo = [];
            mem.memoriaLongoPrazo.push({ fato: novoFato, data: new Date().toISOString() });
            fsMem.writeFileSync(memoriaPath, JSON.stringify(mem, null, 2));
            await ctx.reply("✅ *Fato salvo no meu diário!*", { parse_mode: 'Markdown' });
          } catch (e) {
            console.error("Erro ao salvar memória:", e);
            await ctx.reply("❌ Erro ao salvar memória.");
          }
          return;
        }
      }

      // 🚨 INTERCEPTAÇÃO DE PESQUISA (Cotação / Busca Web)
      const msgTexto = ctx.message.text.toLowerCase();
      const termosPesquisa = ['dolar', 'dólar', 'euro', 'cotacao', 'cotação', 'pesquisar', 'busca', 'quem é', 'o que é'];
      
      if (termosPesquisa.some(t => msgTexto.includes(t))) {
        console.log("🚨 PESQUISADOR ATIVADO!");
        try {
          const pesquisador = require('../../agentes/pesquisador');
          const resposta = await pesquisador.executar(ctx.message.text);
          if (resposta) {
            await ctx.reply(resposta, { parse_mode: 'Markdown' });
            return;
          }
        } catch (e) {
          console.error("❌ Erro na interceptação do pesquisador:", e);
        }
      }

      // VERIFICAR PLUGINS
      const preferencias = auth.obterPreferencias(ctx.from.id);
      const pluginDetectado = pluginManager.detectarPlugin(pergunta);
      if (pluginDetectado) {
        const contextoPlugin = { usuario, preferencias, historico: memoria.obterHistorico(usuario) };
        const resultado = await pluginManager.executarPlugin(pluginDetectado, pergunta, contextoPlugin);
        if (resultado.sucesso) {
          const resposta = resultado.resultado;
          usuario = memoria.adicionarHistorico(usuario, pergunta, resposta);
          memoria.salvarUsuario(usuario);
          return await ctx.reply(resposta);
        }
      }

      // PROCESSAMENTO DE PDF / DOCUMENTO
      if (ctx.session && ctx.session.lastDocument) {
        const doc = ctx.session.lastDocument;
        if (doc.mimeType === 'application/pdf' || doc.mimeType.startsWith('image/')) {
          await ctx.reply("⏳ Processando seu documento...");
          try {
            const resultado = await processarArquivo(bot, doc.fileId, doc.mimeType);
            if (!resultado.sucesso) return ctx.reply("❌ Erro ao ler documento.");
            const contexto = criarContexto({ texto: `${pergunta}\n\n[CONTEÚDO DO ARQUIVO]:\n${resultado.texto}` });
            const resultadoIA = await kernel.executar(contexto);
            const resposta = typeof resultadoIA === "string" ? resultadoIA : resultadoIA.texto;
            ctx.session.lastDocument = null;
            await ctx.reply(resposta);
            return;
          } catch (error) {
            console.error("Erro ao processar PDF:", error);
            return ctx.reply("❌ Erro ao ler este documento.");
          }
        }
      }

      // PROCESSAMENTO NORMAL DE TEXTO
      usuario = memoria.aprenderAutomaticamente(usuario, pergunta);
      memoria.salvarUsuario(usuario);

      const contexto = criarContexto({ texto: pergunta });
      const resultado = await kernel.executar(contexto);
      const resposta = typeof resultado === "string" ? resultado : resultado.texto;

      usuario = memoria.adicionarHistorico(usuario, pergunta, resposta);
      memoria.salvarUsuario(usuario);

      const LIMITE = 3800;
      if (resposta && resposta.length <= LIMITE) {
        await ctx.reply(resposta);
      } else if (resposta) {
        for (let i = 0; i < resposta.length; i += LIMITE) {
          await ctx.reply(resposta.substring(i, i + LIMITE));
        }
      }

    } catch (erro) {
      console.error("Erro no processamento:", erro);
      await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
    }
  });

  return bot;
}

module.exports = { criarBot };
