function adicionarItem(lista, valor) {
    if (!valor) return;

    valor = valor.trim();

    if (!lista.includes(valor)) {
        lista.push(valor);
    }
}

function atualizarPerfil(usuario, campo, valor) {

    if (!usuario.perfil) {
        usuario.perfil = {};
    }

    switch (campo) {

        case "nome":
            usuario.perfil.nome = valor;
            break;

        case "cidade":
            usuario.perfil.cidade = valor;
            break;

        case "estado":
            usuario.perfil.estado = valor;
            break;

        case "pais":
            usuario.perfil.pais = valor;
            break;

        case "profissao":
            usuario.perfil.profissao = valor;
            break;

        case "projeto":
            usuario.perfil.projetos ??= [];
            const projeto = valor ? valor.trim() : "";
            if (projeto && !usuario.perfil.projetos.includes(projeto)) {
                usuario.perfil.projetos.push(projeto);
            }
            break;

        case "objetivo":
            usuario.perfil.objetivos ??= [];
            adicionarItem(usuario.perfil.objetivos, valor);
            break;

        case "interesse":
            usuario.perfil.interesses ??= [];
            adicionarItem(usuario.perfil.interesses, valor);
            break;
    }

    return usuario;
}

module.exports = {
    atualizarPerfil
};

