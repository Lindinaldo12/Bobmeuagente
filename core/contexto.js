function criarContexto(dados) {

    return {

        texto: dados.texto,

        usuario: dados.usuario,

        historico: dados.historico,

        memoria: dados.memoria,

        ia: dados.ia,

        telegram: dados.telegram,

        data: new Date()

    };

}

module.exports = {
    criarContexto
};
