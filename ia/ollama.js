const config = require("../config/config");
const systemPrompt = require("../core/systemPrompt");

const OLLAMA_URL = "http://127.0.0.1:11434";

const MAX_HISTORICO = 6;
const TIMEOUT_MS = 120000;

function prepararHistorico(historico) {
    if (!Array.isArray(historico)) {
        return [];
    }

    return historico
        .filter(item =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim()
        )
        .slice(-MAX_HISTORICO)
        .map(item => ({
            role: item.role,
            content: item.content.trim()
        }));
}

async function requisicaoOllama(messages) {

    const resposta = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            model: config.ollama.model,

            messages,

            stream: false,

            options: {
                temperature: 0.2
            }
        }),

        signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!resposta.ok) {

        const erro = await resposta.text();

        throw new Error(
            `Ollama HTTP ${resposta.status}: ${erro}`
        );
    }

    const dados = await resposta.json();

    if (
        !dados ||
        !dados.message ||
        typeof dados.message.content !== "string"
    ) {
        throw new Error(
            "Resposta inválida recebida do Ollama."
        );
    }

    return dados.message.content.trim();
}


// ========================================
// CONECTAR
// ========================================

async function conectar() {

    try {

        const resposta = await fetch(
            `${OLLAMA_URL}/api/tags`,
            {
                signal: AbortSignal.timeout(3000)
            }
        );

        if (!resposta.ok) {
            throw new Error(
                `HTTP ${resposta.status}`
            );
        }

        console.log("✅ Ollama conectada.");

        return true;

    } catch (erro) {

        console.log(
            "❌ Erro ao conectar Ollama:"
        );

        console.log(erro.message);

        return false;
    }
}


// ========================================
// PERGUNTA NORMAL
// ========================================

async function perguntar(
    pergunta,
    historico = []
) {

    try {

        console.log(
            "1 - Iniciando requisição..."
        );

        const historicoSeguro =
            prepararHistorico(historico);

        const messages = [

            {
                role: "system",
                content: systemPrompt
            },

            ...historicoSeguro,

            {
                role: "user",
                content: pergunta
            }

        ];

        console.log(
            "📚 Histórico enviado:",
            historicoSeguro.length,
            "mensagens"
        );

        console.log(
            "🤖 Modelo:",
            config.ollama.model
        );

        const resposta =
            await requisicaoOllama(messages);

        console.log(
            "2 - Resposta recebida."
        );

        return resposta;

    } catch (erro) {

        console.log(
            "❌ Erro no Ollama:"
        );

        console.log(erro.message);

        return (
            "Não foi possível consultar a inteligência artificial agora."
        );
    }
}


// ========================================
// ESPECIALISTA
// ========================================

async function perguntarEspecialista(
    prompt,
    pergunta,
    historico = [],
    usuario = null
) {

    try {

        console.log(
            "1 - Iniciando requisição do especialista..."
        );

        /*
         * IMPORTANTE:
         *
         * O especialista recebe apenas um pequeno
         * contexto recente.
         *
         * Não enviamos o histórico inteiro.
         */

        const historicoSeguro =
            prepararHistorico(historico);

        const systemEspecialista = `

${systemPrompt}

=========================
MODO ESPECIALISTA
=========================

${prompt}

=========================
REGRAS DO ESPECIALISTA
=========================

1. A pergunta atual tem prioridade.
2. Não copie respostas antigas do histórico.
3. Não diga que está pronto para desenvolver.
4. Não invente que executou código.
5. Analise exatamente o conteúdo enviado pelo usuário.
6. Se o usuário enviou código, analise o código.
7. Responda diretamente à pergunta.
8. Não fale sobre o funcionamento interno do Bob.
9. Não mencione o modelo de IA.
10. Responda em português do Brasil.

`;

        const messages = [

            {
                role: "system",
                content: systemEspecialista
            },

            /*
             * Somente contexto recente.
             *
             * O histórico não pode dominar
             * a pergunta atual.
             */

            ...historicoSeguro,

            {
                role: "user",
                content: pergunta
            }

        ];

        console.log(
            "📚 Histórico especialista:",
            historicoSeguro.length,
            "mensagens"
        );

        console.log(
            "URL:",
            `${OLLAMA_URL}/api/chat`
        );

        console.log(
            "Modelo:",
            config.ollama.model
        );

        const resposta =
            await requisicaoOllama(messages);

        return resposta;

    } catch (erro) {

        console.log(
            "❌ Erro especialista:"
        );

        console.log(erro.message);

        return (
            "Não foi possível concluir a análise do especialista."
        );
    }
}


module.exports = {

    conectar,

    perguntar,

    perguntarEspecialista

};
