// ===== TRATAMENTO DE MENSAGENS =====
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text || "";

  // 1. Recebeu IMAGEM → guarda o file_id
  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    guardarArquivo(chatId, "imagem", fileId);
    await bot.sendMessage(chatId, "📷 Imagem recebida! Me peça um resumo.");
    return;
  }

  // 2. Recebeu DOCUMENTO → guarda como arquivo
  if (msg.document) {
    const fileId = msg.document.file_id;
    guardarArquivo(chatId, "documento", fileId);
    await bot.sendMessage(chatId, "📄 Arquivo recebido! Me peça um resumo.");
    return;
  }

  // 3. Pediu resumo → usa a imagem guardada
  if (/resumo/i.test(texto)) {
    const arquivo = pegarArquivo(chatId);
    if (arquivo && arquivo.tipo === "imagem") {
      await responderResumo({
        bot,
        chatId,
        texto,
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      return;
    }
    // Se não tem imagem, segue o fluxo normal
  }

  // 4. Fluxo normal (agentes, etc.)
  // ... seu código existente ...
});
