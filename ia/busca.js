const axios = require('axios');

async function executarBuscaWeb(consultaOriginal) {
  const apiKey = process.env.TAVILY_API_KEY;

  try {
    const textoConsulta = (consultaOriginal || '').toString();
    const possuiDataExplicita = textoConsulta.toLowerCase().includes('hoje') || 
                                textoConsulta.toLowerCase().includes('agora') || 
                                textoConsulta.toLowerCase().includes('atual');

    let consultaEnviada = textoConsulta + (possuiDataExplicita ? '' : ' agora atual hoje');
    
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: consultaEnviada,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5
    });

    return { sucesso: true, respostaIA: response.data.answer, resultados: response.data.results };
  } catch (error) {
    console.error('❌ Erro na busca:', error.message);
    return null;
  }
}

module.exports = { executarBuscaWeb };
