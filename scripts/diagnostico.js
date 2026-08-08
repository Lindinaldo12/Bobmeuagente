const fs = require("fs");

const verificacoes = [
    "package.json",
    ".env",
    "bot.js",
    "ia/gerenciador.js",
    "orquestrador/orquestrador.js",
    "planner/planner.js",
    "planner/executor.js",
    "conhecimento/motor.js",
    "registro/registro.js"
];

console.log("==================================");
console.log(" DIAGNÓSTICO DO BOB AI X");
console.log("==================================");

let erros = 0;

for (const arquivo of verificacoes) {

    if (fs.existsSync(arquivo)) {
        console.log("✅", arquivo);
    } else {
        console.log("❌", arquivo);
        erros++;
    }

}

console.log("----------------------------------");

if (erros === 0) {
    console.log("✅ Sistema íntegro.");
} else {
    console.log(`❌ ${erros} problema(s) encontrado(s).`);
}
