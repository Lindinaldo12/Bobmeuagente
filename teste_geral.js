const registro = require("./registro/registro");
const planner = require("./planner/planner");
const conhecimento = require("./conhecimento/motor");

console.log("================================");
console.log(" TESTE GERAL DO BOB AI X");
console.log("================================");

console.log("\nAgentes:");
console.log(registro.listarCapacidades());

console.log("\nPlano:");
console.log(
    planner.criarPlano("Crie uma API em Node.js")
);

console.log("\nConhecimento:");
console.log(
    conhecimento.buscar("node")
);

console.log("\n✅ Teste concluído.");
