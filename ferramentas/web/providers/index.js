const duckduckgo = require("./duckduckgo");
const wikipedia = require("./wikipedia");

const providers = [
    wikipedia,
    duckduckgo
];

async function pesquisar(texto) {

    for (const provider of providers) {

        const resposta = await provider.pesquisar(texto);

        if (resposta) {
            return resposta;
        }
    }

    return {
        erro: "Nenhum provider disponível."
    };
}

function listar() {

    return providers.map(p => p.nome);
}

module.exports = {
    pesquisar,
    listar
};
