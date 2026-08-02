const contexto = require("./contexto");
const preferencias = require("./preferencias");
const PREFERENCIAS = require("./configPreferencias");
const conhecimento = require("./conhecimento");
const gerenciadorFerramentas = require("../ferramentas/gerenciador");

function responder(usuario, pergunta) {
    const texto = pergunta.toLowerCase();

    // Ficha pronta com tudo do usuário (impressa UMA vez na inicialização)
    const dados = conhecimento.listarPerfil(usuario);

    // --- RESUMO DO CONHECIMENTO ---
    if (
        texto.includes("o que você sabe sobre mim") ||
        texto.includes("o que voce sabe sobre mim") ||
        texto.includes("o que sabe sobre mim") ||
        texto.includes("o que você sabe de mim") ||
        texto.includes("o que voce sabe de mim")
    ) {
        return conhecimento.resumir(usuario);
    }

    // --- PREFERÊNCIAS (GENÉRICO) ---
    for (const config of PREFERENCIAS) {
        if (texto.includes(config.perguntar)) {
            const valor = preferencias.obter(
                usuario,
                config.chave
            );

            if (!valor) {
                return `Você ainda não me disse ${config.re}.`;
            }

            return `${config.resposta} ${valor}.`;
        }
    }

    // --- LISTAR FERRAMENTAS / AJUDA ---
    if (
        /quais ferramentas/i.test(texto) ||
        /liste.*ferramentas/i.test(texto) ||
        /que ferramentas/i.test(texto) ||
        /o que você sabe fazer/i.test(texto) ||
        /o que voce sabe fazer/i.test(texto) ||
        /como posso usar/i.test(texto)
    ) {

        return gerenciadorFerramentas.ajuda();

    }

    // --- NOME ---
    if (
        texto.includes("qual é o meu nome") ||
        texto.includes("qual e o meu nome") ||
        texto.includes("qual é meu nome") ||
        texto.includes("qual e meu nome") ||
        texto.includes("como eu me chamo")
    ) {
        const nome = dados.nome;

        if (nome) {
            return `Seu nome é ${nome}.`;
        }

        return "Você ainda não me disse o seu nome.";
    }

    // --- CIDADE ---
    if (
        texto.includes("onde eu moro") ||
        texto.includes("qual é minha cidade") ||
        texto.includes("qual e minha cidade") ||
        texto.includes("em que cidade eu moro")
    ) {
        const cidade = dados.cidade;

        if (cidade) {
            return `Você mora em ${cidade}.`;
        }

        return "Você ainda não me disse onde mora.";
    }

    // --- PROFISSÃO ---
    if (
        texto.includes("qual é minha profissão") ||
        texto.includes("qual e minha profissão") ||
        texto.includes("qual e minha profissao") ||
        texto.includes("o que eu faço") ||
        texto.includes("qual minha profissão")
    ) {
        const profissao = dados.profissao;

        if (profissao) {
            return `Sua profissão é ${profissao}.`;
        }

        return "Você ainda não me disse sua profissão.";
    }

    // --- PROJETOS ---
    if (
        texto.includes("qual é meu projeto") ||
        texto.includes("qual e meu projeto") ||
        texto.includes("quais são meus projetos") ||
        texto.includes("quais sao meus projetos")
    ) {
        const projetos = dados.projetos || [];

        if (projetos.length === 0) {
            return "Você ainda não me contou quais são seus projetos.";
        }

        if (projetos.length === 1) {
            return `Seu projeto é ${projetos[0]}.`;
        }

        return `Seus projetos são: ${projetos.join(", ")}.`;
    }

    // --- OBJETIVOS ---
    if (
        texto.includes("qual é meu objetivo") ||
        texto.includes("qual e meu objetivo") ||
        texto.includes("quais são meus objetivos") ||
        texto.includes("quais sao meus objetivos")
    ) {
        const objetivos = dados.objetivos || [];

        if (objetivos.length === 0) {
            return "Você ainda não me contou quais são seus objetivos.";
        }

        if (objetivos.length === 1) {
            return `Seu objetivo é ${objetivos[0]}.`;
        }

        return `Seus objetivos são: ${objetivos.join(", ")}.`;
    }

    // --- ÚLTIMO PROJETO MENCIONADO ---
    if (
        texto.includes("qual é esse projeto") ||
        texto.includes("que projeto é esse") ||
        texto === "esse projeto" ||
        texto === "ele"
    ) {
        const ultimoProjeto = contexto.obter(usuario.id, "ultimo_projeto");

        if (!ultimoProjeto) {
            return "Ainda não sei a qual projeto você está se referindo.";
        }

        return `Você está falando do projeto ${ultimoProjeto}.`;
    }

    // --- ÚLTIMO OBJETIVO MENCIONADO ---
    if (
        texto.includes("qual é meu objetivo") ||
        texto.includes("qual e meu objetivo")
    ) {
        const ultimoObjetivo = contexto.obter(usuario.id, "ultimo_objetivo");

        if (!ultimoObjetivo) {
            return "Você ainda não me contou qual é o seu objetivo.";
        }

        return `Seu objetivo mais recente é ${ultimoObjetivo}.`;
    }

    // --- ÚLTIMO CONTEXTO DA CONVERSA ---
    if (
        texto === "esse" ||
        texto === "isso" ||
        texto === "ele" ||
        texto === "ela"
    ) {
        const ultimo = contexto.ultimo(usuario.id);

        if (!ultimo) {
            return "Ainda não há contexto suficiente para saber do que você está falando.";
        }

        return `Você está se referindo a: ${ultimo.valor}.`;
    }

    return null;
}

module.exports = {
    responder
};
