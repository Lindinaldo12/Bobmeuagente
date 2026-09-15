"use strict";
const { analisarImagem } = require("./visao");

// Ao receber imagem, analisa na hora e responde
async function analisarImagemRecebida({ bot, chatId, fileId, apiKey }) {
  try {
    await bot.sendMessage(chatId, "🔍 Analisando a imagem...");
    const descricao = await analisarImagem({
      bot,
      fileId,
      texto: "Descreva e analise esta imagem em detalhes.",
      apiKey,
    });
    await bot.sendMessage(chatId, `📋 Análise:\n\n${descricao}`);
  } catch (erro) {
    await bot.sendMessage(chatId, `❌ Erro ao analisar: ${erro.message}`);
  }
}

module.exports = { analisarImagemRecebida };
