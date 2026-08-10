const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'flashcard',
    'cartão de memorização',
    'criar flashcard',
    'memorizar',
    'revisão rápida',
    'revisar conteúdo',
    'cartões de estudo'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const usuario = contexto?.usuario;
  
  // Detectar assunto
  let assunto = pergunta.replace(/flashcard|cartão|memorizar|revisão|criar/gi, '').trim();
  if (!assunto || assunto.length < 3) {
    assunto = 'o último assunto estudado';
  }
  
  const prompt = `Você é um especialista em técnicas de memorização e aprendizagem acelerada.

Crie 10 FLASHCARDS (cartões de memorização) sobre: ${assunto}

Cada flashcard deve ter:
- FRENTE: Uma pergunta ou conceito-chave
- VERSO: A resposta ou explicação completa

FORMATO:

🎴 FLASHCARDS SOBRE: ${assunto}

━━━━━━━━━━━━━━━━━━━
📇 CARD 1
FRENTE: [pergunta/conceito]
VERSO: [resposta/explicação]
━━━━━━━━━━━━━━━━━━━

📇 CARD 2
FRENTE: [pergunta/conceito]
VERSO: [resposta/explicação]
━━━━━━━━━━━━━━━━━━━

[continua até o card 10]

💡 COMO ESTUDAR COM ESTES FLASHCARDS:
1. Leia a FRENTE e tente responder mentalmente
2. Vire o cartão e confira a VERSO
3. Se acertou: marque como "fácil" e revise em 3 dias
4. Se errou: marque como "difícil" e revise amanhã
5. Repita o processo diariamente

📊 DICA DE OURO:
Use a técnica de repetição espaçada para memorizar melhor!

Seja didático, use linguagem simples e foque nos conceitos mais importantes.`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
