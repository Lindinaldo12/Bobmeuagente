class Kernel {

    iniciar() {

        return {
            status: "online",
            versao: "3.0.0",
            modulos: []
        };

    }

}

module.exports = new Kernel();
