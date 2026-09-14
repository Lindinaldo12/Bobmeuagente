const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "..", "dados", "perfis");
const LIMITE_PREFS = 30;

function caminhoPerfil(idUsuario) {
    return path.join(DIR, `perfil_${idUsuario}.json`);
}

function garantir() {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function carregar(idUsuario) {
    garantir();
    const caminho = caminhoPerfil(idUsuario);
    try {
        return JSON.parse(fs.readFileSync(caminho, "utf-8"));
    } catch {
        return {
            id: idUsuario,
            preferencias: [],
            fatos: [],
            criadoEm: new Date().toISOString()
        };
    }
}

function salvar(perfil) {
    garantir();
    fs.writeFileSync(caminhoPerfil(perfil.id), JSON.stringify(perfil, null, 2));
}

function adicionarPreferencia(idUsuario, preferencia) {
    const perfil = carregar(idUsuario);
    const existe = perfil.preferencias?.some(
        (p) => p.tipo === preferencia.tipo && p.valor.toLowerCase() === preferencia.valor.toLowerCase()
    );
    if (!existe) {
        perfil.preferencias.push({ ...preferencia, aprendidoEm: new Date().toISOString() });
        while (perfil.preferencias.length > LIMITE_PREFS) perfil.preferencias.shift();
        salvar(perfil);
    }
    return perfil;
}

function atualizarPreferencias(usuarioMemoria, texto) {
    if (!usuarioMemoria?.id) return;
    const perfil = carregar(usuarioMemoria.id);
    perfil.ultimoTexto = String(texto || "").slice(0, 2000);
    salvar(perfil);
    return perfil;
}

function montarContextoPerfil(idUsuario) {
    const perfil = carregar(idUsuario);
    const partes = [];
    if (perfil.preferencias?.length) {
        partes.push("PREFERÊNCIAS DO USUÁRIO:\n" +
            perfil.preferencias.map((p) => `- [${p.tipo}] ${p.valor}`).join("\n"));
    }
    if (perfil.fatos?.length) {
        partes.push("FATOS SOBRE O USUÁRIO:\n" + perfil.fatos.join("\n"));
    }
    return partes.join("\n\n");
}

module.exports = {
    carregar,
    salvar,
    adicionarPreferencia,
    atualizarPreferencias,
    montarContextoPerfil
};
