const { GoogleGenAI } = require("@google/genai");
const config = require("../config/config");

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

async function perguntar(pergunta) {
    try {
        if (!ai) {
            throw new Error("Gemini não inicializado.");
        }

        const resposta = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: pergunta
                        }
                    ]
                }
            ]
        });

        return resposta.text;

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
