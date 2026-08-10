const { buscarNaWeb } = require('../../ia/buscaWeb');
const { chamarAPI } = require('../../ia/apiExterna');

async function executar(primeiroParam, segundoParam, terceiroParam, quartoParam) {
  let perguntaUsuario = '';
  let usuario = null;

  if (typeof primeiroParam === 'object' && primeiroParam !== null) {
    perguntaUsuario = primeiroParam.texto || primeiroParam.pergunta || JSON.stringify(primeiroParam);
    usuario = primeiroParam.usuario || null;
  } else {
    perguntaUsuario = primeiroParam || '';
    usuario = quartoParam || null;
  }

  console.log("Executando agente: Professor | Pergunta:", perguntaUsuario);
  
  let contextoWeb = "";
  let contextoConversa = "";
  let infoPerfil = "";
  
  const historico = usuario?.historico || [];
  const busca = await buscarNaWeb(perguntaUsuario, historico);
  
  const resultados = busca.resultados || [];
  contextoConversa = busca.contextoAnterior || "";
  
  // NOVO: Extrair Memória de Longo Prazo do Perfil
  if (usuario && usuario.perfil) {
    const interesses = usuario.perfil.interesses || [];
    const objetivo = usuario.perfil.objetivo_atual || "";
    
    if (interesses.length > 0 || objetivo) {
      infoPerfil = "\n🧠 MEMÓRIA DE LONGO PRAZO DO USUÁRIO:\n";
      if (objetivo) infoPerfil += `- Objetivo atual: ${objetivo}\n`;
      if (interesses.length > 0) infoPerfil += `- Interesses/Fatos: ${interesses.join(', ')}\n`;
    }
  }

  if (resultados && resultados.length > 0) {
    contextoWeb = "\n📚 DADOS DA WEB:\n" + resultados.map(r => r.conteudo).join('\n');
  }

  const promptFinal = `Você é o Bob AI X. Responda em português brasileiro correto, de forma direta e objetiva.

REGRAS:
1. Consulte a "MEMÓRIA DE LONGO PRAZO DO USUÁRIO" abaixo antes de responder perguntas sobre a vida, estudos ou preferências do usuário.
2. Se a pergunta for sobre o histórico recente, use o "HISTÓRICO RECENTE".
3. Não invente fatos. Se a informação não estiver no perfil ou no histórico, diga que não sabe.

${infoPerfil}

HISTÓRICO RECENTE:
${contextoConversa || "Nenhuma conversa anterior."}

${contextoWeb}

PERGUNTA ATUAL: ${perguntaUsuario}

RESPOSTA:`;
  
  return await chamarAPI(promptFinal, usuario);
}
module.exports = { executar };
