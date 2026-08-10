const fs = require('fs');
const path = require('path');
const { chamarAPI } = require('../../ia/apiExterna');

const PASTA_LIVROS = path.join(__dirname, '../../conhecimento/espirita');

function detectar(pergunta) {
  const palavrasChave = [
    'kardec', 'espírita', 'espirita', 'codificação', 'codificacao',
    'livro dos espíritos', 'evangelho segundo o espiritismo', 'a gênese', 
    'céu e inferno', 'obras póstumas', 'revista espírita', 
    'reforma íntima', 'reforma intima', 'reforma interna',
    'resumo do capítulo', 'resumo desse capítulo', 'capítulo da reforma'
  ];
  return palavrasChave.some(palavra => pergunta.toLowerCase().includes(palavra));
}

function buscarTrechoReal(termoDeBusca, historico = []) {
  if (!fs.existsSync(PASTA_LIVROS)) return null;

  const arquivos = fs.readdirSync(PASTA_LIVROS);
  let contextoEncontrado = "";
  let arquivosLidos = 0;

  // 1. INTELIGÊNCIA DE CONTEXTO: Junta a pergunta atual com a última pergunta do usuário
  let queryFinal = termoDeBusca.toLowerCase();
  if (historico && historico.length > 0) {
    const ultimasFalasUsuario = historico
      .filter(h => h.role === 'user' || (h.from && h.from.is_bot === false))
      .map(h => h.content || h.text || h.message || '')
      .filter(t => t.length > 5)
      .slice(-2); // Pega as 2 últimas falas do usuário
    
    if (ultimasFalasUsuario.length > 0) {
      queryFinal = ultimasFalasUsuario.join(' ') + ' ' + queryFinal;
    }
  }

  // 2. DICIONÁRIO DE SINÔNIMOS
  queryFinal = queryFinal.replace(/reforma interna/g, 'reforma íntima');
  queryFinal = queryFinal.replace(/desse capítulo/g, 'reforma íntima');

  // Palavras-chave para buscar dentro do texto (ignora palavras muito curtas)
  const palavrasAlvo = queryFinal.split(' ').filter(p => p.length > 3);

  for (const arquivo of arquivos) {
    if (arquivo.endsWith('.txt') && arquivosLidos < 2) {
      try {
        const caminho = path.join(PASTA_LIVROS, arquivo);
        const conteudo = fs.readFileSync(caminho, 'utf8');
        const conteudoLower = conteudo.toLowerCase();

        // Procura a primeira ocorrência de uma das palavras-alvo
        let indiceEncontrado = -1;
        for (const palavra of palavrasAlvo) {
          const idx = conteudoLower.indexOf(palavra);
          if (idx !== -1) {
            indiceEncontrado = idx;
            break;
          }
        }

        if (indiceEncontrado !== -1) {
          // Pega 800 caracteres antes e 2000 caracteres depois da palavra encontrada (contexto mais rico)
          const inicio = Math.max(0, indiceEncontrado - 800);
          const fim = Math.min(conteudo.length, indiceEncontrado + 2000);
          const trecho = conteudo.substring(inicio, fim);
          
          contextoEncontrado += `\n--- TRECHO ENCONTRADO EM: ${arquivo} ---\n${trecho}\n`;
          arquivosLidos++;
        }
      } catch (err) {
        console.error(`Erro ao ler ${arquivo}:`, err.message);
      }
    }
  }
  
  return arquivosLidos > 0 ? contextoEncontrado : null;
}

async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  const historico = contexto?.historico || [];
  
  // 1. Atualizar Memória Evolutiva
  if (usuario) {
    try {
      const auth = require('../../core/auth');
      const banco = auth.carregarBanco();
      const userId = String(usuario.id || usuario.userId);
      
      if (banco.usuarios && banco.usuarios[userId]) {
        if (!banco.usuarios[userId].preferencias) banco.usuarios[userId].preferencias = {};
        if (!banco.usuarios[userId].preferencias.assuntos_interesse) {
          banco.usuarios[userId].preferencias.assuntos_interesse = [];
        }
        if (!banco.usuarios[userId].preferencias.assuntos_interesse.includes('Estudos Espíritas')) {
          banco.usuarios[userId].preferencias.assuntos_interesse.push('Estudos Espíritas');
        }
        const fsLocal = require('fs');
        fsLocal.writeFileSync(path.join(__dirname, '../../memoria/usuarios_db.json'), JSON.stringify(banco, null, 2));
      }
    } catch (e) {
      console.log("Erro ao salvar memória:", e.message);
    }
  }

  // 2. Buscar trecho real (passando o histórico para inteligência de contexto)
  const contextoLocal = buscarTrechoReal(pergunta, historico);

  // 3. Montar Prompt
  let promptBase = `Você é um especialista na Codificação Espírita de Allan Kardec. Responda de forma clara, serena e direta.`;

  if (contextoLocal) {
    promptBase += `\n\nEncontrei este trecho EXATO nos arquivos locais baseado na sua pergunta e no contexto da conversa:\n"""${contextoLocal}"""\n\nBaseie sua resposta APENAS neste trecho. Faça um resumo claro se o usuário pedir.`;
  } else {
    promptBase += `\n\n⚠️ Não encontrei o termo exato nos arquivos locais. Responda com seu conhecimento geral sobre Kardec, mas seja BREVE.`;
  }

  promptBase += `\n\nPERGUNTA: ${pergunta}

REGRAS RÍGIDAS:
1. Responda em no máximo 3 parágrafos curtos.
2. É ESTRITAMENTE PROIBIDO repetir a mesma palavra ou frase consecutivamente.
3. Se o usuário pedir um "resumo", forneça um resumo objetivo do trecho encontrado.
4. Cite o capítulo ou item se estiver no trecho.`;

  const resposta = await chamarAPI(promptBase, contexto);
  
  // Proteção final contra loops
  if (resposta && resposta.length > 1200) {
      return resposta.substring(0, 1200) + "\n\n*(Resposta limitada para manter a objetividade)*";
  }
  
  return resposta;
}

module.exports = { detectar, executar };
