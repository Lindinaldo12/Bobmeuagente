const { GoogleGenAI } = require("@google/genai");
const config = require("../config/config");
const memoria = require("../memoria/memoria");

let ai = null;

function conectar() {
    try {
        if (!config.gemini.apiKey) {
            throw new Error("GEMINI_API_KEY não configurada.");
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

    console.log("🔵 1 - Entrou em perguntar");
    console.log("🔵 2 - Montando prompt");

    try {
        if (!ai) {
            throw new Error("Gemini não inicializado.");
        }

        // --- Definição da Persona e Regras do Bob AI ---
        const promptSystem = `
Você é Bob AI.

Regras:

- Responda SEMPRE em português do Brasil.
- Nunca responda em inglês, exceto se o usuário pedir.
- Seja claro, objetivo e educado.
- Use exemplos quando necessário.
- Nunca invente informações.
- Se não souber a resposta, diga que não sabe.
`;

        // Concatena as instruções do sistema, o histórico (se houver) e a nova pergunta
        let promptFinal = `${promptSystem}\n`;

        if (historico && historico.length > 0) {
            promptFinal += `Contexto da conversa (Memória):\n${historico.join("\n")}\n\n`;
        }

        promptFinal += `Pergunta do usuário:\n${pergunta}`;

        // Chamada atualizada com o modelo gemini-2.5-flash
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptFinal
        });

        console.log("🟢 3 - Gemini respondeu");

        const textoResposta = result.text;

        console.log("🟢 4 - Retornando resposta");

        return textoResposta;

    } catch (erro) {
        console.log("❌ Erro no Gemini:");
        console.log(erro);

        return "Desculpe, ocorreu um erro ao consultar o Gemini.";
    }
}

module.exports = {
    conectar,
    perguntar
};

