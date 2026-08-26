require("dotenv").config();

const ALIASES = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN", "TG_TOKEN"];
for (const nome of ALIASES) {
  const valor = String(process.env[nome] || "").trim();
  if (valor) {
    process.env.TELEGRAM_BOT_TOKEN = valor;
    if (nome !== "TELEGRAM_BOT_TOKEN") console.log("🔁 Token encontrado via " + nome);
    break;
  }
}

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
    res.status(200).send(((config.app && config.app.nome) || "Bob AI X") + " online");
  });
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      nome: (config.app && config.app.nome) || "Bob AI X",
      versao: (config.app && config.app.versao) || "2.0.0",
      telegram: ENABLE_TELEGRAM && process.env.TELEGRAM_BOT_TOKEN ? "enabled" : "disabled",
      uptime: process.uptime()
    });
  });
  await new Promise((resolve) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log("🌐 HTTP pronto na porta " + PORT);
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
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!! TELEGRAM_BOT_TOKEN ausente no Render !!");
    console.error("!! MODO DEGRADADO: apenas HTTP ativo    !!");
    console.error("!! Configure em Render > Environment    !!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return null;
  }
  try {
    const bot = criarBot();
    bot.start({
      onStart: (info) => console.log("✅ Telegram conectado: @" + info.username)
    }).catch((e) => console.error("⚠️ Telegram parou (HTTP segue ativo): " + e.message));
    console.log("✅ Bot do Telegram + Kernel iniciados");
    return bot;
  } catch (e) {
    console.error("⚠️ Telegram nao iniciou (HTTP segue ativo): " + e.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Bob AI X iniciando...");
  console.log("📦 " + ((config.app && config.app.nome) || "Bob") + " v" + ((config.app && config.app.versao) || "2.0.0"));
  try {
    await inicializar();
  } catch (e) {
    console.log("⚠️ Alerta de Segurança (Ignorado por enquanto): " + e.message);
  }
  if (typeof ia.inicializar === "function") {
    await ia.inicializar();
  }
  await subirHttp();
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
