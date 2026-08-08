function adicionarHistorico(usuario, pergunta, resposta) {
    usuario.historico ??= [];

    usuario.historico.push({
        data: new Date().toISOString(),
        pergunta,
        resposta
    });

    if (usuario.historico.length > 30) {
        usuario.historico.shift();
    }

    return usuario;
}

function obterHistorico(usuario) {
    usuario.historico ??= [];

    return usuario.historico.flatMap(item => [
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

module.exports = {
    adicionarHistorico,
    obterHistorico
};
