const sessoes = new Map();

function iniciar(userId) {
    sessoes.set(String(userId), {
        aguardandoSenha: true
    });
}

function aguardandoSenha(userId) {
    const sessao = sessoes.get(String(userId));
    return sessao ? sessao.aguardandoSenha : false;
}

function finalizar(userId) {
    sessoes.delete(String(userId));
}

module.exports = {
    iniciar,
    aguardandoSenha,
    finalizar
};
