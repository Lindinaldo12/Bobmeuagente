const fs = require("fs");
const path = require("path");

// Cache para evitar recarregar agentes toda vez
let agentesCache = null;

// ✅ NOVO: Cache individual para cada agente
const cacheIndividual = {};

function carregarAgentes() {
    // Se já tem no cache, retorna direto (mais rápido!)
    if (agentesCache) {
        return agentesCache;
    }

    const agentes = [];
    const pastas = fs.readdirSync(__dirname);

    for (const pasta of pastas) {
        const diretorio = path.join(__dirname, pasta);

        if (!fs.statSync(diretorio).isDirectory()) {
            continue;
        }

        const manifest = path.join(diretorio, "manifest.json");
        const plugin = path.join(diretorio, "plugin.js");
        const prompt = path.join(diretorio, "prompt.txt");
        const ferramentas = path.join(diretorio, "ferramentas.json");

        if (
            fs.existsSync(manifest) &&
            fs.existsSync(plugin)
        ) {
            const info = JSON.parse(
                fs.readFileSync(manifest, "utf8")
            );

            agentes.push({
                ...info,
                prompt: fs.existsSync(prompt)
                    ? fs.readFileSync(prompt, "utf8")
                    : "",
                ferramentas: fs.existsSync(ferramentas)
                    ? JSON.parse(
                        fs.readFileSync(ferramentas, "utf8")
                      )
                    : [],
                executar: require(plugin).executar
            });

            // Log de carregamento
            console.log(
                `✅ Agente carregado: ${info.nome} v${info.versao}`
            );
        }
    }

    console.log("");
    console.log(
        `🤖 Total de agentes carregados: ${agentes.length}`
    );
    console.log("");

    // Salva no cache antes de retornar
    agentesCache = agentes;
    return agentesCache;
}

// ✅ FUNÇÃO OTIMIZADA COM CACHE: Carrega um agente específico por nome
function carregarAgente(nome) {
    // ✅ MODIFICAÇÃO APLICADA: Normaliza o nome
    nome = nome.toLowerCase().trim();

    // ✅ Verifica se já está no cache individual
    if (cacheIndividual[nome]) {
        return cacheIndividual[nome];
    }

    const diretorio = path.join(__dirname, nome);

    const manifest = path.join(diretorio, "manifest.json");
    const plugin = path.join(diretorio, "plugin.js");
    const prompt = path.join(diretorio, "prompt.txt");
    const ferramentas = path.join(diretorio, "ferramentas.json");

    if (
        !fs.existsSync(manifest) ||
        !fs.existsSync(plugin)
    ) {
        return null;
    }

    const info = JSON.parse(
        fs.readFileSync(manifest, "utf8")
    );

    // ✅ Cria o objeto agente
    const agente = {
        ...info,
        prompt: fs.existsSync(prompt)
            ? fs.readFileSync(prompt, "utf8")
            : "",
        ferramentas: fs.existsSync(ferramentas)
            ? JSON.parse(
                fs.readFileSync(ferramentas, "utf8")
              )
            : [],
        executar: require(plugin).executar
    };

    // ✅ Salva no cache individual
    cacheIndividual[nome] = agente;

    console.log(`✅ Agente carregado sob demanda: ${agente.nome}`);

    return agente;
}

module.exports = {
    carregarAgentes,
    carregarAgente
};
