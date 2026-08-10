const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'lei seca',
    'artigo da lei',
    'artigo da constituição',
    'artigo da constituicao',
    'o que diz a lei',
    'clt',
    'código penal',
    'codigo penal',
    'código civil',
    'codigo civil',
    'lei 8.112',
    'lei 8.213',
    'lei 8.745',
    'decreto',
    'legislação',
    'legislacao',
    'resumo da lei',
    'artigos importantes'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const perguntaLower = pergunta.toLowerCase();
  
  // Detectar qual lei o usuário quer estudar
  let lei = 'Constituição Federal';
  const leis = {
    'constituição': 'Constituição Federal de 1988',
    'constituicao': 'Constituição Federal de 1988',
    'cf': 'Constituição Federal de 1988',
    'código penal': 'Código Penal (Decreto-Lei 2.848/1940)',
    'codigo penal': 'Código Penal (Decreto-Lei 2.848/1940)',
    'cp': 'Código Penal (Decreto-Lei 2.848/1940)',
    'código civil': 'Código Civil (Lei 10.406/2002)',
    'codigo civil': 'Código Civil (Lei 10.406/2002)',
    'cc': 'Código Civil (Lei 10.406/2002)',
    'clt': 'Consolidação das Leis do Trabalho (Decreto-Lei 5.452/1943)',
    'cpc': 'Código de Processo Civil (Lei 13.105/2015)',
    'cpp': 'Código de Processo Penal (Decreto-Lei 3.689/1941)',
    '8.112': 'Lei 8.112/1990 (Regime Jurídico dos Servidores Públicos)',
    '8.213': 'Lei 8.213/1991 (Planos de Benefícios da Previdência Social)',
    '8.745': 'Lei 8.745/1993 (Contrato por Tempo Determinado)',
    '8.747': 'Lei 8.747/1993 (LOAS - Lei Orgânica da Assistência Social)',
    'loas': 'Lei 8.747/1993 (LOAS - Lei Orgânica da Assistência Social)',
    '12.527': 'Lei 12.527/2011 (Acesso à Informação)',
    '8.429': 'Lei 8.429/1992 (Improbidade Administrativa)',
    '9.784': 'Lei 9.784/1999 (Processo Administrativo Federal)',
    '11.340': 'Lei 11.340/2006 (Lei Maria da Penha)',
    '12.850': 'Lei 12.850/2013 (Organizações Criminosas)',
    '11.343': 'Lei 11.343/2006 (Drogas)'
  };
  
  for (const [key, value] of Object.entries(leis)) {
    if (perguntaLower.includes(key)) {
      lei = value;
      break;
    }
  }
  
  // Detectar o que o usuário quer (artigo específico, resumo, questões)
  let tipoSolicitacao = 'geral';
  if (perguntaLower.includes('artigo') || perguntaLower.includes('art.')) {
    tipoSolicitacao = 'artigo_especifico';
  } else if (perguntaLower.includes('resumo') || perguntaLower.includes('principais')) {
    tipoSolicitacao = 'resumo';
  } else if (perguntaLower.includes('questão') || perguntaLower.includes('exercicio')) {
    tipoSolicitacao = 'questao';
  }
  
  const prompt = `Você é um especialista em legislação brasileira para concursos públicos, com conhecimento profundo da ${lei}.

SOLICITAÇÃO DO USUÁRIO: ${pergunta}
TIPO: ${tipoSolicitacao}

${tipoSolicitacao === 'artigo_especifico' ? `
O usuário quer saber sobre um artigo específico da ${lei}.
Identifique qual artigo ele está perguntando e apresente:
1. Texto do artigo (transcrição fiel)
2. Parágrafos e incisos relacionados
3. Explicação detalhada do artigo
4. Como este artigo é cobrado em concursos
5. Questão exemplo sobre este artigo
` : tipoSolicitacao === 'resumo' ? `
O usuário quer um resumo dos pontos mais importantes da ${lei}.
Apresente:
1. Resumo geral da lei (o que ela regula)
2. 10 artigos mais cobrados em concursos
3. Pontos-chave de cada artigo
4. "Pegadinhas" comuns em provas
5. Mnemônicos para memorizar
` : tipoSolicitacao === 'questao' ? `
O usuário quer uma questão sobre a ${lei}.
Crie uma questão no estilo de concurso (CESPE, FGV, FCC ou SESGRANRIO):
1. Enunciado contextualizado
2. 5 alternativas ou Certo/Errado
3. Gabarito comentado
4. Base legal (artigo da lei)
` : `
O usuário quer informações gerais sobre a ${lei}.
Apresente:
1. O que é esta lei e o que ela regula
2. Estrutura geral (títulos, capítulos, seções)
3. 10 artigos mais importantes
4. Como é cobrada em concursos
5. Dicas de estudo
`}

FORMATO DA RESPOSTA:

📖 ESTUDO DA ${lei.toUpperCase()}

━━━━━━━━━━━━━━━━━━━

[conteúdo detalhado baseado no tipo de solicitação]

━━━━━━━━━━━━━━━━━━━

💡 DICAS DE ESTUDO:
• [dica 1]
• [dica 2]
• [dica 3]

🎯 COMO CAI EM CONCURSO:
[explicar como esta lei é cobrada pelas principais bancas]

📚 ARTIGOS MAIS COBRADOS:
[listar os artigos que mais aparecem em provas]

Seja preciso, cite os artigos exatos e use linguagem clara.
Para questões de Direito, sempre cite a base legal.`;

  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
