const config = require("../config/config");
const servicos = require("./servicos");
const auth = require("./auth");

async function validarIdentidadeCentralNoBoot() {
    const identidade =
        auth.obterIdentidadeCentral();

    if (!identidade) {
        throw new Error(
            "BOOT BLOQUEADO: Identidade Central não encontrada."
        );
    }

    if (identidade.tipo !== "criador") {
        throw new Error(
            "BOOT BLOQUEADO: tipo da Identidade Central inválido."
        );
    }

    if (identidade.permanente !== true) {
        throw new Error(
            "BOOT BLOQUEADO: Identidade Central não está permanente."
        );
    }

    const integridade =
        auth.verificarIntegridadeAssinaturaIdentidadeCentral();

    if (integridade.valido !== true) {
        throw new Error(
            "BOOT BLOQUEADO: integridade criptográfica inválida."
        );
    }

    console.log("✅ Identidade Central validada no boot.");
    console.log("✅ Tipo CRIADOR confirmado.");
    console.log("✅ Permanência confirmada.");
    console.log("✅ Integridade criptográfica confirmada.");
}

async function inicializar() {
    await validarIdentidadeCentralNoBoot();

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

