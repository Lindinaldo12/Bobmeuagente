function criar(nome) {

    return {

        nome,

        status: "Planejamento",

        progresso: 0,

        etapas: [

            {
                nome: "Levantar requisitos",
                concluido: false
            },

            {
                nome: "Criar arquitetura",
                concluido: false
            },

            {
                nome: "Desenvolver",
                concluido: false
            },

            {
                nome: "Testar",
                concluido: false
            },

            {
                nome: "Publicar",
                concluido: false
            }

        ]

    };

}

module.exports = {
    criar
};
