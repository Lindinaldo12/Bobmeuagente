const { Bot } = require("grammy");

const config = require("../../config/config");
const ia = require("../../ia/gerenciador");
const memoria = require("../../memoria/memoria");
const auth = require("../../core/auth");
const authSession = require("../../core/authSession");
// Nova dependência adicionada
const admin = require("./admin");

function criarBot() {

    const bot = new Bot(config.telegram.token);

    // Registra os comandos de administração
    admin.registrarAdmin(bot);

    bot.command("start", async (ctx) => {

        const usuario = memoria.carregarUsuario(
            ctx.from.id,
            ctx.from.first_name
        );

        await ctx.reply(
            `🤖 Olá, **${usuario.nome}**!\n\nBem-vindo ao ${config.app.nome} AI v${config.app.versao}.\n\n🧠 IA ativa: ${ia.obterIAAtual()}\n\nSeu cadastro foi carregado com sucesso.\n\nEnvie qualquer pergunta para começar.`,
            { parse_mode: "Markdown" }
        );

    });

    bot.on("message:text", async (ctx) => {

        try {

            const usuario = memoria.carregarUsuario(
                ctx.from.id,
                ctx.from.first_name
            );

            // 1. Verificação de Bloqueio
            if (auth.isBlocked(usuario)) {
                await ctx.reply("🚫 Seu acesso ao Bob AI foi bloqueado.");
                return;
            }

            // 2. Master Admin sempre autorizado
            if (auth.isMaster(ctx.from.id)) {
                usuario.autorizado = true;
                memoria.salvarUsuario(usuario);
            }

            const pergunta = ctx.message.text;

            // 3. Verificação de Senha (se o sistema estiver aguardando)
            if (authSession.aguardandoSenha(ctx.from.id)) {

                if (auth.checkPassword(pergunta)) {

                    auth.authorizeUser(usuario);
                    authSession.finalizar(ctx.from.id);

                    await ctx.reply(
                        "✅ Senha correta!\n\nAcesso liberado."
                    );

                } else {

                    await ctx.reply(
                        "❌ Senha incorreta.\n\nTente novamente."
                    );

                }

                return; // Encerra aqui para não tratar a senha como pergunta
            }

            // 4. Verificação de Autorização Geral
            if (!auth.isAuthorized(usuario)) {

                authSession.iniciar(ctx.from.id);

                await ctx.reply(
                    "🔐 Acesso protegido.\n\nDigite a senha para continuar:"
                );

                return;
            }

            // 5. Fluxo Normal (IA e Histórico)
            await ctx.reply("🧠 Pensando...");

            // --- Recarrega os dados do usuário atualizados ---
            memoria.carregarUsuario(
                usuario.id,
                usuario.first_name || usuario.nome || ""
            );

            // Obtém o histórico de conversas do usuário
            const historico = memoria.obterHistorico(usuario.id);

            // Envia a pergunta junto com o histórico para a IA
            const resposta = await ia.perguntar(pergunta, historico);

            console.log("✅ IA respondeu:");
            console.log(resposta);

            memoria.adicionarHistorico(
                usuario.id,
                pergunta,
                resposta
            );

            console.log("📨 Enviando resposta para o Telegram...");

            await ctx.reply(resposta);

            console.log("✅ Resposta enviada ao Telegram.");

        } catch (erro) {

            console.error(erro);

            await ctx.reply(
                "❌ Ocorreu um erro ao processar sua mensagem."
            );

        }

    });

    return bot;
}

module.exports = {
    criarBot
};

