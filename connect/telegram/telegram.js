const { Bot } = require("grammy");

const config = require("../../config/config");
const ia = require("../../ia/gerenciador");
const memoria = require("../../memoria_v2");
const kernel = require("../../kernel/kernel");
const status = require("../../dashboard/status");
const { criarContexto } = require("../../core/contexto");

const auth = require("../../core/auth");
const authSession = require("../../core/authSession");
const admin = require("./admin");
const comandosMemoria = require("./comandosMemoria");

// LOG DE CARREGAMENTO
console.log(" telegram.js carregado com sucesso");

function criarBot() {
    const bot = new Bot(config.telegram.token);

    // MIDDLEWARE: Habilita o log bruto de atualizações recebidas
    bot.use(async (ctx, next) => {
        console.log("===== UPDATE RECEBIDO =====");
        console.dir(ctx.update, { depth: null });
        await next();
    });

    admin.registrarAdmin(bot);
    comandosMemoria.registrarComandosMemoria(bot);

    // COMANDO START
    bot.command("start", async (ctx) => {
        let usuario = memoria.carregarUsuario(
            ctx.from.id,
            ctx.from.first_name
        );

        memoria.salvarUsuario(usuario);

        await ctx.reply(
            `Olá, ${usuario.nome}!\n\nBob AI está pronto para ajudar!`
        );
    });

    // COMANDO STATUS
    bot.command("status", async (ctx) => {
        await ctx.reply(status.gerarStatus());
    });

    // COMANDO AJUDA
    bot.command("ajuda", async (ctx) => {
        await ctx.reply(`
🤖 Bob AI X

Posso ajudar com:
Desenvolvimento de software
 Criar projetos
🔧 Gerar testes
 Gerar documentação
 Gerenciar notas
💾 Memorizar informações
 Data e hora
⚙️ Status do sistema

Basta escrever o que deseja fazer.
        `);
    });

    // RECEBER MENSAGENS DE TEXTO
    bot.on(":text", async (ctx) => {
        console.log("========================================");
        console.log(" EVENTO DO TELEGRAM DISPARADO");
        console.log("Mensagem:", ctx.message.text);
        console.log("========================================");

        try {
            // 1. Carrega o usuário
            let usuario = memoria.carregarUsuario(
                ctx.from.id,
                ctx.from.first_name
            );

            const pergunta = ctx.message.text;

            // 2. Aprende com a pergunta e salva
            usuario = memoria.aprenderAutomaticamente(usuario, pergunta);
            memoria.salvarUsuario(usuario);

            // 3. Pega o histórico
            const historico = memoria.obterHistorico(usuario);

            // 4. Cria o contexto completo para o Kernel
            const contexto = criarContexto({
                texto: pergunta,
                usuario,
                historico,
                memoria,
                ia,
                telegram: ctx
            });

            // 5. CHAMADA DO KERNEL (VERSÃO TEMPORÁRIA DE DEBUG)
            // PORTÃO DE SEGURANÇA
            if (!auth.isMaster(ctx.from.id) && !auth.isAdmin(ctx.from.id) && !auth.isAuthorized(memoria.carregarUsuario(ctx.from.id))) {
                await ctx.reply(" Acesso negado. Você não tem permissão para usar o Bob AI X.");
                return;
            }
            const resultado = await kernel.executar(contexto);

            console.log("TIPO RESULTADO:", typeof resultado);
            console.dir(resultado, { depth: null });

            const resposta =
                typeof resultado === "string"
                    ? resultado
                    : resultado?.resposta;

            console.log("✅ Resposta gerada pelo Kernel");

            // 6. Salva a conversa no histórico (memoria_v2)
            usuario = memoria.adicionarHistorico(usuario, pergunta, resposta);
            memoria.salvarUsuario(usuario);

            // 7. ✅ ENVIA A RESPOSTA (COM LOG APLICADO PELO TUTORIAL)
            try {
                console.log("===== ENVIANDO PARA O TELEGRAM =====");
                console.log("Resposta:", resposta);

                const LIMITE = 3800;

                if (resposta && resposta.length <= LIMITE) {
                    // ✅ MODIFICAÇÃO DO TUTORIAL APLICADA AQUI:
                    const enviada = await ctx.reply(resposta);
                    
                    console.log("===== TELEGRAM RESPONDEU =====");
                    console.dir(enviada, { depth: null });
                    
                } else if (resposta) {
                    for (let i = 0; i < resposta.length; i += LIMITE) {
                        const enviada = await ctx.reply(
                            resposta.substring(i, i + LIMITE)
                        );
                        console.dir(enviada, { depth: null });
                    }
                }

            } catch (erro) {
                console.log("===== ERRO AO ENVIAR =====");
                console.error(erro);
            }

            console.log("✅ Resposta enviada ao Telegram");

        } catch (erro) {
            console.error("Erro no processamento:", erro);
            await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
        }
    });

    return bot;
}

module.exports = { criarBot };
