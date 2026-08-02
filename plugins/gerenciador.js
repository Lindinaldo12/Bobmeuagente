const { carregarPlugins } = require("./carregador");

function listar() {

    return carregarPlugins().map(plugin => ({
        nome: plugin.nome,
        versao: plugin.versao,
        autor: plugin.autor,
        descricao: plugin.descricao,
        categoria: plugin.categoria
    }));

}

function ajuda() {

    const plugins = listar();

    if (plugins.length === 0) {
        return "Nenhum plugin instalado.";
    }

    let resposta = "🔌 Plugins instalados:\n\n";

    for (const plugin of plugins) {

        resposta += `📦 ${plugin.nome}\n`;
        resposta += `   Categoria: ${plugin.categoria}\n`;
        resposta += `   Versão: ${plugin.versao}\n`;
        resposta += `   ${plugin.descricao}\n\n`;

    }

    return resposta;

}

module.exports = {
    listar,
    ajuda
};
