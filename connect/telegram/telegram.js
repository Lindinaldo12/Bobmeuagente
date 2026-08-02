const { Bot } = require("grammy");

const config = require("../../config/config");
const ia = require("../../ia/gerenciador");
const memoria = require("../../memoria_v2");
const orquestrador = require("../../orquestrador/orquestrador");
const status = require("../../dashboard/status");
const { criarContexto } = require("../../core/contexto");

const auth = require("../../core/auth");
const authSession = require("../../core/authSession");
const admin = require("./admin");

// LOG DE CARREGAMENTO
console.log("🔥 telegram.js carregado com sucesso");

function criarBot() {
    const bot = new Bot(config.telegram.token);

    // MIDDLEWARE: Habilita o log bruto de atualizações recebidas
    bot.use(async (ctx, next) => {
        console.log("===== UPDATE RECEBIDO =====");
        console.dir(ctx.update, { depth: null });
        await next();
    });

    admin.registrarAdmin(bot);

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

    // COMANDO STATUS (DINÂMICO!)
    bot.command("status", async (ctx) => {
        await ctx.reply(
            status.gerarStatus()
        );
    });

    // COMANDO AJUDA
    bot.command("ajuda", async (ctx) => {
        await ctx.reply(
            `🤖 Bob AI X

Posso ajudar com:

 Desenvolvimento de software

📦 Criar projetos

🧪 Gerar testes

 Gerar documentação

📝 Gerenciar notas

 Memorizar informações

🕒 Data e hora

⚙️ Status do sistema

Basta escrever o que deseja fazer.`
        );
    });

    // ALTERADO: de "message" para ":text"
    bot.on(":text", async (ctx) => {
        // --- LOG DE EVENTO DO TELEGRAM ---
        console.log("==========================================");
        console.log("📩 EVENTO DO TELEGRAM DISPARADO");
        console.log("Mensagem:", ctx.message.text);
        console.log("==========================================");

        try {
            // CORRIGIDO: carregarUsuario com 'r'
            let usuario = memoria.carregarUsuario(
                ctx.from.id,
                ctx.from.first_name
            );

            const pergunta = ctx.message.text;

            usuario = memoria.aprenderAutomaticamente(
                usuario,
                pergunta
            );

            memoria.salvarUsuario(usuario);

            const historico = memoria.obterHistorico(usuario);

            // CRIAR CONTEXTO COMPLETO
            const contexto = criarContexto({
                texto: pergunta,
                usuario,
                historico,
                memoria,
                ia,
                telegram: ctx
            });

            // ORQUESTRADOR: decide se resolve ou manda pra IA
            console.log(">>> Orquestrador decidindo...");
            const resultado = orquestrador.processar(contexto);

            let resposta;

            if (resultado.status === "agente") {
                console.log("✅ Orquestrador resolveu sozinho");
                resposta = resultado.resposta;
            } else {
                console.log(" Mandando pra IA...");
                resposta = await ia.perguntar(
                    pergunta,
                    historico,
                    usuario
                );
            }

            console.log("✅ IA respondeu");

            // Salva a conversa no histórico
            usuario = memoria.adicionarHistorico(
                usuario,
                pergunta,
                resposta
            );

            memoria.salvarUsuario(usuario);

            // Envia a resposta ao usuário
            await ctx.reply(resposta);
            console.log("✅ Resposta enviada ao Telegram");
        } catch (erro) {
            console.error("Erro no processamento:", erro);
            await ctx.reply("Ocorreu um erro ao processar sua mensagem.");
        }
    });

    return bot;
}

module.exports = { criarBot };
