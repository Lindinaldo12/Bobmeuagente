// Usando o fetch nativo do Node.js (mais estável)
async function chamarAPI(pergunta, contextoUsuario) {
  console.log("🌐 Conectando à IA na Nuvem...");
  
  const url = process.env.API_URL || 'https://api.groq.com/openai/v1';
  const apiKey = process.env.API_KEY ? process.env.API_KEY.trim() : '';
  const modelo = process.env.MODEL_NAME || 'llama-3.1-8b-instant';
  
  console.log("🔑 Tamanho da API_KEY:", apiKey.length);
  
  if (!apiKey || apiKey.length < 20) {
    return "Erro: API_KEY inválida ou ausente no .env";
  }

  const payload = {
    model: modelo,
    messages: [
      { role: 'system', content: 'Você é o Bob AI X, um assistente inteligente e útil.' },
      { role: 'user', content: pergunta }
    ]
  };

  try {
    // Cria um controle de tempo (15 segundos) para não travar se a internet cair
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log("📡 Enviando requisição...");
    const response = await fetch(url + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Cancela o timer se deu certo
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro da API:", data);
      return `Erro na IA: ${data.error?.message || response.statusText}`;
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
    if (error.name === 'AbortError') {
      return "A conexão com a IA demorou muito ou caiu. Verifique sua internet e tente novamente.";
    }
    return "Problema de conexão com a IA. Tente novamente em alguns segundos.";
  }
}

module.exports = { chamarAPI };
