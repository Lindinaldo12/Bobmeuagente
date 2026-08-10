const { chamarAPI } = require('../../ia/apiExterna');

// Detectar se a mensagem é sobre gerar questões
function detectar(pergunta) {
  const palavrasChave = [
    'gerar questão',
    'criar questão',
    'questão de',
    'exercício de',
    'questão sobre',
    'me dá uma questão',
    'gera uma questão',
    'questão de concurso',
    'exercício de concurso',
    'simulado'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

// Executar o plugin
async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  const preferencias = usuario?.preferencias || {};
  
  // Detectar matéria
  let materia = 'geral';
  const materias = {
    'português': 'Português (gramática, interpretação de texto, redação)',
    'matemática': 'Matemática (aritmética, álgebra, geometria)',
    'raciocínio lógico': 'Raciocínio Lógico-Matemático',
    'direito constitucional': 'Direito Constitucional',
    'direito administrativo': 'Direito Administrativo',
    'direito penal': 'Direito Penal',
    'direito civil': 'Direito Civil',
    'informática': 'Informática (Word, Excel, Windows, internet)',
    'atualidades': 'Atualidades (política, economia, sociedade)',
    'administração': 'Administração Pública',
    'contabilidade': 'Contabilidade Geral',
    'economia': 'Economia',
    'inglês': 'Inglês',
    'redação': 'Redação Oficial',
    'ética': 'Ética no Serviço Público'
  };
  
  const perguntaLower = pergunta.toLowerCase();
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
  
  // Detectar banca
  let banca = 'CESPE/CEBRASPE';
  const bancas = ['CESPE', 'CEBRASPE', 'FGV', 'FCC', 'VUNESP', 'IBFC', 'CONSULPLAN'];
  for (const b of bancas) {
    if (perguntaLower.includes(b.toLowerCase())) {
      banca = b;
      break;
    }
  }
  
  const prompt = `Você é um especialista em criar questões de concursos públicos brasileiros.

Crie UMA questão sobre: ${materia}
Nível de dificuldade: ${dificuldade}
Estilo da banca: ${banca}

ESTRUTURA OBRIGATÓRIA:
1. Enunciado claro e objetivo (estilo ${banca})
2. 5 alternativas (A, B, C, D, E) - ou Certo/Errado se for CESPE
3. Gabarito comentado explicando passo a passo
4. Dica de como resolver mais rápido
5. Assunto específico dentro da matéria

FORMATO DA RESPOSTA:

📝 QUESTÃO DE ${materia.toUpperCase()}
Nível: ${dificuldade} | Banca: ${banca}

[enunciado aqui]

A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]

✅ GABARITO: [letra ou Certo/Errado]

📖 RESOLUÇÃO COMENTADA:
[explicação passo a passo, citando a base legal se for Direito]

💡 DICA:
[dica para resolver mais rápido]

📚 ASSUNTO:
[qual tópico específico da matéria esta questão aborda]

Seja didático, use linguagem clara e siga o estilo da banca ${banca}.
Para questões de Direito, cite os artigos da lei quando possível.
Para questões de Português, explique a regra gramatical.`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
