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
        contexto.usuario?.id || "anonimo"
    );

    contexto.memoria = memoria.carregar(idUsuario);
    contexto.usuarioMemoria = contexto.memoria;

    // ✅ ETAPA 5: Obtém o contexto completo primeiro
    const ultimoContexto = memoriaContexto.obter(contexto.usuario?.id);
    
    // ✅ Extrai apenas a pergunta do contexto
    const ultimaPergunta = ultimoContexto?.pergunta || "";

    let textoProcessado = contexto.texto;

    if (
        ultimaPergunta &&
        /^(resuma|resumo|explique|continue|detalhe|compare|faça um resumo)/i.test(contexto.texto)
    ) {
        // ✅ NOVO FORMATO: Mais claro e organizado
        textoProcessado =
            `Pergunta anterior:
${ultimaPergunta}

Nova solicitação:
${contexto.texto}`;
        contexto.texto = textoProcessado;
    }

    // ✅ Salva a última mensagem para o extrator usar depois
    contexto.usuarioMemoria.ultimaMensagem = contexto.texto;

    contexto.conhecimento =
        conhecimento.consultar(contexto.texto);

    // ✅ LOG: Mostra o conhecimento consultado
    console.log("");
    console.log("===== CONHECIMENTO DO KERNEL =====");
    console.dir(contexto.conhecimento, { depth: null });
    console.log("==================================");

    contexto.plano =
        planner.criarPlano(contexto.texto);

    // ✅ LOG: Entrando no orquestrador
    console.log(">>> Entrando no ORQUESTRADOR");

    let resposta =
        await orquestrador.processar(contexto);

    // ✅ LOG: Saindo do orquestrador
    console.log("<<< Saindo do ORQUESTRADOR");

    // Se o orquestrador não resolveu, chama a IA
    if (resposta.status === "ia") {
        resposta.resposta =
            await contexto.ia.perguntar(
                contexto.texto,
                contexto.historico,
                contexto.usuario
            );
    }

    // ✅ Constrói a resposta final formatada
    let respostaFinal = responseBuilder.construir(
        resposta,
        contexto
    );

    // ✅ Valida a resposta final
    respostaFinal = validadorResposta.validar(
        respostaFinal,
        contexto.conhecimento?.conhecimento || ""
    );

    // ✅ Verifica e corrige alucinações
    const verificacao = detectorAlucinacao.verificar(
        respostaFinal,
        contexto.conhecimento?.conhecimento || ""
    );

    respostaFinal = verificacao.resposta;

    // ✅ Autoavaliação da resposta
    const avaliacao = autoavaliador.avaliar(respostaFinal);

    if (!avaliacao.aprovada) {
        console.log("===== AUTOAVALIADOR =====");
        console.log(avaliacao.problemas);
        console.log("=========================");
    }

    // ✅ Salva o contexto com pergunta E resposta
    memoriaContexto.salvar(
        contexto.usuario?.id,
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
