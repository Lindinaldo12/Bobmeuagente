async function responder(msg, texto, imagem) {
  const chatId = msg.chat.id;

  if (!autorizado(chatId)) {
    return bot.sendMessage(chatId, 'Acesso nao autorizado.');
  }
  if (!dentroDoLimite(chatId)) {
    return bot.sendMessage(chatId, 'Muitas mensagens seguidas. Aguarde um minuto.');
  }

  await db.salvar(chatId, 'user', texto || '');

  try {
    let historico = await db.buscar(chatId, config.maxHistorico);

    // Garante que a mensagem atual sempre chega ao modelo
    if (!historico.length || historico[historico.length - 1].content !== (texto || '')) {
      historico.push({ role: 'user', content: texto || '' });
    }

    const resposta = await gerarResposta(historico, imagem);
    await db.salvar(chatId, 'assistant', resposta);
    await bot.sendMessage(chatId, resposta);
  } catch (err) {
    console.error('Erro ao responder:', err.message);
    await bot.sendMessage(
      chatId,
      'Nao consegui falar com a IA agora.\nDetalhe: ' + err.message.slice(0, 250)
    );
  }
}
