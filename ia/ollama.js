const memoriaLongoPrazo = require("../memoria/longoPrazo");
const config = require("../config/config");
const systemPrompt = require("../core/systemPrompt");

async function conectar() {
    try {
        const resposta = await fetch("http://127.0.0.1:11434/api/tags", {
            signal: AbortSignal.timeout(3000)
        });

        if (!resposta.ok) {
            throw new Error("Servidor Ollama indisponível.");
        }

        console.log("✅ Ollama conectada.");
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
        console.log("URL:", "http://127.0.0.1:11434/api/chat");
        console.log("Modelo:", config.ollama.model);
        console.log("Enviando requisição...");

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
                        content: systemPrompt
                    },
                    ...(Array.isArray(historico) ? historico.slice(-10) : []),
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

// NOVA FUNÇÃO: perguntarEspecialista
async function perguntarEspecialista(prompt, pergunta, historico = []) {
    try {
        console.log("1 - Iniciando requisição do especialista...");
        console.log("URL:", "http://127.0.0.1:11434/api/chat");
        console.log("Modelo:", config.ollama.model);
        
        // ✅ CRIA O PAYLOAD EXPLÍCITO
        const payload = {
            model: config.ollama.model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt + "\n\n" + prompt
                  + (usuario ? (memoriaLongoPrazo.lerFatos(usuario.id).length > 0 ? "\n\n🧠 MEMÓRIA SOBRE O USUÁRIO:\n- " + memoriaLongoPrazo.lerFatos(usuario.id).join("\n- ") : "") : "")
                },
                ...(Array.isArray(historico) ? historico.slice(-10) : []),
                {
                    role: "user",
                    content: pergunta
                }
            ],
            stream: false
        };

        // ✅ LOG DO PAYLOAD PARA DEBUG
        console.log("===== PAYLOAD OLLAMA =====");
        console.dir(payload, { depth: null });
        console.log("==========================");

        console.log("Enviando requisição...");

        const resposta = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            throw new Error(await resposta.text());
        }

        const dados = await resposta.json();

        return dados.message.content;

    } catch (erro) {
        console.log("Erro especialista:");
        console.log(erro.message);

        return "Erro ao consultar o especialista.";
    }
}

module.exports = {
    conectar,
    perguntar,
    perguntarEspecialista
};
