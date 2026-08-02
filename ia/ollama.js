const config = require("../config/config");

async function conectar() {
    try {
        const resposta = await fetch("http://127.0.0.1:11434/api/tags", {
            signal: AbortSignal.timeout(3000)
        });

        if (!resposta.ok) {
            throw new Error("Servidor Ollama indisponível.");
        }

        console.log("✅ Ollama conectado.");
        return true;

    } catch (erro) {
        console.log("❌ Erro ao conectar Ollama:");
        console.log(erro.message);
        return false;
    }
}

async function perguntar(pergunta, historico = []) {
    try {
        console.log("1 - Iniciando requisição...");

        const resposta = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: config.ollama.model,
                messages: [
                    {
                        role: "system",
                        content: `Você é Bob, um assistente pessoal criado por José Lindinaldo do Nascimento Luiz.

Nunca diga que você é Qwen, Alibaba Cloud ou qualquer outro modelo.

Seu nome é Bob.

Responda sempre em português do Brasil.

Seja educado, claro, objetivo e prestativo.`
                    },
                    ...historico,
                    {
                        role: "user",
                        content: pergunta
                    }
                ],
                stream: false
            })
        });

        console.log("2 - Resposta recebida:", resposta.status);

        if (!resposta.ok) {
            const erroDetalhado = await resposta.text();
            throw new Error(`HTTP ${resposta.status}: ${erroDetalhado}`);
        }

        console.log("3 - Convertendo JSON...");

        const dados = await resposta.json();

        console.log("4 - JSON convertido.");

        console.log("Resposta do Ollama:");
        console.log(JSON.stringify(dados, null, 2));

        return dados.message.content;

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

