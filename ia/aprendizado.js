const memoriaV4 = require("../memoria_v4/interface");
const memoriaInteligente = require("./memoriaInteligente");
const memoriaSemantica = require("./memoriaSemantica");
const contexto = require("./contexto");
const preferencias = require("./preferencias");
const PREFERENCIAS = require("./configPreferencias");

function processar(usuario, texto) {
    // --- NOME ---
    const regexNome = /(?:meu nome é|me chamo)\s+([a-zA-ZÀ-]+)/i;
    const matchNome = texto.trim().match(regexNome);

    if (matchNome) {
        let nome = matchNome[1]
            .replace(/[.,!?:;]/g, "")
            .trim();

        nome = nome
            .split(" ")
            .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join(" ");

        if (usuario) {
            usuario.perfil.nome = nome;
            memoriaV4.salvarUsuario(usuario);
        }

        return `Prazer em conhecê-lo, ${nome}! Guardei na memória.`;
    }

    // --- CIDADE ---
    const regexCidade = /(?:eu moro em|moro em)\s+(.+)/i;
    const matchCidade = texto.trim().match(regexCidade);

    if (matchCidade) {
        const cidade = matchCidade[1]
            .replace(/[.,!?:;]/g, "")
            .trim();

        if (cidade && usuario) {
            usuario.perfil.cidade = cidade;
            memoriaV4.salvarUsuario(usuario);

            return `Perfeito! Guardei que você mora em ${cidade}.`;
        }
    }

    // --- PROFISSÃO ---
    const regexProfissao = /(?:eu sou|trabalho como)\s+(.+)/i;
    const matchProfissao = texto.trim().match(regexProfissao);

    if (matchProfissao) {
        const profissao = matchProfissao[1]
            .replace(/[.,!?:;]/g, "")
            .trim();

        if (profissao && usuario) {
            usuario.perfil.profissao = profissao;
            memoriaV4.salvarUsuario(usuario);

            return `Entendido! Guardei que sua profissão é ${profissao}.`;
        }
    }

    // --- PROJETO ---
    const regexProjeto = /(?:meu projeto é|estou criando|estou desenvolvendo)\s+(.+)/i;
    const matchProjeto = texto.trim().match(regexProjeto);

    if (matchProjeto) {
        const projeto = matchProjeto[1]
            .replace(/[.,!?:;]/g, "")
            .trim();

        if (projeto && usuario) {
            const adicionou = memoriaInteligente.adicionar(
                usuario,
                "projetos",
                projeto
            );

            // ==========================================
            // ÚLTIMO PROJETO — MEMÓRIA V4 PERSISTENTE
            // ==========================================

            usuario.perfil.ultimoProjeto = projeto;

            memoriaV4.salvarUsuario(usuario);

            // Compatibilidade com o contexto temporário.
            contexto.definir(
                usuario.id,
                "ultimoProjeto",
                projeto
            );

            memoriaSemantica.adicionar(
                usuario.id,
                "projeto",
                projeto,
                [
                    "projeto",
                    "desenvolvimento",
                    "software"
                ]
            );

            if (adicionou) {
                return `Muito bom! Guardei que um dos seus projetos é ${projeto}.`;
            }

            return `Eu já sabia que ${projeto} é um dos seus projetos.`;
        }
    }

    // --- OBJETIVOS ---
    const regexObjetivo = /(?:meu objetivo é|quero|pretendo)\s+(.+)/i;
    const matchObjetivo = texto.trim().match(regexObjetivo);

    if (matchObjetivo) {
        const objetivo = matchObjetivo[1]
            .replace(/[.,!?:;]/g, "")
            .trim();

        if (objetivo && usuario) {
            const adicionou = memoriaInteligente.adicionar(
                usuario,
                "objetivos",
                objetivo
            );

            contexto.definir(usuario.id, "ultimoObjetivo", objetivo);

            if (adicionou) {
                return `Excelente! Guardei que um dos seus objetivos é ${objetivo}.`;
            }

            return `Eu já sabia que ${objetivo} é um dos seus objetivos.`;
        }
    }

    // --- PREFERÊNCIAS (GENÉRICO) ---
    for (const config of PREFERENCIAS) {
        const regex = new RegExp(
            config.aprender + "\\s+([^.,!?;]+)",
            "i"
        );

        const match = texto.match(regex);

        if (match && usuario) {
            const valor = match[1]
                .replace(/[.,!?:;]/g, "")
                .trim();

            preferencias.aprender(
                usuario,
                config.chave,
                valor
            );

            memoriaV4.salvarUsuario(usuario);

            return `Perfeito! Guardei que ${config.resposta.toLowerCase()} ${valor}.`;
        }
    }

    return null;
}

module.exports = {
    processar
};
