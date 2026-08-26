const { enviarEmBlocos } = require("../../core/envioBlocos");
const { Bot, session } = require("grammy");

const config = require("../../config/config");
const auth = require("../../core/auth");
const detectorWeb = require("../../core/detectorWeb");
const pesquisador = require("../../agentes/pesquisador");
const kernel = require("../../kernel/kernel");
const { responderIdentidade } = require("../../core/respostasIdentidade");

const {
    registrarComandosAdmin
} = require("./comandosAdmin");

const {
    registrarComandosMemoria
} = require("./comandosMemoria");

const {
    registrarComandosPlugins
} = require("./comandosPlugins");

const {
    registrarAdmin
} = require("./admin");

console.log("✅ telegram.js integrado ao Kernel e Web!");

function criarBot() {

    const bot = new Bot(config.telegram.token);

    bot.use(
        session({
            initial: () => ({})
        })
    );

    // ==========================================
    // COMANDOS DO SISTEMA
    // ==========================================

    registrarComandosAdmin(bot);
    registrarComandosMemoria(bot);
    registrarComandosPlugins(bot);
    registrarAdmin(bot);

    console.log("✅ Comandos administrativos registrados.");
    console.log("✅ Comandos de memória registrados.");
    console.log("✅ Comandos de plugins registrados.");
    console.log("✅ Painel Admin registrado.");

    bot.on(":text", async (ctx) => {

        const pergunta = String(ctx.message.text || "").trim();
        const usuarioId = ctx.from.id;

        console.log("");
        console.log("========================================");
        console.log("📩 MENSAGEM RECEBIDA NO TELEGRAM");
        console.log("Usuário:", usuarioId);
        console.log("Mensagem:", pergunta);
        console.log("========================================");

        if (!pergunta) {
            return;
        }

        // 🔐 AUTENTICAÇÃO
        if (!auth.isAutenticado(usuarioId)) {
            await ctx.reply(
                "🔒 Você precisa fazer login primeiro."
            );
            return;
        }

        // Respostas críticas de identidade não dependem do modelo de IA
        const respostaIdentidade = responderIdentidade(pergunta, usuarioId);
        if (respostaIdentidade) {
            await ctx.reply(respostaIdentidade);
            return;
        }

        try {

            /*
            ==================================================
            1. DETECTOR DE NECESSIDADE DE INTERNET
            ==================================================
            */

            const usarWeb = detectorWeb.precisaWeb(pergunta);

            console.log(
                usarWeb
                    ? "🌐 Detector: INTERNET necessária."
                    : "🧠 Detector: processamento normal."
            );

            /*
            ==================================================
            2. PESQUISA NA WEB
            ==================================================
            */

            let dadosWeb = "";

            if (usarWeb) {

                console.log("");
                console.log("🌐 ===== BUSCA WEB =====");

                const resultadoWeb =
                    await pesquisador.executar(pergunta);

                if (resultadoWeb) {

                    dadosWeb = resultadoWeb;

                    console.log("✅ Dados da Web obtidos.");

                } else {

                    console.log(
                        "⚠️ Pesquisa Web não retornou dados."
                    );

                }

                console.log("========================");
            }

            /*
            ==================================================
            3. MONTA CONTEXTO PARA O KERNEL
            ==================================================
            */

            let textoParaKernel = pergunta;

            if (dadosWeb) {

                textoParaKernel = `
PERGUNTA DO USUÁRIO:
${pergunta}

DADOS ATUALIZADOS OBTIDOS NA INTERNET:
${dadosWeb}

INSTRUÇÕES:
- Responda à pergunta original do usuário.
- Utilize os dados atualizados acima.
- Não diga que não possui acesso à Internet.
- Não invente informações que não estejam nos dados fornecidos.
- Quando houver fontes, preserve as fontes relevantes.
`;

            }

            /*
            ==================================================
            4. ENVIA PARA O KERNEL
            ==================================================
            */

            console.log("");
            console.log("🧠 Enviando para o Kernel...");

            const resposta = await kernel.executar({
                texto: textoParaKernel,
                textoOriginal: pergunta,
                usuario: {
                    id: String(usuarioId)
                },
                usuarioId: String(usuarioId),
                origem: "telegram",
                web: usarWeb,
                dadosWeb: dadosWeb
            });

            /*
            ==================================================
            5. VALIDA RESPOSTA
            ==================================================
            */

            if (!resposta) {

                console.log("⚠️ Kernel não retornou resposta.");

                await ctx.reply(
                    "Não consegui gerar uma resposta agora."
                );

                return;
            }

            let textoResposta;

            if (typeof resposta === "string") {

                textoResposta = resposta;

            } else if (resposta.resposta) {

                textoResposta = resposta.resposta;

            } else {

                textoResposta = JSON.stringify(
                    resposta,
                    null,
                    2
                );

            }

            /*
            ==================================================
            6. ENVIA AO TELEGRAM
            ==================================================
            */

            console.log("📤 Enviando resposta ao Telegram...");

            await enviarEmBlocos(ctx, textoResposta);

            console.log("✅ Resposta enviada.");

        } catch (erro) {

            console.error("");
            console.error("❌ ERRO NO TELEGRAM:");
            console.error(erro);

            await ctx.reply(
                "Ocorreu um erro ao processar sua mensagem."
            );

        }

    });

    return bot;
}

module.exports = {
    criarBot
};
