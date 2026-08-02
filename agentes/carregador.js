const fs = require("fs");
const path = require("path");

function carregarAgentes() {

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

    return agentes;
}

module.exports = {
    carregarAgentes
};
