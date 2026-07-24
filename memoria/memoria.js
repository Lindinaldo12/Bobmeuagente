const fs = require("fs");
const path = require("path");

const pastaUsuarios = path.join(__dirname, "usuarios");

if (!fs.existsSync(pastaUsuarios)) {
    fs.mkdirSync(pastaUsuarios, { recursive: true });
}

function caminhoUsuario(id) {
    return path.join(pastaUsuarios, `${id}.json`);
}

function criarUsuario(id, nome = "") {
    const usuario = {
        id,
        nome,

        autorizado: false,
        administrador: false,
        bloqueado: false,

        criadoEm: new Date().toISOString(),
        ultimaAtividade: new Date().toISOString(),

        preferencias: {},

        historico: []
    };

    salvarUsuario(usuario);

    return usuario;
}

function carregarUsuario(id, nome = "") {

    const arquivo = caminhoUsuario(id);

    if (!fs.existsSync(arquivo)) {
        return criarUsuario(id, nome);
    }

    const usuario = JSON.parse(
        fs.readFileSync(arquivo, "utf8")
    );

    if (nome && usuario.nome !== nome) {
        usuario.nome = nome;
    }

    usuario.ultimaAtividade = new Date().toISOString();

    salvarUsuario(usuario);

    return usuario;
}

function salvarUsuario(usuario) {

    fs.writeFileSync(
        caminhoUsuario(usuario.id),
        JSON.stringify(usuario, null, 2)
    );

    return true;
}

function adicionarHistorico(id, pergunta, resposta) {

    const usuario = carregarUsuario(id);

    usuario.historico.push({
        data: new Date().toISOString(),
        pergunta,
        resposta
    });

    if (usuario.historico.length > 30) {
        usuario.historico.shift();
    }

    salvarUsuario(usuario);
}

function obterHistorico(id) {

    const usuario = carregarUsuario(id);

    return usuario.historico;
}

function listarUsuarios() {

    return fs.readdirSync(pastaUsuarios)
        .filter(a => a.endsWith(".json"))
        .map(a => JSON.parse(
            fs.readFileSync(path.join(pastaUsuarios, a), "utf8")
        ));
}

module.exports = {

    carregarUsuario,

    salvarUsuario,

    adicionarHistorico,

    obterHistorico,

    listarUsuarios

};
