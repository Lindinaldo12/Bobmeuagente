const motor = require("../ia/motorDecisao");

function testar(pergunta, esperado) {

    const resultado = motor.decidir(pergunta);

    if (resultado.tipo === esperado) {
        console.log("✅ OK:", pergunta);
    } else {
        console.log("❌ ERRO:", pergunta);
        console.log("Esperado:", esperado);
        console.log("Recebido:", resultado.tipo);
    }
}

console.log("================================");
console.log("TESTE DO MOTOR DE DECISÃO");
console.log("================================");

testar("Qual é meu nome?", "perfil");
testar("Meu projeto é BobOS", "aprendizado");
testar("Conte uma história", "ia");
