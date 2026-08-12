const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function chamarAPI(pergunta, contextoUsuario) {
  console.log("🌐 Conectando à OpenRouter...");
  
  const apiKey = process.env.API_KEY ? process.env.API_KEY.trim() : '';
  const modelo = process.env.MODEL_NAME || 'qwen/qwen-2.5-7b-instruct';
  const url = process.env.API_URL || 'https://openrouter.ai/api/v1';
  
  if (!apiKey || apiKey.length < 20) {
    return "Erro: API_KEY inválida ou ausente no .env";
  }

  // Prepara as mensagens. Começamos com a instrução do sistema.
  
    // 📜 LER A CONSTITUIÇÃO DO BOB (REGRAS ABSOLUTAS)
    let regrasPersonais = "";
    const pathPersonalidade = path.join(__dirname, '../config/personalidade.txt');
    if (fs.existsSync(pathPersonalidade)) {
        regrasPersonais = "\n\n🚨 REGRAS ABSOLUTAS DO SISTEMA (OBEDEÇA 100%):\n" + fs.readFileSync(pathPersonalidade, 'utf8');
    }
    
    let messages = [
    { role: 'system', content: 'Você é o Bob AI X.' + regrasPersonais }
  ];

  // Se tiver histórico, formatamos corretamente para garantir 'role' e 'content'
  if (contextoUsuario && contextoUsuario.historico && Array.isArray(contextoUsuario.historico)) {
    const historicoRecente = contextoUsuario.historico.slice(-4);
    
    historicoRecente.forEach(msg => {
      // Formato 1: Já está no padrão OpenAI
      if (msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content });
      } 
      // Formato 2: Salvo como pergunta/resposta
      else if (msg.pergunta && msg.resposta) {
        messages.push({ role: 'user', content: msg.pergunta });
        messages.push({ role: 'assistant', content: msg.resposta });
      }
      // Formato 3: Objeto bruto do Telegram
      else if (msg.text && msg.from) {
        const role = msg.from.is_bot ? 'assistant' : 'user';
        messages.push({ role: role, content: msg.text });
      }
    });
  }

  // Adiciona a pergunta atual (que já contém os dados da Wikipedia injetados pelo Agente)
  messages.push({ role: 'user', content: pergunta });

  let tentativas = 0;
  const maxTentativas = 2;

  while (tentativas < maxTentativas) {
    try {
      console.log(`📡 Enviando requisição (Tentativa ${tentativas + 1}/${maxTentativas})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/Lindinaldo12/Bobmeuagente',
          'X-Title': 'Bob AI X',
          'Connection': 'close'
        },
        body: JSON.stringify({
          model: modelo,
          messages: messages, // <-- AQUI ESTÁ A MÁGICA: Enviamos o histórico!
          temperature: 0.3
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Erro da API:", data);
        return `Erro na IA: ${data.error?.message || 'Tente novamente'}`;
      }

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error("Formato de resposta inesperado");
      }

    } catch (error) {
      tentativas++;
      if (tentativas >= maxTentativas) {
        console.error("❌ Falha após múltiplas tentativas:", error.message);
        return "Problema de conexão com a IA. Verifique sua internet e tente novamente.";
      }
      console.log("⚠️ A conexão caiu. Tentando novamente em 1 segundo...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { chamarAPI };
