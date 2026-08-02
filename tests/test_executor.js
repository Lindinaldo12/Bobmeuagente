const executor = require("../ia/executor");

const perfil = {
    responder: () => "Perfil OK"
};

const aprendizado = {
    processar: () => "Aprendizado OK"
};

const ia = {
    perguntar: async () => "IA OK"
};

async function executarTeste(tipo) {

    const resposta = await executor.executar(
        { tipo },
        {
            texto: "",
            usuario: {},
            historico: [],
            perfil,
            aprendizado,
            ia
        }
    );

    console.log(`✅ ${tipo}: ${resposta}`);
}

(async () => {

    console.log("==============================");
    console.log("TESTE DO EXECUTOR");
    console.log("==============================");

    await executarTeste("perfil");
    await executarTeste("aprendizado");
    await executarTeste("ia");

})();
