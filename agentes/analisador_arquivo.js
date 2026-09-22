"use strict";
const { analisarImagem } = require("./visao");

// Descobre o que foi enviado e extrai o file_id
function extrairArquivo(msg) {
  if (!msg) return null;

  // Foto (Telegram manda várias resoluções; pega a maior)
  if (msg.photo && msg.photo.length) {
    const maior = msg.photo[msg.photo.length - 1];
    return { fileId: maior.file_id, tipo: "imagem" };
  }

  // Documento (PDF, imagem, etc.)
  if (msg.document) {
    return {
      fileId: msg.document.file_id,
      tipo: msg.document.mime_type || "arquivo",
    };
  }

  // Sticker
  if (msg.sticker) {
    return { fileId: msg.sticker.file_id, tipo: "sticker" };
  }

  // Vídeo
  if (msg.video) {
    return { fileId: msg.video.file_id, tipo: "video" };
  }

  return null;
}

// Analisa automaticamente o que chegou
async function analisarArquivoRecebido({ bot, chatId, msg, apiKey }) {
  const arquivo = extrairArquivo(msg);

  if (!arquivo) {
    return { sucesso: false, motivo: "nenhum_arquivo" };
  }

  // Só analisa imagem/arquivo de imagem. Vídeo e sticker são ignorados.
  const ehImagem =
    arquivo.tipo === "imagem" ||
    /image\//.test(arquivo.tipo) ||
    arquivo.tipo === "sticker";

  if (!ehImagem) {
    await bot.sendMessage(
      chatId,
      "📄 Recebi um arquivo, mas só consigo analisar imagens por enquanto."
    );
    return { sucesso: false, motivo: "tipo_nao_suportado" };
  }

  try {
    await bot.sendMessage(chatId, "🔍 Analisando a imagem...");

    const descricao = await analisarImagem({
      bot,
      fileId: arquivo.fileId,
      texto: "Descreva e analise esta imagem em detalhes.",
      apiKey,
    });

    await bot.sendMessage(chatId, `📋 Análise:\n\n${descricao}`);
    return { sucesso: true };
  } catch (erro) {
    console.error("❌ Erro ao analisar:", erro?.message);
    await bot.sendMessage(
      chatId,
      "❌ Não consegui analisar a imagem. Tente novamente em instantes."
    );
    return { sucesso: false, erro: erro?.message };
  }
}

module.exports = { analisarArquivoRecebido, extrairArquivo };
