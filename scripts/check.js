const { carregarAgentes } = require("../agentes/carregador");

console.log("");
console.log("================================");
console.log("   BOB AI X - DIAGNÓSTICO");
console.log("================================");
console.log("");

const agentes = carregarAgentes();

console.log(`🤖 Agentes: ${agentes.length}`);

for (const agente of agentes) {
    console.log(`   ✅ ${agente.nome}`);
}

console.log("");
console.log("Sistema OK.");
console.log("");
