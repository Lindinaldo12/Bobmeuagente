const config = require("../config/config");

function inicializar() {
    console.log("==================================");
    console.log(`${config.app.nome} v${config.app.versao}`);
    console.log("Bob Core");
    console.log("==================================");

    console.log("✅ Configuração carregada.");
    console.log("✅ Core inicializado.");
}

module.exports = {
    inicializar
};
