const fs = require("fs");
const path = require("path");

function carregarPlugins() {

    const plugins = [];

    const diretorio = __dirname;

    const pastas = fs.readdirSync(diretorio);

    for (const pasta of pastas) {

        const caminho = path.join(diretorio, pasta);

        if (!fs.statSync(caminho).isDirectory()) {
            continue;
        }

        const manifest = path.join(caminho, "manifest.json");
        const plugin = path.join(caminho, "plugin.js");

        if (
            fs.existsSync(manifest) &&
            fs.existsSync(plugin)
        ) {

            const info = JSON.parse(
                fs.readFileSync(manifest, "utf8")
            );

            const modulo = require(plugin);

            plugins.push({
                ...info,
                executar: modulo.executar
            });

        }

    }

    return plugins;

}

module.exports = {
    carregarPlugins
};
