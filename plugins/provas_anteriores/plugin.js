const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'prova anterior',
    'questão de concurso anterior',
    'prova da',
    'questão da cespe',
    'questão da fgv',
    'questão da fcc',
    'prova de',
    'concurso anterior',
    'questão de concurso passado',
    'prova oficial'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  const perguntaLower = pergunta.toLowerCase();
  
  // Detectar banca
  let banca = 'CESPE/CEBRASPE';
  const bancas = {
    'cespe': 'CESPE/CEBRASPE',
    'cebraspe': 'CESPE/CEBRASPE',
    'fgv': 'FGV',
    'fcc': 'FCC',
    'vunesp': 'VUNESP',
    'ibfc': 'IBFC',
    'consulplan': 'CONSULPLAN'
  };
  
  for (const [key, value] of Object.entries(bancas)) {
    if (perguntaLower.includes(key)) {
      banca = value;
      break;
    }
  }
  
  // Detectar órgão
  let orgao = 'diversos';
  const orgaos = {
    'polícia federal': 'Polícia Federal',
    'pf': 'Polícia Federal',
    'prf': 'Polícia Rodoviária Federal',
    'receita federal': 'Receita Federal do Brasil',
    'rfb': 'Receita Federal do Brasil',
    'tribunal': 'Tribunais (TRF, TRT, TJ)',
    'trf': 'Tribunal Regional Federal',
    'trt': 'Tribunal Regional do Trabalho',
    'tj': 'Tribunal de Justiça',
    'banco do brasil': 'Banco do Brasil',
    'bb': 'Banco do Brasil',
    'caixa': 'Caixa Econômica Federal',
    'petrobras': 'Petrobras',
    'correios': 'Correios'
  };
  
  for (const [key, value] of Object.entries(orgaos)) {
    if (perguntaLower.includes(key)) {
      orgao = value;
      break;
    }
  }
  
  // Detectar matéria
  let materia = 'conhecimentos gerais';
  const materias = {
    'português': 'Português',
    'matemática': 'Matemática',
    'raciocínio': 'Raciocínio Lógico',
    'direito': 'Direito',
    'informática': 'Informática',
    'atualidades': 'Atualidades',
    'administração': 'Administração'
  };
  
  for (const [key, value] of Object.entries(materias)) {
    if (perguntaLower.includes(key)) {
      materia = value;
      break;
    }
  }
  
  const prompt = `Você é um especialista em concursos públicos brasileiros com acesso a um banco de dados de questões reais de provas anteriores.

Apresente UMA questão REAL de concurso anterior com as seguintes características:

BANCA: ${banca}
ÓRGÃO: ${orgao}
MATÉRIA: ${materia}

ESTRUTURA OBRIGATÓRIA:
1. Identificação da prova (ano, cargo, órgão)
2. Enunciado original da questão
3. Alternativas (A, B, C, D, E ou Certo/Errado)
4. Gabarito oficial
5. Comentário detalhado explicando a resposta
6. Base legal ou conceito teórico (se aplicável)
7. Dica para questões semelhantes

FORMATO DA RESPOSTA:

📜 QUESTÃO DE CONCURSO ANTERIOR

🏛️ Prova: ${orgao}
📋 Banca: ${banca}
📅 Ano: [ano da prova]
💼 Cargo: [cargo do concurso]
📚 Matéria: ${materia}

━━━━━━━━━━━━━━━━━━━

[enunciado original da questão]

A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]

━━━━━━━━━━━━━━━━━━━

✅ GABARITO OFICIAL: [letra ou Certo/Errado]

📖 COMENTÁRIO DETALHADO:
[explicação completa, citando artigos de lei, conceitos teóricos, etc.]

📚 BASE LEGAL/TEÓRICA:
[citar lei, doutrina ou conceito relevante]

💡 DICA:
[dica para resolver questões semelhantes]

⚠️ NÍVEL DE DIFICULDADE: [fácil/médio/difícil]

Seja fiel ao estilo da banca ${banca}.
Para questões de Direito, cite os artigos exatos da legislação.
Para questões de Português, explique a regra gramatical completa.
Mantenha o formato original da questão.`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
