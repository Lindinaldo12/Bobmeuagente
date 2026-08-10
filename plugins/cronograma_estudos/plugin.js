const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'cronograma',
    'plano de estudos',
    'organizar estudos',
    'montar cronograma',
    'quando estudar',
    'rotina de estudos',
    'horário de estudo',
    'organizar matéria'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  const perfil = usuario?.perfil || {};
  
  // Detectar informações da pergunta
  let tempoDisponivel = 'não especificado';
  let materias = 'não especificadas';
  let periodo = 'não especificado';
  
  // Procurar tempo (ex: "2 horas", "3h", "uma hora")
  const matchTempo = pergunta.match(/(\d+)\s*(h|hora|horas)/i);
  if (matchTempo) {
    tempoDisponivel = `${matchTempo[1]} horas`;
  }
  
  // Procurar período (ex: "1 semana", "1 mês", "30 dias")
  const matchPeriodo = pergunta.match(/(\d+)\s*(dia|dias|semana|semanas|mês|meses)/i);
  if (matchPeriodo) {
    periodo = `${matchPeriodo[1]} ${matchPeriodo[2]}`;
  }
  
  const prompt = `Você é um especialista em organização de estudos para concursos públicos.

Crie um CRONOGRAMA DE ESTUDOS personalizado com base nas informações:

TEMPO DISPONÍVEL POR DIA: ${tempoDisponivel}
PERÍODO TOTAL: ${periodo}
MATÉRIAS: ${materias}
OBJETIVO DO USUÁRIO: ${perfil.objetivo_atual || 'aprovação em concurso'}
NÍVEL: ${perfil.nivel_conhecimento || 'iniciante'}

ESTRUTURA DO CRONOGRAMA:

📅 CRONOGRAMA DE ESTUDOS

🎯 Objetivo: [objetivo claro]
⏰ Carga horária diária: [tempo]
📆 Período: [duração]

📚 DIVISÃO POR DIA DA SEMANA:

SEGUNDA:
• [matéria 1] - [tempo]
• [matéria 2] - [tempo]
• Revisão - [tempo]

TERÇA:
• [matéria 1] - [tempo]
...

[continua para todos os dias]

📝 METAS SEMANAIS:
• [meta 1]
• [meta 2]

💡 DICAS DE ORGANIZAÇÃO:
• [dica 1]
• [dica 2]

🎯 COMO MEDIR O PROGRESSO:
• [método 1]
• [método 2]

Seja prático, realista e motivador. Use emojis para facilitar a leitura.`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
