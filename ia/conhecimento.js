const preferencias = require("./preferencias");

function resumir(usuario) {

    if (!usuario) {
        return "Ainda não conheço você.";
    }

    const linhas = [];

    if (usuario.perfil.nome)
        linhas.push(`Nome: ${usuario.perfil.nome}`);

    if (usuario.perfil.cidade)
        linhas.push(`Cidade: ${usuario.perfil.cidade}`);

    if (usuario.perfil.profissao)
        linhas.push(`Profissão: ${usuario.perfil.profissao}`);

    if (usuario.perfil.projetos?.length)
        linhas.push(
            `Projetos: ${usuario.perfil.projetos.join(", ")}`
        );

    if (usuario.perfil.objetivos?.length)
        linhas.push(
            `Objetivos: ${usuario.perfil.objetivos.join(", ")}`
        );

    const filme = preferencias.obter(
        usuario,
        "filmeFavorito"
    );

    if (filme) {
        linhas.push(`Filme favorito: ${filme}`);
    }

    if (linhas.length === 0) {
        return "Ainda não sei quase nada sobre você.";
    }

    return linhas.join("\n");
}

function listarPerfil(usuario) {

    if (!usuario) {
        return {};
    }

    return {
        nome: usuario.perfil.nome,
        cidade: usuario.perfil.cidade,
        profissao: usuario.perfil.profissao,
        projetos: usuario.perfil.projetos,
        objetivos: usuario.perfil.objetivos,
        preferencias: usuario.preferencias || {}
    };
}

module.exports = {
    resumir,
    listarPerfil
};
