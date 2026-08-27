function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function responderIdentidade(pergunta) {
  const t = normalizar(pergunta);

  const sobreCriador =
    t.includes("criador") ||
    t.includes("te criou") ||
    t.includes("criou voce") ||
    t.includes("quem te fez") ||
    t.includes("seu dono") ||
    t.includes("dono") ||
    t.includes("master");

  if (sobreCriador) {
    return [
      "Meu criador, dono e MASTER é **José Lindinaldo do Nascimento Luiz**.",
      "",
      "Fui desenvolvido por ele como um agente de IA pessoal, modular e evolutivo, com memória, ferramentas, pesquisa e automação."
    ].join("\n");
  }

  const sobreVoce =
    t.includes("quem e voce") ||
    t.includes("quem voce e") ||
    t.includes("se apresente") ||
    t.includes("o que voce e");

  if (sobreVoce) {
    return [
      "Eu sou o **Bob AI X**, seu agente de inteligência artificial pessoal, Lindinaldo.",
      "",
      "Posso ajudar com conversação, programação, clima, cotações, análise de arquivos, memória, pesquisa, automação e suporte técnico. O que você precisa?"
    ].join("\n");
  }

  return null;
}

module.exports = { responderIdentidade };
