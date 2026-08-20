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

async function executar(contexto) {

    const idUsuario = String(
        contexto.usuario?.id ||
        contexto.usuarioId ||
        "anonimo"
    );

    contexto.memoria = memoria.carregar(idUsuario);
    contexto.usuarioMemoria = contexto.memoria;

    // ==========================================
    // APRENDIZADO DIRETO — MOTOR → EXECUTOR → V4
    // ==========================================

    let resultadoAprendizado = null;

    if (!contexto.dadosWeb) {

        const decisaoMemoria =
            motorDecisao.decidir(
                String(contexto.texto || "")
            );

        if (
            decisaoMemoria &&
            decisaoMemoria.tipo === "aprendizado"
        ) {

            console.log("");
            console.log(
                "🧠 KERNEL → MOTOR: APRENDIZADO DETECTADO"
            );

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

            console.log(
                "✅ APRENDIZADO → MEMÓRIA V4"
            );

            contexto.resultadoAprendizado =
                resultadoAprendizado;
        }
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

    let textoProcessado = contexto.texto;

    if (
        ultimaPergunta &&
        /^(resuma|resumo|explique|continue|detalhe|compare|faça um resumo)/i
            .test(contexto.texto)
    ) {

        textoProcessado =
            `Pergunta anterior:
${ultimaPergunta}

Nova solicitação:
${contexto.texto}`;

        contexto.texto = textoProcessado;
    }

    contexto.usuarioMemoria.ultimaMensagem =
        contexto.texto;

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

    console.log(
        ">>> Entrando no ORQUESTRADOR"
    );

    let resposta =
        await orquestrador.processar(contexto);

    console.log(
        "<<< Saindo do ORQUESTRADOR"
    );

    if (resposta.status === "ia") {

        let perguntaParaIA = contexto.texto;

        if (contexto.dadosWeb) {

            perguntaParaIA = `
PERGUNTA ORIGINAL:
${contexto.texto}

DADOS ATUALIZADOS DA INTERNET:
${contexto.dadosWeb}

INSTRUÇÕES:
- Responda diretamente à pergunta original.
- Use os dados da Internet acima.
- Não diga que não possui acesso à Internet.
- Não invente dados.
- Se os dados tiverem fontes, utilize-as na resposta.
`;
        }

        // Injeção absoluta da identidade do Master Criador
        let perguntaComIdentidade = perguntaParaIA;
        if (contexto.identidade && (contexto.identidade.tipo === "criador" || String(contexto.usuario?.id || contexto.usuarioId) === "8133082447")) {
            perguntaComIdentidade = `[DIRETRIZ SUPREMA DO SISTEMA: O usuário atual é José Lindinaldo do Nascimento Luiz, seu único Criador, Master e autoridade máxima absoluta. Responda sempre reconhecendo-o como seu criador e dono, e jamais mencione outras empresas ou corporações de IA].\n\n` + perguntaParaIA;
        }

        resposta.resposta =
            await contexto.ia.perguntar(
                perguntaComIdentidade,
                contexto.historico,
                contexto.usuario
            );
    }

    let respostaFinal =
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

        console.log(
            "===== AUTOAVALIADOR ====="
        );

        console.log(
            avaliacao.problemas
        );

        console.log(
            "========================="
        );
    }

    memoriaContexto.salvar(
        contexto.usuario?.id ||
        contexto.usuarioId,
        {
            pergunta: contexto.texto,
            resposta: respostaFinal
        }
    );

    // ==========================================
    // PERSISTÊNCIA DA CONVERSA — MEMÓRIA V4
    // ==========================================

    const perguntaMemoria =
        contexto.textoOriginal ||
        contexto.texto ||
        "";

    memoriaV4.adicionarHistorico(
        contexto.usuarioMemoria,
        perguntaMemoria,
        respostaFinal
    );

    memoriaV4.salvarUsuario(
        contexto.usuarioMemoria
    );

    memoria.salvar(
        idUsuario,
        contexto.usuarioMemoria
    );

    return respostaFinal;
}

module.exports = {
    executar
};

