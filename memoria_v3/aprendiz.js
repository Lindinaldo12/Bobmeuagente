function aprender(memoria, texto) {

    const t = texto.toLowerCase();

    if (t.includes("meu nome é")) {

        memoria.perfil.nome =
            texto.split("meu nome é")[1].trim();

    }

    if (t.includes("eu moro em")) {

        memoria.perfil.cidade =
            texto.split("eu moro em")[1].trim();

    }

    if (t.includes("estou desenvolvendo")) {

        memoria.projetos.push(
            texto.split("estou desenvolvendo")[1].trim()
        );

    }

    return memoria;

}

module.exports = {
    aprender
};
