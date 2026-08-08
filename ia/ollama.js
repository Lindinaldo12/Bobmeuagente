const fetch = require('node-fetch');

async function chamarIA(mensagens, modelo) {
  console.log(" Preparando o cérebro do Bob...");
  
  // Verifica se está usando API externa (OpenRouter) ou Ollama local
  const urlAPI = process.env.API_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  const modeloAPI = process.env.MODEL_NAME || process.env.OLLAMA_MODEL || modelo;
  const apiKey = process.env.API_KEY;
  
  console.log("🔍 RAIO-X:");
  console.log("Modelo:", modeloAPI);
  
  let payload;
  let headers = { 'Content-Type': 'application/json' };
  
  if (apiKey) {
    console.log("🌐 Usando API de Nuvem (OpenRouter):", urlAPI);
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'https://github.com/Lindinaldo12/Bobmeuagente';
    
    payload = {
      model: modeloAPI,
      messages: mensagens,
      stream: false
    };
  } else {
    console.log("💻 Usando Ollama Local:", urlAPI);
    payload = {
      model: modeloAPI,
      messages: mensagens,
      stream: false
    };
  }
  
  console.log(" Enviando para a IA...");
  
  try {
    const response = await fetch(urlAPI + '/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Erro da API:", JSON.stringify(data));
      throw new Error(data.error?.message || "Erro na API");
    }
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error("❌ Erro ao chamar IA:", error.message);
    return "Desculpe, tive um problema de conexão. Tente novamente!";
  }
}

module.exports = { chamarIA };
