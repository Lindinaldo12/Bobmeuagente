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
`🤖 Olá, ${usuario.nome}!

Bem-vindo ao ${config.app.nome} AI v${config.app.versao}.

🧠 IA ativa: ${ia.obterIAAtual()}

Seu cadastro foi carregado com sucesso.

Envie qualquer pergunta para começar.`
        );

    });

    bot.on("message:text", async (ctx) => {

        try {

            const usuario = memoria.carregarUsuario(
                ctx.from.id,
                ctx.from.first_name
            );

            // Bloqueado
            if (auth.isBlocked(usuario)) {
                await ctx.reply("🚫 Seu acesso ao Bob AI foi bloqueado.");
                return;
            }

            // Master Admin sempre autorizado
            if (auth.isMaster(ctx.from.id)) {
                usuario.autorizado = true;
                memoria.salvarUsuario(usuario);
            }

            const pergunta = ctx.message.text;

            // Se o sistema estiver aguardando a senha do usuário
            if (authSession.aguardandoSenha(ctx.from.id)) {

                if (auth.checkPassword(pergunta)) {

                    auth.authorizeUser(usuario);
                    authSession.finalizar(ctx.from.id);

                    await ctx.reply(
                        "✅ Senha correta!\n\nAcesso liberado. Bem-vindo ao Bob AI."
                    );

                } else {

                    await ctx.reply(
                        "❌ Senha incorreta.\n\nTente novamente."
                    );

                }

                return;
            }

            // Usuário ainda não autorizado
            if (!auth.isAuthorized(usuario)) {

                authSession.iniciar(ctx.from.id);

                await ctx.reply(
                    "🔐 Acesso protegido.\n\nDigite a senha para continuar."
                );

                return;
            }

            await ctx.reply("🧠 Pensando...");

            const resposta = await ia.perguntar(pergunta);

            memoria.adicionarHistorico(
                usuario.id,
                pergunta,
                resposta
            );

            await ctx.reply(resposta);

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

