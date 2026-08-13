const fs = require("fs");
const path = require("path");

async function chamarAPI(pergunta, contextoUsuario = {}) {
    console.log("🌐 Conectando à OpenRouter...");

    const apiKey = String(process.env.API_KEY || "").trim();

    const modelo =
        process.env.MODEL_NAME ||
        "qwen/qwen-2.5-7b-instruct";

    const url =
        process.env.API_URL ||
        "https://openrouter.ai/api/v1";

    if (!apiKey || apiKey.length < 20) {
        return "Erro: API_KEY inválida ou ausente no .env";
    }

    let regrasPersonais = "";

    const pathPersonalidade = path.join(
        __dirname,
        "../config/personalidade.txt"
    );

    if (fs.existsSync(pathPersonalidade)) {
        regrasPersonais =
            "\n\nREGRAS DO SISTEMA DO BOB:\n" +
            fs.readFileSync(
                pathPersonalidade,
                "utf8"
            );
    }

    const messages = [
        {
            role: "system",
            content:
                "Você é o Bob AI X." +
                regrasPersonais
        }
    ];

    if (
        contextoUsuario?.dadosWeb &&
        String(contextoUsuario.dadosWeb).trim()
    ) {
        messages.push({
            role: "system",
            content:
                "DADOS ATUALIZADOS DA INTERNET:\n\n" +
                String(contextoUsuario.dadosWeb) +
                "\n\n" +
                "Use esses dados como fonte principal. " +
                "Não invente informações. " +
                "Responda em português do Brasil."
        });
    }

    if (
        Array.isArray(contextoUsuario?.historico)
    ) {
        for (
            const msg of contextoUsuario.historico.slice(-4)
        ) {

            if (msg.role && msg.content) {

                messages.push({
                    role: msg.role,
                    content: String(msg.content)
                });

            } else if (
                msg.pergunta &&
                msg.resposta
            ) {

                messages.push({
                    role: "user",
                    content: String(msg.pergunta)
                });

                messages.push({
                    role: "assistant",
                    content: String(msg.resposta)
                });
            }
        }
    }

    messages.push({
        role: "user",
        content: String(pergunta || "")
    });

    try {

        console.log("📡 Enviando requisição para OpenRouter...");
        console.log("🧠 Modelo:", modelo);

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            30000
        );

        const response = await fetch(
            url + "/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "HTTP-Referer":
                        "https://github.com/Lindinaldo12/Bobmeuagente",
                    "X-Title": "Bob AI X"
                },

                body: JSON.stringify({
                    model: modelo,
                    messages,
                    temperature: 0.3,
                    max_tokens: 1000
                }),

                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        console.log(
            "📡 HTTP:",
            response.status,
            response.statusText
        );

        const textoResposta =
            await response.text();

        if (!textoResposta) {
            return "Erro na IA: OpenRouter retornou resposta vazia.";
        }

        let data;

        try {
            data = JSON.parse(textoResposta);
        } catch {
            console.error(
                "❌ Resposta não-JSON:",
                textoResposta.substring(0, 500)
            );

            return "Erro na IA: resposta inválida da OpenRouter.";
        }

        if (!response.ok) {

            console.error(
                "❌ Erro OpenRouter:",
                JSON.stringify(data, null, 2)
            );

            return (
                "Erro na IA: " +
                (
                    data?.error?.message ||
                    `HTTP ${response.status}`
                )
            );
        }

        const resposta =
            data?.choices?.[0]?.message?.content;

        if (!resposta) {
            console.error(
                "❌ Resposta inesperada:",
                JSON.stringify(data, null, 2)
            );

            return "Erro na IA: nenhuma resposta recebida.";
        }

        console.log(
            "✅ OpenRouter respondeu corretamente."
        );

        return resposta.trim();

    } catch (erro) {

        console.error(
            "❌ Erro de conexão OpenRouter:",
            erro.message
        );

        if (erro.name === "AbortError") {
            return "Erro na IA: tempo limite excedido.";
        }

        return (
            "Problema de conexão com a OpenRouter: " +
            erro.message
        );
    }
}

module.exports = {
    chamarAPI
};
