const ollama = require("ollama");
const config = require("../config/config");

async function conectar() {
    try {
        await ollama.list();

        console.log("✅ Ollama conectado.");
        return true;

    } catch (erro) {
        console.log("❌ Erro ao conectar Ollama:");
        console.log(erro.message);
        return false;
    }
}

async function perguntar(pergunta) {
    try {
        const resposta = await ollama.chat({
            model: config.ollama.model,
            messages: [
                {
                    role: "user",
                    content: pergunta
                }
            ]
        });

        return resposta.message.content;

    } catch (erro) {
        console.log("❌ Erro no Ollama:");
        console.log(erro.message);

        return "Desculpe, ocorreu um erro ao consultar o Ollama.";
    }
}

module.exports = {
    conectar,
    perguntar
};
