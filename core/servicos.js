const { spawn } = require("child_process");

/**
 * Tenta fazer uma requisição para a API do Ollama.
 */
async function ollamaEstaRodando() {
    try {
        const response = await fetch("http://127.0.0.1:11434/api/tags", {
            signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Função utilitária para aguardar N milissegundos.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verificarEOterOllama() {
    if (await ollamaEstaRodando()) {
        console.log("✅ Ollama já está em execução.");
        return true;
    }

    console.log("⚠️ Ollama não está rodando.");
    console.log("🚀 Tentando iniciar o Ollama em segundo plano...");

    // Inicia o processo de forma desvinculada (detached)
    const processo = spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore"
    });

    // Permite que o Node.js encerre sem esperar pelo Ollama
    processo.unref();

    // Aguarda até 10 segundos para confirmar se o servidor subiu
    for (let i = 0; i < 10; i++) {
        await sleep(1000);
        if (await ollamaEstaRodando()) {
            console.log("✅ Ollama foi iniciado com sucesso.");
            return true;
        }
    }

    console.log("❌ Não foi possível verificar a inicialização do Ollama.");
    return false;
}

module.exports = {
    verificarOllama: verificarEOterOllama
};
