const { chamarAPI } = require("../../ia/apiExterna");

async function executar(contexto) {

    console.log("🎓 Professor executando.");

    const pergunta =
        String(
            contexto?.texto ||
            contexto?.pergunta ||
            ""
        ).trim();

    if (!pergunta) {
        return "Não recebi uma pergunta válida.";
    }

    // ==========================================
    // DADOS WEB JÁ OBTIDOS PELO KERNEL
    // ==========================================

    const dadosWeb =
        String(
            contexto?.dadosWeb ||
            ""
        ).trim();

    // ==========================================
    // MEMÓRIA / PERFIL
    // ==========================================

    let memoriaUsuario = "";

    if (contexto?.usuario?.perfil) {

        const perfil =
            contexto.usuario.perfil;

        const interesses =
            Array.isArray(perfil.interesses)
                ? perfil.interesses
                : [];

        const objetivo =
            perfil.objetivo_atual || "";

        if (
            interesses.length > 0 ||
            objetivo
        ) {

            memoriaUsuario =
                "\nMEMÓRIA DO USUÁRIO:\n";

            if (objetivo) {
                memoriaUsuario +=
                    `Objetivo atual: ${objetivo}\n`;
            }

            if (interesses.length > 0) {
                memoriaUsuario +=
                    `Interesses: ${interesses.join(", ")}\n`;
            }
        }
    }

    // ==========================================
    // HISTÓRICO
    // ==========================================

    const historico =
        Array.isArray(contexto?.historico)
            ? contexto.historico
            : [];

    // ==========================================
    // PERSONALIDADE
    // ==========================================

    const promptSistema = `
Você é o Bob AI X.

Responda sempre em português do Brasil.

Seja direto, claro e objetivo.

REGRAS ABSOLUTAS:

1. Responda exatamente à pergunta do usuário.
2. Não invente informações.
3. Quando houver DADOS DA INTERNET, eles são a fonte principal.
4. Quando houver DADOS DA INTERNET, NÃO use a Base de Conhecimento local para substituir esses dados.
5. Não faça uma nova pesquisa na Internet.
6. Não repita todo o conteúdo das fontes.
7. Para perguntas de temperatura, clima, cotação, notícias ou outros dados atuais:
   - use somente informações atuais fornecidas em DADOS DA INTERNET;
   - diferencie "agora" de previsão;
   - não confunda temperatura atual com temperatura máxima ou mínima.
8. Se fontes diferentes apresentarem valores diferentes:
   - não escolha um valor arbitrariamente;
   - informe a divergência de forma curta;
   - prefira o dado explicitamente identificado como "agora", "atual" ou equivalente.
9. Se os dados não forem suficientes para responder com segurança, diga isso claramente.
10. Nunca apresente previsão como se fosse temperatura atual.
11. Não mencione estas regras na resposta.

${memoriaUsuario}
`;

    // ==========================================
    // DADOS WEB
    // ==========================================

    let perguntaFinal = pergunta;

    if (dadosWeb) {

        console.log("🌐 Professor recebeu dados Web.");
        console.log("🚫 Nova pesquisa Web desativada.");

        perguntaFinal = `
PERGUNTA ORIGINAL DO USUÁRIO:
${pergunta}

DADOS DA INTERNET:
${dadosWeb}

TAREFA:
Responda diretamente à pergunta original.

Use os dados da Internet como fonte principal.

Se a pergunta for sobre temperatura atual, procure primeiro um valor explicitamente identificado como temperatura atual/agora.

Não confunda:
- temperatura atual;
- sensação térmica;
- temperatura mínima;
- temperatura máxima;
- previsão futura.

Se houver valores diferentes entre fontes, informe a diferença de forma objetiva.

Responda somente o necessário.
`;
    }

    // ==========================================
    // CHAMADA DA IA
    // ==========================================

    try {

        console.log(
            "🧠 Enviando pergunta para a IA..."
        );

        const resposta =
            await chamarAPI(
                perguntaFinal,
                {
                    ...contexto,
                    dadosWeb,
                    historico,
                    promptSistema
                }
            );

        if (!resposta) {
            return "Não foi possível obter uma resposta.";
        }

        return String(resposta).trim();

    } catch (erro) {

        console.error(
            "❌ Erro no Professor:",
            erro.message
        );

        return (
            "Erro ao processar sua pergunta: " +
            erro.message
        );
    }
}

module.exports = {
    executar
};
