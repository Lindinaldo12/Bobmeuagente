require("dotenv").config();

const express = require("express");
const { criarBot } = require("./connect/telegram/telegram");
const { inicializar } = require("./core/inicializar");
const ia = require("./ia/gerenciador");
const config = require("./config/config");

const PORT = Number(process.env.PORT) || 3000;
const ENABLE_TELEGRAM = process.env.ENABLE_TELEGRAM !== "false";

async function subirHttp() {
  const app = express();

  app.get("/", (_req, res) => {
    res
      .status(200)
      .send(`${config.app?.nome || "Bob AI X"} online`);
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      nome: config.app?.nome || "Bob AI X",
      versao: config.app?.versao || "2.0.0",
      telegram: ENABLE_TELEGRAM ? "enabled" : "disabled",
      uptime: process.uptime()
    });
  });

  await new Promise((resolve) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🌐 HTTP pronto na porta ${PORT}`);
      resolve();
    });
  });
}

async function subirTelegram() {
  if (!ENABLE_TELEGRAM) {
    console.log("⏸️ Telegram desativado (ENABLE_TELEGRAM=false)");
    return null;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN ausente no ambiente");
  }

  const bot = criarBot();

  bot.start({
    onStart: (info) => {
      console.log(`✅ Telegram conectado: @${info.username}`);
    }
  });

  console.log("✅ Bot do Telegram + Kernel iniciados");
  return bot;
}

async function main() {
  console.log("🚀 Bob AI X iniciando...");
  console.log(`📦 ${config.app?.nome || "Bob"} v${config.app?.versao || "2.0.0"}`);

  // 1) Core (identidade / boot seguro)
  await inicializar();

  // 2) Gerenciador de IA (log de provedor/modelo)
  if (typeof ia.inicializar === "function") {
    await ia.inicializar();
  }

  // 3) HTTP (obrigatório para Web Service no Render)
  await subirHttp();

  // 4) Telegram real (Grammy + auth + web + kernel)
  await subirTelegram();

  console.log("✅ Bob AI X pronto");
}

main().catch((erro) => {
  console.error("❌ Erro fatal na inicialização:", erro);
  process.exit(1);
});

process.on("unhandledRejection", (erro) => {
  console.error("❌ Unhandled Rejection:", erro);
});

process.on("uncaughtException", (erro) => {
  console.error("❌ Uncaught Exception:", erro);
});
