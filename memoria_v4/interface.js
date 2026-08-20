const gerenciador = require("./gerenciador");

function carregarUsuario(id) {
    return gerenciador.carregar(String(id));
}

function salvarUsuario(usuario) {
    if (!usuario || usuario.id === undefined || usuario.id === null) {
        return false;
    }

    gerenciador.salvar(
        String(usuario.id),
        usuario
    );

    return true;
}

function adicionarHistorico(usuario, pergunta, resposta) {
    if (!usuario) return false;

    usuario.conversas ??= [];

    usuario.conversas.push({
        data: new Date().toISOString(),
        pergunta,
        resposta
    });

    if (usuario.conversas.length > 100) {
        usuario.conversas.shift();
    }

    return usuario;
}

function obterHistorico(usuario) {
    if (!usuario) return [];

    usuario.conversas ??= [];

    return usuario.conversas.flatMap(item => [
        {
            role: "user",
            content: item.pergunta
        },
        {
            role: "assistant",
            content: item.resposta
        }
    ]);
}

function adicionarFato(usuario, fato) {
    if (!usuario || !fato) return false;

    usuario.conhecimentos ??= [];

    if (!usuario.conhecimentos.includes(fato)) {
        usuario.conhecimentos.push(fato);
        return true;
    }

    return false;
}

function lerFatos(usuario) {
    if (!usuario) return [];

    return Array.isArray(usuario.conhecimentos)
        ? usuario.conhecimentos
        : [];
}

module.exports = {
    carregarUsuario,
    salvarUsuario,
    adicionarHistorico,
    obterHistorico,
    adicionarFato,
    lerFatos
};
