const fetch = require('node-fetch');

async function chamarAPI(pergunta) {
  const url = process.env.API_URL || 'https://openrouter.ai/api/v1';
  const apiKey = process.env.API_KEY;
  const modelo = process.env.MODEL_NAME || 'qwen/qwen2.5-coder-32b';
  
  if (!apiKey) {
    console.error("❌ API_KEY não configurada!");
    return "API_KEY não configurada.";
  }

  const response = await fetch(url + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/Lindinaldo12/Bobmeuagente'
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: 'system', content: 'Você é o Bob AI X.' },
        { role: 'user', content: pergunta }
      ],
      stream: false
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = { chamarAPI };
