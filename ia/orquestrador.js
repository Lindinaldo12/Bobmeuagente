/**
 * Orquestrador Definitivo do Bob AI X
 */

function gerarPlano(pergunta, dadosWebDisponiveis) {
  const texto = pergunta.toLowerCase();

  // 1. CONVERSAS PESSOAIS, IDENTIDADE E APELIDOS
  const termosPessoais = [
    'chama', 'lindinaldo', 'anote', 'esquecer', 'quem sou', 
    'quem é você', 'sempre', 'olá', 'tudo bem', 'bom dia', 
    'boa tarde', 'boa noite', 'obrigado', 'valeu', 'criador', 
    'meu nome', 'como eu me chamo', 'o que eu sou'
  ];

  const eConversaPessoal = termosPessoais.some(termo => texto.includes(termo));

  if (eConversaPessoal && !dadosWebDisponiveis) {
    console.log("🛡️ Orquestrador: Mensagem pessoal/identidade. Resposta direta do Kernel.");
    return {
      objetivo: pergunta,
      etapas: [
        {
          nome: "Conversa Direta",
          agente: null 
        }
      ]
    };
  }

  // 2. BUSCA WEB / CLIMA / TEMPERATURA / PREVISÃO
  const termosWeb = [
    'clima', 'tempo', 'temperatura', 'graus', 'chovendo', 'chuva', 
    'sol', 'previsão', 'meteorologia', 'frio', 'calor', 'umidade',
    'hoje', 'agora', 'atualmente', 'recente', 'notícias'
  ];

  const exigeWeb = termosWeb.some(termo => texto.includes(termo));

  if (exigeWeb || dadosWebDisponiveis) {
    console.log("🌐 Orquestrador: Intenção de dados web detectada.");
    return {
      objetivo: pergunta,
      etapas: [
        {
          nome: "Responder com Dados Web",
          agente: null 
        }
      ]
    };
  }

  // 3. APENAS CONTEÚDO DIDÁTICO / TÉCNICO REAL ACIONA O PROFESSOR
  const termosDidaticos = [
    'explique', 'ensine', 'o que é', 'como funciona', 
    'conceito', 'código', 'javascript', 'node', '/estudar', '/flashcards'
  ];
  
  const eDidatico = termosDidaticos.some(termo => texto.includes(termo));

  if (eDidatico) {
    console.log("🎓 Orquestrador: Conteúdo didático. Acionando Agente Professor.");
    return {
      objetivo: pergunta,
      etapas: [
        {
          nome: "Ensino Técnico",
          agente: "Professor"
        }
      ]
    };
  }

  // 4. PADRÃO GERAL
  return {
    objetivo: pergunta,
    etapas: [
      {
        nome: "Conversa Geral",
        agente: null
      }
    ]
  };
}

module.exports = { gerarPlano };
