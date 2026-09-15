"use strict";

// Módulo de visão: envia a imagem + texto para o modelo que enxerga
const axios = require("axios");

async function baixarImagem(bot, fileId) {
  // 1. Pega o caminho do arquivo no Telegram
  const file = await bot.api.getFile(fileId);
  // 2. `file.file_path` vem do Telegram, não é inventado
  const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
  // 3. Baixa os bytes
  const resposta = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(resposta.data);
}

async function analisarImagem({ bot, fileId, texto, apiKey }) {
  const bytes = await baixarImagem(bot, fileId);
  const base64 = bytes.toString("base64");
  const mime = "image/jpeg"; // Telegram envia fotos como JPEG

  const corpo = {
    model: "google/gemini-2.0-flash-exp", // modelo com visão
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: texto || "Descreva o que está na imagem." },
          { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      },
    ],
  };

  const respostaIa = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    corpo,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  return respostaIa.data.choices?.[0]?.message?.content || "Não consegui analisar a imagem.";
}

module.exports = { analisarImagem };
