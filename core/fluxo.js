function criarFluxo(contexto) {

    return {

        usuario: contexto.usuario,

        texto: contexto.texto,

        memoria: null,

        perfil: null,

        ferramenta: null,

        plugin: null,

        agente: null,

        projeto: null,

        plano: null,

        resposta: null

    };

}

module.exports = {
    criarFluxo
};
