const axios = require('axios');
const CONSTITUICAO_BOB = require('../config/constituição');

// Insira sua chave do Groq aqui ou via variável de ambiente
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'SUA_CHAVE_GROQ_AQUI';

async function executar(contexto) {
  try {
    const mensagemUsuario = contexto.texto || contexto;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: CONSTITUICAO_BOB },
          { role: 'user', content: mensagemUsuario }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro na API do Groq:", error.response ? error.response.data : error.message);
    return "🤖 Desculpe, tive uma falha temporária de conexão com minha inteligência artificial.";
  }
}

module.exports = { executar };
