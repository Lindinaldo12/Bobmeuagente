"use strict";
const { analisarImagem } = require("./visao");

// Guarda o último arquivo/imagem recebido por usuário
const ultimoArquivo = new Map();

function guardarArquivo(chatId, tipo, fileId) {
  ultimoArquivo.set(chatId, { tipo, fileId });
}

function pegarArquivo(chatId) {
  return ultimoArquivo.get(chatId);
}

// Responde o resumo da imagem
async function responderResumo({ bot, chatId, texto, apiKey }) {
  const arquivo = pegarArquivo(chatId);
  if (!arquivo) {
    await bot.sendMessage(chatId, "Envie uma imagem primeiro. 📷");
    return;
  }
  if (arquivo.tipo !== "imagem") {
    await bot.sendMessage(chatId, "Isso não é uma imagem. Envie uma foto. 📷");
    return;
  }
  const descricao = await analisarImagem({
    bot,
    fileId: arquivo.fileId,
    texto,
    apiKey,
  });
  await bot.sendMessage(chatId, `Resumo:\n\n${descricao}`);
}

module.exports = { guardarArquivo, responderResumo };
