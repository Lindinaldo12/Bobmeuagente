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
                return ctx.reply('✅ Você já tem uma conta!');
            }
            
            const resultado = auth.usarConvite(token, ctx.from.id, ctx.from.first_name);
            
            if (resultado.sucesso) {
                await ctx.reply(`🎉 BEM-VINDO(A) AO BOB AI X!\n\n✅ Sua conta foi criada!\n\n📋 Dados:\nNome: ${ctx.from.first_name}\nSenha: ${resultado.senha}\n\n⚠️ Guarde esta senha!\n\n🏪 Visite a loja: /loja\n📲 Instale plugins: /instalar questoes_concurso`);
            } else {
                await ctx.reply(resultado.mensagem);
            }
            return;
        }
        
        let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
        memoria.salvarUsuario(usuario);
        
        if (auth.isMaster(ctx.from.id)) {
            await ctx.reply(`👑 Olá MASTER!\n\nBob AI X está pronto!\n\nUse /convite para gerar links.`);
        } else if (auth.isAutenticado(ctx.from.id)) {
            await ctx.reply(`✅ Olá, ${usuario.nome}!\n\nUse /loja para ver os plugins disponíveis.`);
        } else {
            await ctx.reply(`🔐 Olá!\n\nPeça ao administrador um link de convite.`);
        }
    });

    bot.command("status", async (ctx) => {
        if (!auth.isAutenticado(ctx.from.id)) return ctx.reply('🚫 Faça login primeiro: /entrar sua_senha');
        await ctx.reply(status.gerarStatus());
    });

    bot.on(":document", async (ctx) => {
        if (!auth.isAutenticado(ctx.from.id)) return ctx.reply('🚫 Faça login primeiro: /entrar sua_senha');
        console.log("📎 Documento detectado:", ctx.message.document.file_name);
        ctx.session.lastDocument = {
            fileId: ctx.message.document.file_id,
            fileName: ctx.message.document.file_name,
            mimeType: ctx.message.document.mime_type
        };
        await ctx.reply("📄 Arquivo recebido! O que deseja fazer com ele?");
    });

    bot.on(":photo", async (ctx) => {
        if (!auth.isAutenticado(ctx.from.id)) return ctx.reply('🚫 Faça login primeiro: /entrar sua_senha');
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
            return ctx.reply('🚫 Você precisa fazer login primeiro.\n\nUse: /entrar sua_senha');
        }

        try {
            let usuario = memoria.carregarUsuario(ctx.from.id, ctx.from.first_name);
            const pergunta = ctx.message.text;
            const preferencias = auth.obterPreferencias(ctx.from.id);
            
            // ⭐ VERIFICAR PLUGINS (SEM MENSAGEM DE CARREGAMENTO)
            const pluginsInstalados = pluginManager.obterPluginsUsuario(ctx.from.id);
            const pluginDetectado = pluginManager.detectarPlugin(pergunta, pluginsInstalados);
            
            if (pluginDetectado) {
                console.log(`🧩 Plugin detectado: ${pluginDetectado}`);
                
                const contextoPlugin = {
                    usuario,
                    preferencias,
                    historico: memoria.obterHistorico(usuario)
                };
                
                const resultado = await pluginManager.executarPlugin(ctx.from.id, pluginDetectado, pergunta, contextoPlugin);
                
                if (resultado.sucesso) {
                    const resposta = resultado.resultado;
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
                    return;
                } else {
                    await ctx.reply(resultado.mensagem);
                    return;
                }
            }

            // PROCESSAMENTO DE PDF
            if (ctx.session && ctx.session.lastDocument) {
                const doc = ctx.session.lastDocument;
                
                if (doc.mimeType === 'application/pdf' || (doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf'))) {
                    await ctx.reply("⏳ Processando seu PDF..."); // Aqui faz sentido, pois PDF demora
                    
                    try {
                        const resultado = await processarArquivo(ctx, bot, doc);
                        if (!resultado.sucesso) return ctx.reply(`❌ Erro: ${resultado.erro}`);

                        const promptComDocumento = `CONTEXTO: Arquivo "${doc.fileName}".\nCONTEÚDO:\n"""\n${resultado.conteudo}\n"""\nSOLICITAÇÃO: ${pergunta}\n\nResponda baseando-se EXCLUSIVAMENTE no conteúdo.`;
                        ctx.session.lastDocument = null;

                        const contexto = criarContexto({ texto: promptComDocumento, usuario, historico: memoria.obterHistorico(usuario), memoria, ia, telegram: ctx });
                        const resultadoIA = await kernel.executar(contexto);
                        const resposta = typeof resultadoIA === "string" ? resultadoIA : resultadoIA?.resposta;

                        usuario = memoria.adicionarHistorico(usuario, pergunta, resposta);
                        memoria.salvarUsuario(usuario);
                        await ctx.reply(resposta);
                        return;
                    } catch (error) {
                        console.error("Erro ao processar PDF:", error);
                        return ctx.reply("❌ Erro ao ler este PDF.");
                    }
                }
            }

            // PROCESSAMENTO NORMAL DE TEXTO
            usuario = memoria.aprenderAutomaticamente(usuario, pergunta);
            memoria.salvarUsuario(usuario);
            const historico = memoria.obterHistorico(usuario);

            const contexto = criarContexto({ texto: pergunta, usuario, historico, memoria, ia, telegram: ctx });
            const resultado = await kernel.executar(contexto);
            const resposta = typeof resultado === "string" ? resultado : resultado?.resposta;

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
