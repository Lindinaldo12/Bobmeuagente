const seletor = require("../agentes/seletor");
const conhecimento = require("../conhecimento/motor");
const planner = require("../planner/planner");
const executorPlanner = require("../planner/executor");

async function processar(contexto) {

    // PLANNER: Cria plano e executa se for tarefa complexa
    const plano = planner.criarPlano(contexto.texto);

    // ✅ LOG: Mostra o plano gerado
    console.log("===== PLANO GERADO =====");
    console.log(JSON.stringify(plano, null, 2));
    console.log("========================");

    if (plano.etapas.length > 1) {

        const resultado = await executorPlanner.executarPlano(
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

    // ✅ ETAPA 36: Trata o texto como uma única linha
    const linhas = [
        contexto.texto.trim()
    ];

    const respostas = [];

    for (const linha of linhas) {

        // ✅ NOVO: Respeita a decisão do Planner para agente único
        let agente;

        if (
            plano.etapas.length === 1 &&
            plano.etapas[0].agente
        ) {
            agente = seletor.carregarAgente(
                plano.etapas[0].agente
            );

            console.log(
                "🎯 Agente definido pelo Planner:",
                plano.etapas[0].agente
            );
        } else {
            agente = seletor.selecionar(linha);
        }

        // ✅ LOG DE DIAGNÓSTICO
        console.log("===== AGENTE SELECIONADO =====");
        console.log(agente);
        console.log("==============================");

        const docs = conhecimento.buscar(linha);

        let conhecimentoTexto = "";

        if (docs.length > 0) {
            conhecimentoTexto = docs[0].conteudo;
        }

        if (agente) {

            // ✅ VERIFICA se precisa de raciocínio
            const texto = linha.toLowerCase();

            const precisaRaciocinio =
                texto.includes("analogia") ||
                texto.includes("exemplo") ||
                texto.includes("explique como") ||
                texto.includes("compare") ||
                texto.includes("comparar") ||
                texto.includes("criança") ||
                texto.includes("10 anos") ||
                texto.includes("passo a passo") ||
                texto.includes("resuma") ||
                texto.includes("opinião") ||
                texto.includes("explique de forma simples");

            // ✅ OTIMIZAÇÃO: Se é Professor, tem conhecimento e NÃO precisa de raciocínio
            if (
                agente.nome === "Professor" &&
                conhecimentoTexto &&
                conhecimentoTexto.trim().length > 50 &&
                !precisaRaciocinio
            ) {
                console.log("📚 Respondendo diretamente da Base de Conhecimento");
                respostas.push(conhecimentoTexto);

            } else {
                // ✅ LOG DE DEBUG: Mostra qual agente vai ser executado
                console.log("================================");
                console.log("Executando agente:", agente.nome);
                console.log("Texto:", linha);
                console.log("================================");

                const resposta = await agente.executar({
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
