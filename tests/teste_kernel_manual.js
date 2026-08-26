// Teste manual do Kernel — sem Telegram, sem webhook
require("dotenv").config();
const kernel = require("../kernel/kernel");

async function main() {
  const pergunta = process.argv.slice(2).join(" ") || "Quem é você? Resuma o que você sabe fazer.";
  const usuarioId = String(process.env.MASTER_ID || "").trim();

  if (!usuarioId) {
    console.error("❌ MASTER_ID não encontrado no .env");
    process.exit(1);
  }

  console.log("🧪 Testando o Kernel com a pergunta:", pergunta, "\n");

  const resposta = await kernel.executar({
    texto: pergunta,
    textoOriginal: pergunta,
    usuario: { id: usuarioId },
    usuarioId,
    origem: "teste-termux",
    web: false,
    dadosWeb: ""
  });

  console.log("\n========== RESPOSTA DO BOB ==========");
  console.log(typeof resposta === "string" ? resposta : JSON.stringify(resposta, null, 2));
  console.log("=====================================\n");
  process.exit(0);
}

main().catch(erro => {
  console.error("❌ ERRO NO TESTE:", erro);
  process.exit(1);
});
