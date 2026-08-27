function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function responderIdentidade(pergunta, usuarioId) {
  const t = normalizar(pergunta);

  const perguntaIdentidade =
    t.includes("quem e voce") ||
    t.includes("quem voce e") ||
    t.includes("quem e seu criador") ||
    t.includes("quem te criou") ||
    t.includes("quem criou voce") ||
    t.includes("quem e seu dono") ||
    t.includes("quem e seu master") ||
    t.includes("quem e o master") ||
    t.includes("seu criador") ||
    t.includes("seu dono") ||
    t.includes("seu master");

  if (!perguntaIdentidade) return null;

  return [
    "Eu sou o **Bob AI X**, agente de inteligência artificial pessoal, modular e evolutivo.",
    "",
    "Meu criador, dono e MASTER é **José Lindinaldo do Nascimento Luiz**.",
    "",
    "Minha função é ajudar o MASTER com conversação, programação, análise de arquivos, memória, pesquisa, automação, ferramentas e suporte técnico, sempre respeitando a arquitetura de segurança e permissões do projeto Bob."
  ].join("\n");
}

module.exports = { responderIdentidade };
