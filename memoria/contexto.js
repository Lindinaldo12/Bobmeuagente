const memoria = new Map();

function salvar(usuario, contexto) {
    memoria.set(usuario, {
        pergunta: contexto.pergunta,
        resposta: contexto.resposta,
        data: Date.now()
    });
}

function obter(usuario) {
    return memoria.get(usuario) || null;
}

function limpar(usuario) {
    memoria.delete(usuario);
}

module.exports = {
    salvar,
    obter,
    limpar
};
