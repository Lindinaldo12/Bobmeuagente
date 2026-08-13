const seletor = require("../agentes/seletor");
const conhecimento = require("../conhecimento/motor");
const planner = require("../planner/planner");
const executorPlanner = require("../planner/executor");

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
