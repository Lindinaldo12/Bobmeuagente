const fs = require("fs");

const itens = [
    { nome: "Bot", caminho: "bot.js" },
    { nome: "Core", caminho: "core" },
    { nome: "IA", caminho: "ia" },
    { nome: "Agentes", caminho: "agentes" },
    { nome: "Planner", caminho: "planner" },
    { nome: "Conhecimento", caminho: "conhecimento" },
    { nome: "Memória", caminho: "memoria_v3" },
    { nome: "Ferramentas", caminho: "ferramentas" },
    { nome: "Dashboard", caminho: "dashboard" },
    { nome: "Plugins", caminho: "plugins" }
];

console.log("================================");
console.log(" HEALTH CHECK - BOB AI X");
console.log("================================");

let ok = 0;

for (const item of itens) {

    if (fs.existsSync(item.caminho)) {
        console.log("✅", item.nome);
        ok++;
    } else {
        console.log("❌", item.nome);
    }

}

console.log("--------------------------------");
console.log(`Saúde do projeto: ${ok}/${itens.length}`);
