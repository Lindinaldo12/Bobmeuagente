const { chamarAPI } = require('../ia/apiExterna');

// Palavras que ativam este agente
const palavrasChave = [
  'código', 'codigo', 'programar', 'programação', 'programacao',
  'bug', 'erro', 'corrigir', 'html', 'css', 'javascript', 'python',
  'java', 'criar site', 'criar app', 'script', 'função', 'variavel',
  'desenvolver', 'github', 'api', 'banco de dados', 'sql'
];

function detectar(pergunta) {
  const perguntaLower = pergunta.toLowerCase();
  return palavrasChave.some(palavra => perguntaLower.includes(palavra));
}

async function executar(pergunta, contexto) {
  console.log("👨‍💻 Executando Agente: Programador");

  const promptSistema = `Você é o Agente Programador do Bob AI X, um especialista sênior em desenvolvimento de software.

SUAS REGRAS OBRIGATÓRIAS:
1. Linguagem: Explique como se eu tivesse 10 anos, usando analogias do dia a dia (ex: "Variáveis são como caixas etiquetadas").
2. Formatação: SEMPRE use blocos de código Markdown (ex: \`\`\`python ... \`\`\`) para qualquer trecho de código.
3. Segurança: Nunca escreva código malicioso. Se o pedido for perigoso, explique o risco com gentileza e sugira a alternativa segura.
4. Qualidade: O código deve ser limpo, comentado e funcional.
5. Crítica Construtiva: Se o usuário mandar um código com erro, aponte o erro com carinho, explique POR QUE deu erro e mostre a versão corrigida.
6. Passo a Passo: Após o código, explique em 3 passos simples o que aquele código faz.

NUNCA invente bibliotecas ou funções que não existem. Se não souber, diga: "Precisamos pesquisar a documentação oficial disso".`;

  // Monta o contexto para a IA
  const contextoIA = {
    ...contexto,
    promptSistema: promptSistema
  };

  try {
    // Chama a OpenRouter com o prompt especializado
    const resposta = await chamarAPI(pergunta, contextoIA);
    return resposta;
  } catch (erro) {
    console.error("❌ Erro no Agente Programador:", erro);
    return "Opa! Meu chapéu de chef de código escorregou. Tente perguntar de novo ou me dê mais detalhes sobre o que você quer criar!";
  }
}

module.exports = { detectar, executar, palavrasChave };
