const config = require("../config/config");
const systemPrompt = require("../core/systemPrompt");

const OLLAMA_URL = "http://127.0.0.1:11434";

const MAX_HISTORICO = 6;
const TIMEOUT_MS = 120000;

// ==========================================
// VALIDAÇÃO DE ENTRADA
// ==========================================

function validarModelo() {
    const modelo = config.ollama && config.ollama.model;

    if (!modelo || typeof modelo !== "string") {
        throw new Error(
            "Modelo do Ollama não configurado. "
            + "Verifique config.ollama.model."
        );
    }

    return modelo;
}

function validarPergunta(text) {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error(
            "Pergunta vazia ou inválida."
        );
    }

    return text.trim();
}

// ==========================================
// HISTÓRICO
// ==========================================

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

// ==========================================
// MONTAGEM DE MENSAGENS
// ==========================================

function montarMessages(pergunta, historico, systemContent) {
    const historicoSeguro =
        prepararHistorico(historico);

    return {
        historicoSeguro,
        messages: [
            {
                role: "system",
                content: systemContent
            },
            ...historicoSeguro,
            {
                role: "user",
                content: pergunta
            }
        ]
    };
}

// ==========================================
// REQUISIÇÃO AO OLLAMA
// ==========================================

async function requisicaoOllama(messages, temperature) {

    const modelo = validarModelo();

    const resposta = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            model: modelo,
            messages,
            stream: false,
            options: {
                temperature: temperature ?? 0.2
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
            throw new Error(`HTTP ${resposta.status}`);
        }

        console.log("✅ Ollama conectada.");

        return true;

    } catch (erro) {

        console.log("❌ Erro ao conectar Ollama:");
        console.log(erro.message);

        return false;
    }
}

// ========================================
// PERGUNTA NORMAL
// ========================================

async function perguntar(
    pergunta,
    historico = [],
    usuario = null
) {

    try {

        const perguntaSegura =
            validarPergunta(pergunta);

        const { historicoSeguro, messages } =
            montarMessages(
                perguntaSegura,
                historico,
                systemPrompt
            );

        // Personaliza a temperatura pelo perfil do usuário,
        // se disponível. Fallback para 0.2.
        const temperatura =
            usuario?.perfil?.temperatura ??
            config.ollama.temperature ??
            0.2;

        const modelo = [
            "📚 Histórico:",
            historicoSeguro.length,
            "mensagens | 🤖 Modelo:",
            config.ollama.model
        ].join(" ");

        console.log(modelo);

        return await requisicaoOllama(
            messages,
            temperatura
        );

    } catch (erro) {

        console.log("❌ Erro no Ollama:");
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

        const perguntaSegura =
            validarPergunta(pergunta);

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

        const { historicoSeguro, messages } =
            montarMessages(
                perguntaSegura,
                historico,
                systemEspecialista
            );

        const temperatura =
            usuario?.perfil?.temperatura ??
            config.ollama.temperature ??
            0.2;

        console.log(
            "📚 Histórico especialista:",
            historicoSeguro.length,
            "mensagens"
        );

        return await requisicaoOllama(
            messages,
            temperatura
        );

    } catch (erro) {

        console.log("❌ Erro especialista:");
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
