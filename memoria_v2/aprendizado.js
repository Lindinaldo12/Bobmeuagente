const { atualizarPerfil } = require("./perfil");

function aprender(usuario, mensagem) {

    const texto = mensagem.toLowerCase();

    if (texto.includes("meu nome é")) {
        atualizarPerfil(
            usuario,
            "nome",
            mensagem.split(/meu nome é/i)[1].trim()
        );
    }

    if (texto.includes("moro em")) {
        atualizarPerfil(
            usuario,
            "cidade",
            mensagem.split(/moro em/i)[1].trim()
        );
    }

    if (texto.includes("trabalho como")) {
        atualizarPerfil(
            usuario,
            "profissao",
            mensagem.split(/trabalho como/i)[1].trim()
        );
    }

    if (texto.includes("meu projeto é")) {
        atualizarPerfil(
            usuario,
            "projeto",
            mensagem.split(/meu projeto é/i)[1].trim()
        );
    }

    if (texto.includes("meu objetivo é")) {
        atualizarPerfil(
            usuario,
            "objetivo",
            mensagem.split(/meu objetivo é/i)[1].trim()
        );
    }

    if (texto.includes("gosto de")) {
        atualizarPerfil(
            usuario,
            "interesse",
            mensagem.split(/gosto de/i)[1].trim()
        );
    }

    return usuario;
}

module.exports = {
    aprender
};
