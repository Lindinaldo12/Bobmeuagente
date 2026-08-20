const memoriaV4 = require("../memoria_v4/interface");

function adicionar(usuario, campo, valor) {

    if (!usuario || !campo || !valor) {
        return false;
    }

    if (!Array.isArray(usuario.perfil[campo])) {
        usuario.perfil[campo] = [];
    }

    if (!usuario.perfil[campo].includes(valor)) {
        usuario.perfil[campo].push(valor);
        memoriaV4.salvarUsuario(usuario);
        return true;
    }

    return false;
}

module.exports = {
    adicionar
};
