function criarPlano(texto) {
    texto = texto.toLowerCase();

    const etapas = [];

    // TAREFAS SIMPLES - Apenas 1 agente
    if (
        texto.includes("explique") ||
        texto.includes("ensine") ||
        texto.includes("o que é") ||
        texto.includes("defina") ||
        texto.includes("conceito")
    ) {
        etapas.push({
            nome: "Explicar conceito",
            agente: "Professor"
        });
    }
    // TAREFAS DE CÓDIGO - Múltiplos agentes
    else if (
        texto.includes("código") ||
        texto.includes("codigo") ||
        texto.includes("api") ||
        texto.includes("node") ||
        texto.includes("python") ||
        texto.includes("programa") ||
        texto.includes("crie um") ||
        texto.includes("desenvolva")
    ) {
        etapas.push({
            nome: "Analisar requisitos",
            agente: "Analista"
        });

        etapas.push({
            nome: "Desenvolver solução",
            agente: "Programador"
        });

        etapas.push({
            nome: "Revisar documentação",
            agente: "Escritor"
        });
    }
    // TAREFAS DE SEGURANÇA
    else if (
        texto.includes("linux") ||
        texto.includes("segurança") ||
        texto.includes("servidor") ||
        texto.includes("hacking") ||
        texto.includes("vulnerabilidade")
    ) {
        etapas.push({
            nome: "Analisar segurança",
            agente: "Segurança"
        });

        etapas.push({
            nome: "Produzir recomendações",
            agente: "Analista"
        });
    }
    // TAREFAS DE ANÁLISE
    else if (
        texto.includes("analise") ||
        texto.includes("analisar") ||
        texto.includes("compare") ||
        texto.includes("comparar")
    ) {
        etapas.push({
            nome: "Analisar dados",
            agente: "Analista"
        });
    }
    // TAREFAS DE ESCRITA
    else if (
        texto.includes("escreva") ||
        texto.includes("redija") ||
        texto.includes("artigo") ||
        texto.includes("texto") ||
        texto.includes("resumo")
    ) {
        etapas.push({
            nome: "Escrever conteúdo",
            agente: "Escritor"
        });
    }
    // PADRÃO - Professor para perguntas gerais
    else {
        etapas.push({
            nome: "Responder solicitação",
            agente: "Professor"
        });
    }

    return {
        objetivo: texto,
        etapas
    };
}

module.exports = {
    criarPlano
};
