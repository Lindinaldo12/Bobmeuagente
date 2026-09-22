"use strict";
const { analisarImagem } = require("./visao");

// Ao receber imagem, analisa na hora e responde
async function analisarImagemRecebida({ bot, chatId, fileId, apiKey, texto }) {
  // Validação de entrada: nada obrigatório pode faltar
  if (!bot || !chatId || !fileId) {
    console.error("❌ analisarImagemRecebida: parâmetros obrigatórios ausentes");
    return { sucesso: false, erro: "Parâmetros obrigatórios ausentes." };
  }

  // Texto padrão, mas permitindo personalizar
  const promptAnalise = texto || "Descreva e analise esta imagem em detalhes.";

  try {
    await bot.sendMessage(chatId, "🔍 Analisando a imagem...");
  } catch (erroEnvio) {
    console.log("⚠️ Não foi possível enviar a mensagem inicial:", erroEnvio?.message);
  }

  try {
    const descricao = await analisarImagem({
      bot,
      fileId,
      texto: promptAnalise,
      apiKey,
    });

    if (!descricao || !descricao.trim()) {
      throw new Error("A análise retornou vazia.");
    }

    await bot.sendMessage(chatId, `📋 Análise:\n\n${descricao}`);
    return { sucesso: true };
  } catch (erro) {
    console.error("❌ Erro ao analisar imagem:", erro?.message);

    // Mensagem amigável para o usuário, detalhe técnico só no log
    await bot.sendMessage(
      chatId,
      "❌ Não foi possível concluir a análise da imagem. Tente novamente em instantes."
    );

    return { sucesso: false, erro: erro?.message };
  }
}

module.exports = { analisarImagemRecebida };
