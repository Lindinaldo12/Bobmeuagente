const memoria = require("../memoria_v4/gerenciador");
const planner = require("../planner/planner");
const conhecimento = require("../conhecimento/gerenciador");
const orquestrador = require("../orquestrador/orquestrador");
const responseBuilder = require("../core/responseBuilder");
const memoriaContexto = require("../memoria/contexto");
const validadorResposta = require("../core/validadorResposta");
const detectorAlucinacao = require("../core/detectorAlucinacao");
const autoavaliador = require("../core/autoavaliador");

async function executar(contexto) {

    const idUsuario = String(
        contexto.usuario?.id ||
        contexto.usuarioId ||
        "anonimo"
    );

    contexto.memoria = memoria.carregar(idUsuario);
    contexto.usuarioMemoria = contexto.memoria;

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

    contexto.plano =
        planner.criarPlano(contexto.texto);

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

        resposta.resposta =
            await contexto.ia.perguntar(
                perguntaParaIA,
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
    // Quando existe Web, a Base de Conhecimento
    // local NÃO deve interferir na resposta.
    //
    // Web ativa  -> validação sem Base local
    // Web inativa -> validação normal com Base local
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

    memoria.salvar(
        idUsuario,
        contexto.usuarioMemoria
    );

    return respostaFinal;
}

module.exports = {
    executar
};
