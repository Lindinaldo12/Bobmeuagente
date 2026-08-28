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

function responderInstrucoes(pergunta, usuarioId) {
  const t = String(pergunta || "").toLowerCase();
  
  // Instrução para responder em português
  if ((t.includes("sempre em portugues") || t.includes("responda em portugues") || t.includes("em portugues brasil")) && !t.includes("quem")) {
    return "Entendido, Lindinaldo. Vou responder sempre em português do Brasil. Não vou esquecer.";
  }
  
  // Instrução para não esquecer / memorizar regra
  if (t.includes("nao esqueca") || t.includes("lembre que") || t.includes("memorize que") || t.includes("guarde que")) {
    const match = pergunta.match(/(?:lembre que|memorize que|guarde que|nao esqueça que)\s*(.+)/i);
    if (match && match[1] && match[1].length > 3) {
      // Tenta salvar como fato
      try {
        const fatos = require("./fatosAprendidos");
        const r = fatos.aprender("Regra do usuário: " + match[1].trim(), usuarioId || "8133082447");
        if (!r.repetido) {
          return "Memorizado para sempre, Lindinaldo: " + match[1].trim() + ". Não vou esquecer.";
        }
        return "Já estava memorizado, Lindinaldo. Continuo respeitando.";
      } catch (e) {
        return "Entendido, Lindinaldo. Vou lembrar disso: " + match[1].trim();
      }
    }
    return "Memorizado, Lindinaldo. Não vou esquecer.";
  }
  
  return null;
}

module.exports.responderInstrucoes = responderInstrucoes;

function responderInstrucoes(pergunta, usuarioId) {
  const t = String(pergunta || "").toLowerCase();
  if ((t.includes("sempre em portugues") || t.includes("responda em portugues") || t.includes("em portugues brasil")) && !t.includes("quem")) {
    return "Entendido, Lindinaldo. Vou responder sempre em português do Brasil. Não vou esquecer.";
  }
  if (t.includes("nao esqueca") || t.includes("lembre que") || t.includes("memorize que") || t.includes("guarde que")) {
    const match = pergunta.match(/(?:lembre que|memorize que|guarde que|nao esqueça que)\s*(.+)/i);
    if (match && match[1] && match[1].trim().length > 3) {
      try {
        const f = require("./fatosAprendidos");
        const r = f.aprender("Regra do usuário: " + match[1].trim(), usuarioId || "8133082447");
        if (r && !r.repetido) return "Memorizado para sempre, Lindinaldo: " + match[1].trim() + " (fato " + r.total + ").";
      } catch(e) {}
      return "Memorizado, Lindinaldo. Não vou esquecer.";
    }
    return "Memorizado, Lindinaldo. Não vou esquecer.";
  }
  return null;
}

module.exports.responderInstrucoes = responderInstrucoes;
