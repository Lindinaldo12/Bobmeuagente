const fetch = require('node-fetch');

async function chamarAPI(pergunta, contextoUsuario) {
  console.log("🌐 Usando API de Nuvem (OpenRouter)...");
  
  const url = process.env.API_URL || 'https://openrouter.ai/api/v1';
  const apiKey = process.env.API_KEY;
  const modelo = process.env.MODEL_NAME || 'qwen/qwen2.5-coder-32b';
  
  if (!apiKey) {
    console.error("❌ API_KEY não configurada!");
    return "Erro: API_KEY não configurada.";
  }

  const payload = {
    model: modelo,
    messages: [
      { role: 'system', content: 'Você é o Bob AI X, assistente útil.' },
      { role: 'user', content: pergunta }
    ],
    stream: false
  };

  try {
    const response = await fetch(url + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/Lindinaldo12/Bobmeuagente'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Erro API:", JSON.stringify(data));
      return "Erro ao consultar IA.";
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return "Problema de conexão.";
  }
}

module.exports = { chamarAPI };
