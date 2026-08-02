const config = require("../config/config");
const servicos = require("./servicos");

async function inicializar() {
    console.log("==================================");
    console.log(`${config.app.nome} v${config.app.versao}`);
    console.log("Bob Core");
    console.log("==================================");

    console.log("✅ Configuração carregada.");
    console.log("✅ Core inicializado.");

    console.log("");
    console.log("🔧 Verificando serviços...");
    await servicos.verificarOllama();
}

module.exports = {
    inicializar
};

