require("dotenv").config();

const { Bot } = require("grammy");

// Verifica se o token foi configurado
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no arquivo .env");
  process.exit(1);
}

// Cria o bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Comando /start
bot.command("start", async (ctx) => {
  await ctx.reply(
`🤖 Olá!

Eu sou o Bob.

Bem-vindo ao Bob AI v2.0.0.

Estou sendo preparado para trabalhar com:
• IA (Ollama e Gemini)
• Memória
• Administração
• Plugins
• Segurança

🚀 Sistema iniciado com sucesso!`
  );
});

// Responde mensagens de texto
bot.on("message:text", async (ctx) => {
  await ctx.reply("Recebi sua mensagem. Em breve estarei conectado à IA.");
});

// Inicializa o bot
(async () => {
  console.log("=================================");
  console.log(" Bob AI v2.0.0");
  console.log("=================================");

  await bot.start();

  console.log("✅ Bot iniciado com sucesso.");
})();
