const { Bot } = require("grammy");

const config = require("../../config/config");
const ia = require("../../ia/gerenciador");
const memoria = require("../../memoria/memoria");

function criarBot() {

    const bot = new Bot(config.telegram.token);

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

            const pergunta = ctx.message.text;

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
