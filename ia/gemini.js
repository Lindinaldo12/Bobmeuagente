const { GoogleGenAI } = require("@google/genai");
const config = require("../config/config");

let ai = null;

function conectar() {
    try {
        if (!config.gemini.apiKey) {
            throw new Error("GEMINI_API_KEY não configurada");
        }

        ai = new GoogleGenAI({
            apiKey: config.gemini.apiKey
        });

        console.log("✅ Gemini conectado.");
        return true;

    } catch (erro) {
        console.log("❌ Erro ao conectar Gemini:");
        console.log(erro.message);
        return false;
    }
}

async function perguntar(pergunta, historico = []) {
    console.log("🟢 1 - Entrou em perguntar");
    console.log("🟢 2 - Montando prompt");

    try {
        if (!ai) {
            throw new Error("Gemini não inicializado.");
        }

        // --- Definição da Persona e Regras do Bob AI ---
        const promptSystem = `Você é Bob AI.

Regras:
- Responda SEMPRE em português do Brasil.
- Nunca responda em inglês, exceto se o usuário pedir.
- Seja claro, objetivo e educado.
- Use exemplos quando necessário.
- Nunca invente informações.
- Se não souber a resposta, diga que não sabe.
`;

        // Concatena as instruções do sistema, o histórico e a pergunta
        let promptFinal = `${promptSystem}\n`;

        if (historico && historico.length > 0) {
            const conversa = historico
                .map(item => `Usuário: ${item.pergunta}\nBob: ${item.resposta}`)
                .join("\n\n");

            promptFinal += `Contexto da conversa (Memória):\n${conversa}\n\n`;
        }

        promptFinal += `Pergunta do usuário:\n${pergunta}`;

        // Chamada enviando o promptFinal (variável, sem aspas) para o modelo Gemini
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: promptFinal // CORRIGIDO: sem aspas para passar a variável
                        }
                    ]
                }
            ]
        });

        // --- Logs para inspeção completa do resultado ---
        console.log("===== RESULTADO GEMINI =====");
        console.dir(result, { depth: null });
        console.log("============================");

        console.log("🟢 3 - Gemini respondeu");

        // Obtém o texto retornado pelo modelo
        const textoResposta = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("🟢 4 - Retornando resposta");

        return textoResposta;

    } catch (erro) {
        console.log("==================================");
        console.log("❌ ERRO COMPLETO DO GEMINI");
        console.log("==================================");

        console.error(erro);

        if (erro.response) {
            console.log("Status:", erro.response.status);
            console.dir(erro.response.data, { depth: null });
        }

        return "Desculpe, ocorreu um erro ao consultar o Gemini.";
    }
}

module.exports = {
    conectar,
    perguntar
};

