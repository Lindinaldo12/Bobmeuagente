require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

(async () => {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.OPENROUTER_API_KEY
        });

        const modelos = await ai.models.list();

        console.log("\n===== MODELOS DISPONÍVEIS =====\n");

        for await (const modelo of modelos) {
            console.log(modelo.name);
        }

    } catch (erro) {
        console.error(erro);
    }
})();
