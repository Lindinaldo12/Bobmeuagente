const axios = require('axios');
const CONSTITUICAO_BOB = require('../config/constituição');
const pesquisador = require('../agentes/pesquisador');

// Pega a chave da variável de ambiente (Seguro!)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ ERRO CRÍTICO: Chave GROQ_API_KEY não encontrada!");
}

async function executar(contexto) {
  try {
    const mensagem = typeof contexto === 'string' ? contexto : (contexto.texto || '');
    const textoLower = mensagem.toLowerCase();

    let dadosTempoReal = "";

    // 1. Verifica se precisa buscar dados em tempo real
    const termosBusca = ['temperatura', 'clima', 'tempo em', 'dolar', 'dólar', 'euro', 'cotacao', 'cotação', 'ultimo jogo', 'resultado'];
    if (termosBusca.some(t => textoLower.includes(t))) {
      console.log("🌐 Buscando dados atualizados para a IA...");
      const resultadoWeb = await pesquisador.executar(mensagem);
      if (resultadoWeb) {
        dadosTempoReal = `\n\n[DADOS ATUALIZADOS DA WEB EM TEMPO REAL]:\n${resultadoWeb}`;
      }
    }

    // 2. Monta o Prompt com a Constituição + Dados Reais
    const promptSistema = `${CONSTITUICAO_BOB}${dadosTempoReal}`;

    // 3. Chamada direta para a Groq (Llama 3.1-8b-instant)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: promptSistema },
          { role: 'user', content: mensagem }
        ],
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("Erro na execução da IA:", error.response ? error.response.data : error.message);
    return "🤖 Desculpe, Lindinaldo! Tive uma falha de conexão na minha inteligência principal. Podemos tentar novamente?";
  }
}

module.exports = { executar };
