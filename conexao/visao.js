"use strict";

// Envia a imagem + texto para o modelo de visão (OpenRouter)
async function baixarImagem(bot, fileId) {
  const file = await bot.api.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
  const resposta = await fetch(url);
  return Buffer.from(await resposta.arrayBuffer());
}

async function analisarImagem({ bot, fileId, texto, apiKey }) {
  const bytes = await baixarImagem(bot, fileId);
  const base64 = bytes.toString("base64");
  const mime = "image/jpeg";

  const corpo = {
    model: "google/gemini-2.0-flash-exp",
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

  const respostaIa = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(corpo),
  });

  const dados = await respostaIa.json();
  return dados.choices?.[0]?.message?.content || "Não consegui analisar a imagem.";
}

module.exports = { analisarImagem };
