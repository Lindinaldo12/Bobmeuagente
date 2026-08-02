function planejar(objetivo) {

    return {
        objetivo,

        status: "planejado",

        etapas: [
            "Entender o problema",
            "Escolher a melhor estratégia",
            "Executar",
            "Verificar o resultado"
        ]
    };

}

module.exports = {
    planejar
};
