const { chamarAPI } = require('../../ia/apiExterna');

function detectar(pergunta) {
  const palavrasChave = [
    'redação',
    'redacao',
    'discursiva',
    'estudo de caso',
    'texto dissertativo',
    'treinar redação',
    'tema de redação',
    'tema de redacao',
    'escrever redação',
    'corrigir redação',
    'questão discursiva',
    'prova discursiva'
  ];
  
  return palavrasChave.some(palavra => pergunta.includes(palavra));
}

async function executar(pergunta, contexto) {
  const perguntaLower = pergunta.toLowerCase();
  
  // Detectar tipo de solicitação
  let tipo = 'tema';
  if (perguntaLower.includes('corrigir') || perguntaLower.includes('avaliar')) {
    tipo = 'corrigir';
  } else if (perguntaLower.includes('escrever') || perguntaLower.includes('fazer')) {
    tipo = 'escrever';
  } else if (perguntaLower.includes('dica') || perguntaLower.includes('como')) {
    tipo = 'dicas';
  }
  
  // Detectar tema se houver
  let tema = 'atualidades brasileiras';
  const temas = {
    'meio ambiente': 'Meio Ambiente e Sustentabilidade',
    'educação': 'Educação no Brasil',
    'saúde': 'Saúde Pública',
    'segurança': 'Segurança Pública',
    'tecnologia': 'Tecnologia e Sociedade',
    'economia': 'Economia Brasileira',
    'política': 'Política e Democracia',
    'direitos humanos': 'Direitos Humanos',
    'trabalho': 'Mercado de Trabalho',
    'previdência': 'Sistema Previdenciário'
  };
  
  for (const [key, value] of Object.entries(temas)) {
    if (perguntaLower.includes(key)) {
      tema = value;
      break;
    }
  }
  
  let prompt = '';
  
  if (tipo === 'tema') {
    prompt = `Você é um corretor de redação discursiva de concursos públicos com 20 anos de experiência.

Crie um TEMA DE REDAÇÃO DISCURSIVA no estilo de concurso (CESPE, FGV, FCC, SESGRANRIO).

TEMA: ${tema}

FORMATO:

✍️ TEMA DE REDAÇÃO DISCURSIVA

🎯 Tema: ${tema}

━━━━━━━━━━━━━━━━━━━

📝 ENUNCIADO:

[enunciado completo com texto motivador, como em provas reais]

Texto de apoio 1:
[trecho de notícia, artigo ou dados estatísticos]

Texto de apoio 2:
[trecho de opinião ou estudo]

Texto de apoio 3:
[dados ou gráfico descrito]

Com base nos textos acima e em seus conhecimentos, redija um texto dissertativo-argumentativo sobre o tema proposto.

━━━━━━━━━━━━━━━━━━━

📋 ORIENTAÇÕES:
• Mínimo de 20 linhas e máximo de 30 linhas
• Texto em prosa (não use tópicos)
• Linguagem formal e impessoal
• Respeite os direitos humanos
• Não copie trechos dos textos motivadores

━━━━━━━━━━━━━━━━━━━

💡 ROTEIRO SUGERIDO:

INTRODUÇÃO (2-3 parágrafos):
• Contextualização do tema
• Tese clara (sua posição)

DESENVOLVIMENTO (3-4 parágrafos):
• Argumento 1 + exemplo/dado
• Argumento 2 + exemplo/dado
• Argumento 3 + exemplo/dado

CONCLUSÃO (1-2 parágrafos):
• Retomada da tese
• Proposta de intervenção (se aplicável)

━━━━━━━━━━━━━━━━━━━

📚 REFERÊNCIAS PARA ESTUDAR:
• [sugestão 1]
• [sugestão 2]
• [sugestão 3]

🎯 DICAS DA BANCA:
[dicas específicas de como as bancas avaliam este tipo de tema]`;
  } else if (tipo === 'dicas') {
    prompt = `Você é um especialista em redação discursiva para concursos públicos.

O usuário quer dicas de como escrever uma boa redação discursiva.

Apresente:

✍️ GUIA COMPLETO DE REDAÇÃO DISCURSIVA

━━━━━━━━━━━━━━━━━━━

📋 ESTRUTURA DO TEXTO DISSERTATIVO-ARGUMENTATIVO:

1. INTRODUÇÃO:
   • Contextualização do tema
   • Apresentação da tese
   • Roteiro argumentativo

2. DESENVOLVIMENTO:
   • Tópico frasal
   • Argumentação
   • Exemplos/dados
   • Conclusão parcial

3. CONCLUSÃO:
   • Retomada da tese
   • Síntese dos argumentos
   • Proposta de intervenção

━━━━━━━━━━━━━━━━━━━

✅ O QUE AS BANCAS AVALIAM:

• Competência 1: Domínio da norma culta
• Competência 2: Compreensão do tema
• Competência 3: Argumentação
• Competência 4: Coesão e coerência
• Competência 5: Proposta de intervenção

━━━━━━━━━━━━━━━━━━━

⚠️ ERROS COMUNS:

• Fugir do tema
• Não apresentar tese
• Argumentos fracos
• Cópia dos textos motivadores
• Desrespeito aos direitos humanos
• Linguagem informal

━━━━━━━━━━━━━━━━━━━

💡 DICAS DE OURO:

• Leia muitos temas anteriores
• Pratique pelo menos 1 redação por semana
• Estude atualidades
• Aprenda conectivos
• Treine a letra (se for manuscrita)

━━━━━━━━━━━━━━━━━━━

📚 CONECTIVOS ÚTEIS:

• Adição: além disso, outrossim, ademais
• Oposição: porém, contudo, todavia, entretanto
• Causa: porque, pois, visto que, uma vez que
• Consequência: portanto, logo, assim, por conseguinte
• Exemplificação: por exemplo, como, a saber`;
  } else {
    prompt = `Você é um corretor de redação discursiva de concursos públicos.

O usuário quer ajuda para escrever ou corrigir uma redação sobre: ${tema}

Apresente orientações detalhadas de como abordar este tema em uma redação discursiva de concurso.

FORMATO:

✍️ ORIENTAÇÕES PARA REDAÇÃO SOBRE: ${tema}

━━━━━━━━━━━━━━━━━━━

📝 POSSÍVEIS ABORDAGENS:

1. [abordagem 1]
2. [abordagem 2]
3. [abordagem 3]

━━━━━━━━━━━━━━━━━━━

💡 ARGUMENTOS FORTES:

• [argumento 1 + dado/exemplo]
• [argumento 2 + dado/exemplo]
• [argumento 3 + dado/exemplo]

━━━━━━━━━━━━━━━━━━━

📚 REFERÊNCIAS:

• [referência 1]
• [referência 2]
• [referência 3]

━━━━━━━━━━━━━━━━━━━

⚠️ CUIDADOS:

• [cuidado 1]
• [cuidado 2]

━━━━━━━━━━━━━━━━━━━

✅ MODELO DE INTRODUÇÃO:

[exemplo de como iniciar a redação]

✅ MODELO DE DESENVOLVIMENTO:

[exemplo de parágrafo de desenvolvimento]

✅ MODELO DE CONCLUSÃO:

[exemplo de como concluir]`;
  }
  
  const resposta = await chamarAPI(prompt, contexto);
  return resposta;
}

module.exports = { detectar, executar };
