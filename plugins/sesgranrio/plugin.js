const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'questão sesgranrio',
    'questão da sesgranrio',
    'prova sesgranrio',
    'sesgranrio',
    'questão inss',
    'questão do inss',
    'questão banco do brasil',
    'questão do bb',
    'questão petrobras',
    'questão caixa',
    'questão da caixa',
    'questão receita federal',
    'questão ibge',
    'prova do inss',
    'prova do bb',
    'prova da petrobras',
    'estilo sesgranrio'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  const perguntaLower = pergunta.toLowerCase();
  
  // Detectar concurso específico
  let concurso = 'diversos';
  const concursos = {
    'inss': 'INSS (Instituto Nacional do Seguro Social)',
    'banco do brasil': 'Banco do Brasil',
    'bb': 'Banco do Brasil',
    'caixa': 'Caixa Econômica Federal',
    'petrobras': 'Petrobras',
    'receita federal': 'Receita Federal do Brasil',
    'rfb': 'Receita Federal do Brasil',
    'ibge': 'IBGE (Instituto Brasileiro de Geografia e Estatística)',
    'bndes': 'BNDES (Banco Nacional de Desenvolvimento Econômico e Social)',
    'transpetro': 'Transpetro',
    'finep': 'Finep',
    'epe': 'EPE (Empresa de Pesquisa Energética)'
  };
  
  for (const [key, value] of Object.entries(concursos)) {
    if (perguntaLower.includes(key)) {
      concurso = value;
      break;
    }
  }
  
  // Detectar matéria
  let materia = 'conhecimentos gerais';
  const materias = {
    'português': 'Língua Portuguesa',
    'portugues': 'Língua Portuguesa',
    'matemática': 'Matemática',
    'matematica': 'Matemática',
    'raciocínio': 'Raciocínio Lógico-Matemático',
    'raciocinio': 'Raciocínio Lógico-Matemático',
    'direito': 'Direito',
    'direito constitucional': 'Direito Constitucional',
    'direito administrativo': 'Direito Administrativo',
    'informática': 'Informática',
    'informatica': 'Informática',
    'atualidades': 'Atualidades',
    'administração': 'Administração',
    'administracao': 'Administração',
    'contabilidade': 'Contabilidade',
    'economia': 'Economia',
    'inglês': 'Língua Inglesa',
    'ingles': 'Língua Inglesa',
    'conhecimentos bancários': 'Conhecimentos Bancários',
    'conhecimentos bancarios': 'Conhecimentos Bancários',
    'seguridade social': 'Seguridade Social',
    'previdência': 'Seguridade Social',
    'previdencia': 'Seguridade Social'
  };
  
  for (const [key, value] of Object.entries(materias)) {
    if (perguntaLower.includes(key)) {
      materia = value;
      break;
    }
  }
  
  // Detectar nível de dificuldade
  let dificuldade = 'médio';
  if (perguntaLower.includes('fácil') || perguntaLower.includes('iniciante')) {
    dificuldade = 'fácil';
  } else if (perguntaLower.includes('difícil') || perguntaLower.includes('avançado')) {
    dificuldade = 'difícil';
  }
  
  const prompt = `Você é um especialista ABSOLUTO na banca SESGRANRIO, com mais de 20 anos de experiência preparando candidatos para concursos organizados por esta banca.

CONHECIMENTO ESPECÍFICO DA SESGRANRIO:

🎯 CARACTERÍSTICAS DA BANCA:
- Múltipla escolha com 5 alternativas (A, B, C, D, E)
- Português: foco em interpretação de texto, crase, concordância, regência, pontuação
- Matemática: problemas contextualizados com situações do dia a dia
- Raciocínio Lógico: questões de lógica proposicional, análise combinatória, probabilidade
- Atualidades: temas sociais, econômicos e políticos do Brasil
- Conhecimentos Específicos: varia conforme o órgão (bancário para BB/Caixa, previdenciário para INSS, etc.)

🏛️ CONCURSO ALVO: ${concurso}
📚 MATÉRIA: ${materia}
📊 NÍVEL: ${dificuldade}

🎓 ESTILO DE QUESTÃO SESGRANRIO:
- Enunciados longos e contextualizados
- Alternativas que exigem interpretação cuidadosa
- "Pegadinhas" sutis nas alternativas
- Foco em aplicação prática do conhecimento
- Para ${concurso}: ${concurso === 'INSS (Instituto Nacional do Seguro Social)' ? 'foco em legislação previdenciária, LOAS, benefícios' : concurso === 'Banco do Brasil' ? 'foco em conhecimentos bancários, mercado financeiro, atendimento' : concurso === 'Petrobras' ? 'foco em conhecimentos técnicos específicos da área' : 'foco nos conhecimentos específicos do cargo'}

Crie UMA questão no estilo EXATO da SESGRANRIO:

FORMATO OBRIGATÓRIO:

🎯 QUESTÃO ESTILO SESGRANRIO

🏛️ Concurso: ${concurso}
📚 Matéria: ${materia}
📊 Nível: ${dificuldade}
🎓 Banca: SESGRANRIO

━━━━━━━━━━━━━━━━━━━

[enunciado contextualizado, no estilo SESGRANRIO]

A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]

━━━━━━━━━━━━━━━━━━━

✅ GABARITO: [letra]

📖 COMENTÁRIO DETALHADO:
[explicação completa, explicando por que a resposta está certa e por que as outras estão erradas]

📚 BASE TEÓRICA/LEGAL:
[citar lei, doutrina, conceito ou regra gramatical aplicável]

⚠️ PEGADINHA DA SESGRANRIO:
[explicar qual é a "armadilha" típica desta questão e como evitá-la]

💡 DICA PARA QUESTÕES SEMELHANTES:
[dica estratégica para resolver questões desse tipo na prova]

🎯 TÓPICO ESPECÍFICO:
[qual assunto específico da matéria esta questão aborda]

Seja FIEL ao estilo SESGRANRIO:
- Use enunciados contextualizados
- Crie alternativas plausíveis (todas devem parecer corretas à primeira vista)
- Inclua a "pegadinha" característica da banca
- Para questões de Português, foque em interpretação e gramática normativa
- Para questões de Direito, cite os artigos de lei
- Para questões de Matemática, use problemas do dia a dia
- Para ${concurso}, adapte o conteúdo aos conhecimentos específicos cobrados neste concurso`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
