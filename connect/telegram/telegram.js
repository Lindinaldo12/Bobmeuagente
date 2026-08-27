const { enviarEmBlocos } = require("../../core/envioBlocos");
const { Bot, session } = require("grammy");

const config = require("../../config/config");
const auth = require("../../core/auth");
const detectorWeb = require("../../core/detectorWeb");
const pesquisador = require("../../agentes/pesquisador");
const dadosAtuais = require("../../ferramentas/web/dadosAtuais");
const fatos = require("../../core/fatosAprendidos");
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

        // 🧠 MEMÓRIA EVOLUTIVA — comandos de ensino
        const novoFato = fatos.extrairComandoAprender(pergunta);
        if (novoFato) {
            const r = fatos.aprender(novoFato, usuarioId);
            if (r.repetido) {
                await ctx.reply("🧠 Eu já sabia disso, Lindinaldo. Continuo lembrando!");
            } else {
                await ctx.reply("🧠 Aprendi e nunca vou esquecer: " + novoFato + "\n(Total de fatos memorizados: " + r.total + ")");
            }
            return;
        }

        const fatoEsquecer = fatos.extrairComandoEsquecer(pergunta);
        if (fatoEsquecer) {
            const removidos = fatos.esquecer(fatoEsquecer);
            if (removidos > 0) {
                await ctx.reply("🗑️ Esqueci " + removidos + " fato(s) sobre: " + fatoEsquecer);
            } else {
                await ctx.reply("Não encontrei nada memorizado sobre isso.");
            }
            return;
        }

        if (/^(?:bob[,!\s]*)?(?:o que voce (?:sabe|lembra|memorizou)|liste (?:seus |os )?fatos)/i.test(pergunta)) {
            const lista = fatos.listar();
            if (lista.length === 0) {
                await ctx.reply("Ainda não memorizei nenhum fato. Me ensine com: 'Bob, lembre que ...'");
            } else {
                const linhas = lista.map((f, i) => (i + 1) + ". " + f.fato);
                await ctx.reply("🧠 Fatos que memorizei:\n\n" + linhas.join("\n"));
            }
            return;
        }

        try {

            /*
            ==================================================
            1. DETECTOR DE NECESSIDADE DE INTERNET
            ==================================================
            */

            
            // Ferramentas de dados atuais (clima/cambio) ANTES do detector,
            // para entender continuacoes tipo "E em Sao Paulo"
            const dadosAtuaisResultado = await dadosAtuais.executar(pergunta, usuarioId);
            if (dadosAtuaisResultado) {
                console.log("✅ Dados atuais obtidos por ferramenta dedicada.");
                await ctx.reply(dadosAtuaisResultado);
                return;
            }

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

                const resultadoDadosAtuais =
                    await dadosAtuais.executar(pergunta, usuarioId);

                if (resultadoDadosAtuais) {
                    console.log("✅ Dados atuais obtidos por ferramenta dedicada.");
                    await ctx.reply(resultadoDadosAtuais);
                    return;
                }

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

            // 🧠 Injeta fatos aprendidos relevantes no contexto
            const fatosRel = fatos.buscarRelevantes(pergunta);
            if (fatosRel.length > 0) {
                textoParaKernel = "FATOS QUE VOCE APRENDEU E DEVE LEMBRAR (use naturalmente na resposta):\n" +
                    fatosRel.map(f => "- " + f.fato).join("\n") +
                    "\n\nPERGUNTA DO USUARIO:\n" + pergunta;
                console.log("🧠 Fatos relevantes injetados:", fatosRel.length);
            }

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
