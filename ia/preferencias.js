function aprender(usuario, chave, valor) {

    if (!usuario.preferencias) {
        usuario.preferencias = {};
    }

    usuario.preferencias[chave] = valor;

    return true;
}

function obter(usuario, chave) {

    if (!usuario?.preferencias) {
        return null;
    }

    return usuario.preferencias[chave] || null;
}

module.exports = {
    aprender,
    obter
};
