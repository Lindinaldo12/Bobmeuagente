const seletor = require("../agentes/seletor");
const conhecimento = require("../conhecimento/motor");
const planner = require("../planner/planner");
const executorPlanner = require("../planner/executor");

// ==========================================
// MEMÓRIA PESSOAL V4 — PRIORIDADE
// ==========================================

function responderMemoriaPessoal(contexto, pergunta) {

    const memoria =
        contexto?.usuarioMemoria ||
        contexto?.memoria ||
        {};

    const perfil =
        memoria.perfil || {};

    const projetos =
        Array.isArray(perfil.projetos)
            ? perfil.projetos
            : [];

    const objetivos =
        Array.isArray(perfil.objetivos)
            ? perfil.objetivos
            : [];

    const interesses =
        Array.isArray(perfil.interesses)
            ? perfil.interesses
            : [];

    // ==========================================
    // ÚLTIMO PROJETO — MEMÓRIA V4 PERSISTENTE
    // ==========================================

    const ultimoProjeto =
        perfil.ultimoProjeto ||
        null;

    const texto =
        String(pergunta || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    // ==========================================
    // ÚLTIMO PROJETO MENCIONADO
    // ==========================================

    const perguntaUltimoProjeto =
        texto.includes("que projeto e esse") ||
        texto.includes("qual e esse projeto") ||
        texto === "esse projeto" ||
        texto === "ele";

    if (perguntaUltimoProjeto && ultimoProjeto) {
        return `Você está falando do projeto ${ultimoProjeto}.`;
    }

    // ==========================================
    // PROJETOS
    // ==========================================

    const perguntaProjeto =
        texto.includes("qual e o meu projeto") ||
        texto.includes("qual e meu projeto") ||
        texto.includes("quais sao meus projetos") ||
        texto.includes("quais meus projetos") ||
        texto.includes("nome do meu projeto") ||
        texto.includes("nome dos meus projetos");

    if (perguntaProjeto) {

        if (projetos.length === 0) {
            return "Você ainda não me contou quais são seus projetos.";
        }

        if (projetos.length === 1) {
            return `Seu projeto é ${projetos[0]}.`;
        }

        return `Seus projetos são: ${projetos.join(", ")}.`;
    }

    // ==========================================
    // OBJETIVOS
    // ==========================================

    const perguntaObjetivo =
        texto.includes("qual e o meu objetivo") ||
        texto.includes("qual e meu objetivo") ||
        texto.includes("quais sao meus objetivos") ||
        texto.includes("quais meus objetivos");

    if (perguntaObjetivo) {

        if (objetivos.length === 0) {
            return "Você ainda não me contou quais são seus objetivos.";
        }

        if (objetivos.length === 1) {
            return `Seu objetivo é ${objetivos[0]}.`;
        }

        return `Seus objetivos são: ${objetivos.join(", ")}.`;
    }

    // ==========================================
    // INTERESSES
    // ==========================================

    const perguntaInteresses =
        texto.includes("quais sao meus interesses") ||
        texto.includes("quais meus interesses") ||
        texto.includes("o que eu gosto");

    if (perguntaInteresses) {

        if (interesses.length === 0) {
            return "Você ainda não me contou quais são seus interesses.";
        }

        return `Seus interesses são: ${interesses.join(", ")}.`;
    }

    return null;
}



async function processar(contexto) {

    const texto = String(contexto.texto || "");
    const possuiWeb =
        typeof contexto.dadosWeb === "string" &&
        contexto.dadosWeb.trim().length > 0;

    console.log("");
    console.log("========================================");
    console.log("🌐 ORQUESTRADOR");
    console.log(
        "Dados Web disponíveis:",
        possuiWeb ? "SIM" : "NÃO"
    );
    console.log("========================================");

    /*
     * Se existe informação atualizada da Internet,
     * NÃO permite que a Base de Conhecimento local
     * responda diretamente à pergunta.
     */

    if (possuiWeb) {

        console.log("🌐 MODO WEB ATIVO");
        console.log("🚫 Resposta direta da Base de Conhecimento desativada.");

        const contextoWeb = {
            ...contexto,
            texto:
`PERGUNTA ORIGINAL DO USUÁRIO:
${texto}

DADOS ATUALIZADOS OBTIDOS DA INTERNET:
${contexto.dadosWeb}

INSTRUÇÕES:
- Responda diretamente à pergunta original.
- Use os dados da Internet como fonte principal.
- Não diga que não possui acesso à Internet.
- Não use a Base de Conhecimento local para substituir os dados da Web.
- Não invente informações.
- Se os dados encontrados tiverem valores diferentes, deixe isso claro.
- Seja objetivo.
- Responda em português do Brasil.`
        };

        const planoWeb = {
            objetivo: texto,
            etapas: [
                {
                    nome: "Responder usando dados atualizados da Internet",
                    agente: "Professor"
                }
            ]
        };

        console.log("===== PLANO WEB =====");
        console.log(JSON.stringify(planoWeb, null, 2));
        console.log("=====================");

        const agenteWeb =
            seletor.carregarAgente("Professor");

        if (!agenteWeb) {
            console.log("⚠️ Professor não encontrado.");
            return {
                status: "ia",
                agente: null,
                resposta: null
            };
        }

        console.log(
            "🎯 Agente Web:",
            agenteWeb.nome
        );

        const respostaWeb =
            await agenteWeb.executar({
                ...contextoWeb,
                conhecimento: "",
                dadosWeb: contexto.dadosWeb
            });

        return {
            status: "web",
            agente: agenteWeb.nome,
            resposta: respostaWeb
        };
    }

    /*
     * FLUXO NORMAL
     * Sem necessidade de Internet.
     */

    const plano = planner.criarPlano(texto);

    console.log("===== PLANO GERADO =====");
    console.log(JSON.stringify(plano, null, 2));
    console.log("========================");

    if (plano.etapas.length > 1) {

        const resultado =
            await executorPlanner.executarPlano(
                plano,
                contexto
            );

        return {
            status: "planner",
            agente: "Planner",
            resposta: resultado
                .map(r =>
                    `## ${r.etapa} (${r.agente})\n\n${r.resposta}`
                )
                .join("\n\n")
        };
    }

    const linhas = [
        texto.trim()
    ];

    const respostas = [];

    for (const linha of linhas) {

        let agente;

        if (
            plano.etapas.length === 1 &&
            plano.etapas[0].agente
        ) {
            agente =
                seletor.carregarAgente(
                    plano.etapas[0].agente
                );

            console.log(
                "🎯 Agente definido pelo Planner:",
                plano.etapas[0].agente
            );

        } else {

            agente =
                seletor.selecionar(linha);
        }

        console.log("===== AGENTE SELECIONADO =====");
        console.log(agente);
        console.log("==============================");

        // ==========================================
        // MEMÓRIA PESSOAL V4 — PRIMEIRA PRIORIDADE
        // ==========================================

        console.log("");
        console.log("===== 5D.8.176 — MEMÓRIA RECEBIDA PELO ORQUESTRADOR =====");

        console.log(
            "usuarioMemoria existe:",
            Boolean(contexto?.usuarioMemoria)
        );

        console.log(
            "memoria existe:",
            Boolean(contexto?.memoria)
        );

        console.log(
            "perfil existe:",
            Boolean(
                contexto?.usuarioMemoria?.perfil
            )
        );

        console.log(
            "projetos recebidos:",
            JSON.stringify(
                contexto?.usuarioMemoria?.perfil?.projetos || [],
                null,
                2
            )
        );

        console.log(
            "pergunta recebida:",
            linha
        );

        const respostaMemoria =
            responderMemoriaPessoal(
                contexto,
                linha
            );

        console.log(
            "respostaMemoria:",
            respostaMemoria
        );

        if (respostaMemoria) {

            console.log("");
            console.log(
                "🧠 MEMÓRIA V4: RESPOSTA PESSOAL ENCONTRADA"
            );

            respostas.push(
                respostaMemoria
            );

            continue;
        }

        // ==========================================
        // BASE DE CONHECIMENTO
        // ==========================================

        const docs =
            conhecimento.buscar(linha);

        let conhecimentoTexto = "";

        if (docs.length > 0) {
            conhecimentoTexto =
                docs[0].conteudo;
        }

        if (agente) {

            const textoLower =
                linha.toLowerCase();

            const precisaRaciocinio =
                textoLower.includes("analogia") ||
                textoLower.includes("exemplo") ||
                textoLower.includes("explique como") ||
                textoLower.includes("compare") ||
                textoLower.includes("comparar") ||
                textoLower.includes("criança") ||
                textoLower.includes("10 anos") ||
                textoLower.includes("passo a passo") ||
                textoLower.includes("resuma") ||
                textoLower.includes("opinião") ||
                textoLower.includes("explique de forma simples");

            /*
             * A Base local só pode responder diretamente
             * quando NÃO existe dados Web.
             */

            if (
                agente.nome === "Professor" &&
                conhecimentoTexto &&
                conhecimentoTexto.trim().length > 50 &&
                !precisaRaciocinio
            ) {

                console.log(
                    "📚 Respondendo diretamente da Base de Conhecimento"
                );

                respostas.push(
                    conhecimentoTexto
                );

            } else {

                console.log("================================");
                console.log(
                    "Executando agente:",
                    agente.nome
                );
                console.log(
                    "Texto:",
                    linha
                );
                console.log("================================");

                const resposta =
                    await agente.executar({
                        ...contexto,
                        texto: linha,
                        conhecimento: conhecimentoTexto
                    });

                respostas.push(resposta);
            }

        } else if (docs.length > 0) {

            respostas.push(
                "📚 Base de Conhecimento\n\n" +
                docs[0].conteudo
            );

        } else {

            respostas.push(null);
        }
    }

    if (respostas.every(r => r === null)) {

        return {
            status: "ia",
            agente: null,
            resposta: null
        };
    }

    return {
        status: "agente",
        agente: "MultiAgente",
        resposta: respostas
            .filter(r => r)
            .join("\n\n")
    };
}

module.exports = {
    processar
};
