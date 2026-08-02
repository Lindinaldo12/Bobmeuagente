const contexto = new Map();

function definir(usuarioId, chave, valor) {
    if (!contexto.has(usuarioId)) {
        contexto.set(usuarioId, {});
    }

    contexto.get(usuarioId)[chave] = valor;
}

function obter(usuarioId, chave) {
    if (!contexto.has(usuarioId)) {
        return null;
    }

    return contexto.get(usuarioId)[chave] || null;
}

function limpar(usuarioId) {
    contexto.delete(usuarioId);
}

function obterTudo(usuarioId) {
    if (!contexto.has(usuarioId)) {
        return {};
    }

    return contexto.get(usuarioId);
}

function ultimo(usuarioId) {
    const dados = obterTudo(usuarioId);
    const chaves = Object.keys(dados);

    if (chaves.length === 0) {
        return null;
    }

    const ultimaChave = chaves[chaves.length - 1];

    return {
        chave: ultimaChave,
        valor: dados[ultimaChave]
    };
}

module.exports = {
    definir,
    obter,
    obterTudo,
    ultimo,
    limpar
};
