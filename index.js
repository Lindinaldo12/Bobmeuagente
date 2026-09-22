const memoria = require("../memoria_v4/gerenciador");
const memoriaV4 = require("../memoria_v4/interface");
const auth = require("../core/auth");
const planner = require("../planner/planner");
const conhecimento = require("../conhecimento/gerenciador");
const orquestrador = require("../orquestrador/orquestrador");
const responseBuilder = require("../core/responseBuilder");
const memoriaContexto = require("../memoria/contexto");
const validadorResposta = require("../core/validadorResposta");
const detectorAlucinacao = require("../core/detectorAlucinacao");
const autoavaliador = require("../core/autoavaliador");

// ==========================================
// MOTOR DE DECISÃO + EXECUTOR
// ==========================================
const motorDecisao = require("../ia/motorDecisao");
const executorIA = require("../ia/executor");
const aprendizado = require("../ia/aprendizado");
const perfil = require("../ia/perfil");
const ia = require("../ia/gerenciador");

const PADROES_CONTINUACAO = /^(resuma|resumo|explique|continue|detalhe|compare|faça um resumo)/i;

async function executar(contexto) {

    const idUsuario = String(
        contexto.usuario?.id ||
        contexto.usuarioId ||
        "anonimo"
    );

    contexto.memoria = memoria.carregar(idUsuario);
    contexto.usuarioMemoria = contexto.memoria;

    let respostaFinal = "";

    try {

        // ==========================================
        // APRENDIZADO DIRETO — MOTOR → EXECUTOR → V4
        // ==========================================

        let resultadoAprendizado = null;

        const decisaoMemoria =
            motorDecisao.decidir(
                String(contexto.texto || "")
            );

        if (
            decisaoMemoria &&
            decisaoMemoria.tipo === "aprendizado"
        ) {

            console.log("");
            console.log("🧠 KERNEL → MOTOR: APRENDIZADO DETECTADO");

            resultadoAprendizado =
                await executorIA.executar(
                    decisaoMemoria,
                    {
                        ...contexto,
                        usuario: contexto.usuarioMemoria,
                        usuarioId: idUsuario,
                        aprendizado,
                        perfil,
                        ia
                    }
                );

            console.log("✅ APRENDIZADO → MEMÓRIA V4");

            contexto.resultadoAprendizado =
                resultadoAprendizado;
        }

        // ==========================================
        // IDENTIDADE OFICIAL DO USUÁRIO
        // ==========================================

        contexto.identidade =
            auth.obterIdentidadeUsuario(idUsuario);

        if (contexto.usuario && typeof contexto.usuario === "object") {
            contexto.usuario.identidade =
                contexto.identidade;
        }

        console.log("");
        console.log("===== IDENTIDADE DO KERNEL =====");
        console.log(
            JSON.stringify(
                contexto.identidade,
                null,
                2
            )
        );
        console.log("================================");

        const ultimoContexto =
            memoriaContexto.obter(
                contexto.usuario?.id ||
                contexto.usuarioId
            );

        const ultimaPergunta =
            ultimoContexto?.pergunta || "";

        // Pergunta ORIGINAL do usuário. A que vai persistir no histórico.
        const perguntaOriginal =
            contexto.textoOriginal ||
            contexto.texto ||
            "";

        // Pergunta enviada à IA. Pode ganhar contexto, sem tocar no histórico.
        let perguntaParaIA = contexto.texto;

        if (
            ultimaPergunta &&
            PADROES_CONTINUACAO.test(contexto.texto)
        ) {

            perguntaParaIA =
                `Pergunta anterior:
${ultimaPergunta}

Nova solicitação:
${contexto.texto}`;

            contexto.usuarioMemoria.ultimaMensagem =
                contexto.texto;

        } else {

            contexto.usuarioMemoria.ultimaMensagem =
                contexto.texto;
        }

        console.log("");
        console.log("========================================");
        console.log("🌐 DADOS WEB RECEBIDOS PELO KERNEL");

        if (contexto.dadosWeb) {

            console.log("✅ Dados Web disponíveis.");
            console.log("========================================");

        } else {

            console.log("ℹ️ Nenhum dado Web recebido.");
            console.log("========================================");
        }

        contexto.conhecimento =
            conhecimento.consultar(contexto.texto);

        console.log("");
        console.log("===== CONHECIMENTO DO KERNEL =====");

        console.dir(
            contexto.conhecimento,
            { depth: null }
        );

        console.log("==================================");

        console.log(">>> Entrando no ORQUESTRADOR");

        let resposta =
            await orquestrador.processar(contexto);

        console.log("<<< Saindo do ORQUESTRADOR");

        if (resposta.status === "ia") {

            if (contexto.dadosWeb) {

                perguntaParaIA =
                    `PERGUNTA ORIGINAL:
${contexto.texto}

DADOS ATUALIZADOS DA INTERNET:
${contexto.dadosWeb}

INSTRUÇÕES:
- Responda diretamente à pergunta original.
- Use os dados da Internet acima.
- Não diga que não possui acesso à Internet.
- Não invente dados.
- Se os dados tiverem fontes, utilize-as na resposta.`;
            }

            // Identidade como CONTEXTO de memória, não como ordem injetada.
            const identidadeContexto =
                contexto.identidade &&
                (contexto.identidade.tipo === "criador" ||
                 contexto.identidade.nome)
                    ? `[Contexto do usuário: ${contexto.identidade.nome || contexto.identidade.tipo}]\n\n`
                    : "";

            resposta.resposta =
                await contexto.ia.perguntar(
                    identidadeContexto + perguntaParaIA,
                    contexto.historico,
                    contexto.usuario
                );
        }

        respostaFinal =
            responseBuilder.construir(
                resposta,
                contexto
            );

        // ==========================================
        // VALIDAÇÃO FINAL
        // ==========================================
        const conhecimentoParaValidacao =
            contexto.dadosWeb
                ? ""
                : (contexto.conhecimento?.conhecimento || "");

        respostaFinal =
            validadorResposta.validar(
                respostaFinal,
                conhecimentoParaValidacao
            );

        const verificacao =
            detectorAlucinacao.verificar(
                respostaFinal,
                conhecimentoParaValidacao
            );

        respostaFinal =
            verificacao.resposta;

        const avaliacao =
            autoavaliador.avaliar(
                respostaFinal
            );

        if (!avaliacao.aprovada) {

            console.log("===== AUTOAVALIADOR =====");
            console.log(avaliacao.problemas);
            console.log("=========================");
        }

    } catch (erro) {

        console.error("❌ ERRO NO KERNEL:", erro);

        respostaFinal =
            "Desculpe, ocorreu um erro ao processar sua solicitação. " +
            "Tente novamente em instantes.";

    } finally {

        // ==========================================
        // PERSISTÊNCIA GARANTIDA — roda sempre
        // ==========================================

        try {

            memoriaContexto.salvar(
                contexto.usuario?.id ||
                contexto.usuarioId,
                {
                    pergunta: perguntaOriginal,
                    resposta: respostaFinal
                }
            );

            memoriaV4.adicionarHistorico(
                contexto.usuarioMemoria,
                perguntaOriginal,
                respostaFinal
            );

            memoriaV4.salvarUsuario(
                contexto.usuarioMemoria
            );

            memoria.salvar(
                idUsuario,
                contexto.usuarioMemoria
            );

        } catch (erroPersistencia) {

            console.error(
                "❌ FALHA NA PERSISTÊNCIA:",
                erroPersistencia
            );
        }
    }

    return respostaFinal;
}

module.exports = {
    executar
};
