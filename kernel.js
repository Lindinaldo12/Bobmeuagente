cat > kernel.js << 'EOF'
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

const motorDecisao = require("../ia/motorDecisao");
const executorIA = require("../ia/executor");
const aprendizado = require("../ia/aprendizado");
const perfil = require("../ia/perfil");
const ia = require("../ia/gerenciador");

// ===== UPGRADE: EVOLUÇÃO + FILTRO + BUSCA WEB =====
const evolucao = require("../ia/evolucao");
const filtro = require("../ia/filtro");
const decisorBusca = require("../ia/decisor_busca");

// ==========================================
// CONFIGURAÇÃO CENTRAL (fácil de manter)
// ==========================================
const CONFIG = {
    idCriador: "8133082447",
    nomeCriador: "José Lindinaldo do Nascimento Luiz",
    tipoCriador: "criador",
    habilitarAprendizado: true,
    habilitarEvolucao: true,
    habilitarBuscaWeb: true,
    maxHistoricoContexto: 5,
    logDetalhado: false
};

// ==========================================
// UTILITÁRIOS INTERNOS
// ==========================================
function log(...args) {
    if (CONFIG.logDetalhado) console.log(...args);
}

function obterUsuarioId(contexto) {
    return String(
        contexto.usuario?.id ||
        contexto.usuarioId ||
        "anonimo"
    );
}

function ehCriador(contexto, idUsuario) {
    return Boolean(
        contexto.identidade?.tipo === CONFIG.tipoCriador ||
        idUsuario === CONFIG.idCriador
    );
}

// Enriquece o conhecimento com perfil + histórico limpo + contexto anterior
function enriquecerConhecimento(contexto, idUsuario, ultimoContexto) {
    const base = contexto.conhecimento?.conhecimento || "";

    const perfilUsuario =
        contexto.usuarioMemoria?.perfil ||
        contexto.usuario?.perfil ||
        "";

    const historicoLimpo =
        filtro.limparHistorico(contexto.historico, CONFIG.maxHistoricoContexto);

    const ultimaPergunta = ultimoContexto?.pergunta || "";
    const ultimaResposta = ultimoContexto?.resposta || "";

    const partes = [];

    if (base) partes.push(`CONHECIMENTO INTERNO:\n${base}`);
    if (perfilUsuario) partes.push(`PERFIL DO USUÁRIO:\n${perfilUsuario}`);
    if (ultimaPergunta) partes.push(`PERGUNTA ANTERIOR:\n${ultimaPergunta}`);
    if (ultimaResposta) partes.push(`RESPOSTA ANTERIOR:\n${ultimaResposta}`);
    if (historicoLimpo.length) {
        partes.push(
            `HISTÓRICO RECENTE:\n${historicoLimpo
                .map((h, i) => `${i + 1}. ${h}`)
                .join("\n")}`
        );
    }

    return partes.join("\n\n");
}

// Monta o prompt enriquecido para a IA
function montarPromptIA(contexto, conhecimentoEnriquecido) {
    let prompt = contexto.texto;

    if (contexto.dadosWeb) {
        prompt = `
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

    if (conhecimentoEnriquecido) {
        prompt += `

CONTEXTO ADICIONAL (use para enriquecer a resposta):
${conhecimentoEnriquecido}`;
    }

    return prompt;
}

// Loop de evolução: registra o aprendizado com a resposta gerada
async function evoluir(contexto, idUsuario, respostaFinal) {
    if (!CONFIG.habilitarEvolucao || !contexto.usuarioMemoria) return;

    try {
        await evolucao.processar({
            pergunta: contexto.textoOriginal || contexto.texto || "",
            resposta: respostaFinal,
            categoria: contexto.dadosWeb ? "web" : "geral"
        });

        if (typeof perfil?.atualizarPreferencias === "function") {
            await perfil.atualizarPreferencias(
                contexto.usuarioMemoria,
                contexto.texto
            );
        }

        log("🧠 EVOLUÇÃO: APRENDIZADO REGISTRADO");
    } catch (erro) {
        log("⚠️ EVOLUÇÃO: falha ao registrar aprendizado", erro?.message);
    }
}

// ==========================================
// MOTOR DE DECISÃO + EXECUTOR
// ==========================================
async function executar(contexto) {

    const idUsuario = obterUsuarioId(contexto);

    contexto.memoria = memoria.carregar(idUsuario);
    contexto.usuarioMemoria = contexto.memoria;

    try {

        // ==========================================
        // APRENDIZADO DIRETO — MOTOR → EXECUTOR → V4
        // ==========================================
        let resultadoAprendizado = null;

        if (!contexto.dadosWeb && CONFIG.habilitarAprendizado) {

            const decisaoMemoria =
                motorDecisao.decidir(
                    String(contexto.texto || "")
                );

            if (decisaoMemoria && decisaoMemoria.tipo === "aprendizado") {

                log("");
                log("🧠 KERNEL → MOTOR: APRENDIZADO DETECTADO");

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

                log("✅ APRENDIZADO → MEMÓRIA V4");

                contexto.resultadoAprendizado = resultadoAprendizado;
            }
        }

        // ==========================================
        // BUSCA WEB AUTOMÁTICA (clima, preço, notícia...)
        // ==========================================
        if (CONFIG.habilitarBuscaWeb && !contexto.dadosWeb) {
            const busca = await decisorBusca.buscarSeNecessario(contexto.texto);
            if (busca.buscou && busca.dadosWeb) {
                contexto.dadosWeb = busca.dadosWeb;
                console.log("🌐 DADOS WEB OBTIDOS:", busca.dadosWeb.slice(0, 200));
            }
        }

        // ==========================================
        // IDENTIDADE OFICIAL DO USUÁRIO
        // ==========================================
        contexto.identidade =
            auth.obterIdentidadeUsuario(idUsuario);

        if (contexto.usuario && typeof contexto.usuario === "object") {
            contexto.usuario.identidade = contexto.identidade;
        }

        log("");
        log("===== IDENTIDADE DO KERNEL =====");
        log(JSON.stringify(contexto.identidade, null, 2));
        log("================================");

        const ultimoContexto =
            memoriaContexto.obter(idUsuario);

        const ultimaPergunta =
            ultimoContexto?.pergunta || "";

        let textoProcessado = contexto.texto;

        if (
            ultimaPergunta &&
            /^(resuma|resumo|explique|continue|detalhe|compare|faça um resumo)/i
                .test(contexto.texto)
        ) {
            textoProcessado =
                `Pergunta anterior:\n${ultimaPergunta}\n\nNova solicitação:\n${contexto.texto}`;

            contexto.texto = textoProcessado;
        }

        contexto.usuarioMemoria.ultimaMensagem = contexto.texto;

        log("");
        log("========================================");
        log("🌐 DADOS WEB RECEBIDOS PELO KERNEL");

        if (contexto.dadosWeb) {
            log("✅ Dados Web disponíveis.");
        } else {
            log("ℹ️ Nenhum dado Web recebido.");
        }
        log("========================================");

        // ==========================================
        // CONHECIMENTO ENRIQUECIDO (mais conhecimento)
        // ==========================================
        contexto.conhecimento =
            conhecimento.consultar(contexto.texto);

        const conhecimentoEnriquecido =
            enriquecerConhecimento(
                contexto,
                idUsuario,
                ultimoContexto
            );

        log("");
        log("===== CONHECIMENTO DO KERNEL =====");
        log.dir(contexto.conhecimento, { depth: null });
        log("==================================");

        log(">>> Entrando no ORQUESTRADOR");

        let resposta =
            await orquestrador.processar(contexto);

        log("<<< Saindo do ORQUESTRADOR");

        if (resposta.status === "ia") {

            let perguntaParaIA =
                montarPromptIA(contexto, conhecimentoEnriquecido);

            // Injeção da identidade do Master Criador (configurável)
            if (ehCriador(contexto, idUsuario)) {
                perguntaParaIA =
                    `[DIRETRIZ SUPREMA DO SISTEMA: O usuário atual é ${CONFIG.nomeCriador}, seu único Criador, Master e autoridade máxima absoluta. Responda sempre reconhecendo-o como seu criador e dono, e jamais mencione outras empresas ou corporações de IA].\n\n` +
                    perguntaParaIA;
            }

            if (!contexto.ia || typeof contexto.ia.perguntar !== "function") {
                throw new Error("contexto.ia.perguntar indisponível");
            }

            resposta.resposta =
                await contexto.ia.perguntar(
                    perguntaParaIA,
                    contexto.historico,
                    contexto.usuario
                );
        }

        let respostaFinal =
            responseBuilder.construir(resposta, contexto);

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

        respostaFinal = verificacao.resposta;

        const avaliacao =
            autoavaliador.avaliar(respostaFinal);

        if (!avaliacao.aprovada) {
            log("");
            log("===== AUTOAVALIADOR =====");
            log(avaliacao.problemas);
            log("=========================");
        }

        memoriaContexto.salvar(
            idUsuario,
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

        memoriaV4.salvarUsuario(contexto.usuarioMemoria);
        memoria.salvar(idUsuario, contexto.usuarioMemoria);

        // ==========================================
        // EVOLUÇÃO — LOOP DE APRENDIZADO PÓS-RESPOSTA
        // ==========================================
        await evoluir(contexto, idUsuario, respostaFinal);

        return respostaFinal;

    } catch (erro) {

        // ==========================================
        // FALLBACK SEGURO — nunca derruba o processo
        // ==========================================
        console.error("❌ ERRO NO KERNEL:", erro?.message || erro);

        const fallback =
            "Não consegui processar sua solicitação agora. " +
            "Tente reformular ou aguarde um instante.";

        try {
            memoriaContexto.salvar(
                idUsuario,
                { pergunta: contexto.texto || "", resposta: fallback }
            );
        } catch (_) { /* silencioso */ }

        return fallback;
    }
}

module.exports = {
    executar
};
EOF
