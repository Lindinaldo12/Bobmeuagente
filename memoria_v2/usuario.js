const fs = require("fs");
const path = require("path");

const pastaUsuarios = path.join(__dirname, "..", "memoria", "usuarios");

if (!fs.existsSync(pastaUsuarios)) {
    fs.mkdirSync(pastaUsuarios, { recursive: true });
}

function caminhoUsuario(id) {
    return path.join(pastaUsuarios, `${id}.json`);
}

function estruturaPadrao(id, nome = "") {
    return {
        id,
        nome,

        autorizado: false,
        administrador: false,
        bloqueado: false,

        criadoEm: new Date().toISOString(),
        ultimaAtividade: new Date().toISOString(),

        perfil: {
            nome: nome || "",
            cidade: "",
            estado: "",
            pais: "",
            profissao: "",
            projetos: [],
            objetivos: [],
            interesses: []
        },

        preferencias: {},

        historico: []
    };
}

function salvarUsuario(usuario) {
    fs.writeFileSync(
        caminhoUsuario(usuario.id),
        JSON.stringify(usuario, null, 2)
    );
}

function carregarUsuario(id, nome = "") {

    const arquivo = caminhoUsuario(id);

    let usuario;

    if (!fs.existsSync(arquivo)) {

        usuario = estruturaPadrao(id, nome);

    } else {

        usuario = JSON.parse(
            fs.readFileSync(arquivo, "utf8")
        );

        // Migração automática
        usuario.perfil ??= {};
        usuario.perfil.nome ??= usuario.nome || nome || "";
        usuario.perfil.cidade ??= "";
        usuario.perfil.estado ??= "";
        usuario.perfil.pais ??= "";
        usuario.perfil.profissao ??= "";
        usuario.perfil.projetos ??= [];
        usuario.perfil.objetivos ??= [];
        usuario.perfil.interesses ??= [];

        usuario.preferencias ??= {};
        usuario.historico ??= [];

        if (nome) {
            usuario.nome = nome;
        }

        usuario.ultimaAtividade = new Date().toISOString();
    }

    salvarUsuario(usuario);

    return usuario;
}

module.exports = {
    carregarUsuario,
    salvarUsuario
};

