const { chamarAPI } = require('./apiExterna');

async function processarMensagem(pergunta, contextoUsuario) {
  console.log("========================================");
  console.log("Inicializando Gerenciador de IA");
  console.log("========================================");
  
  // SE TIVER API_KEY, USA A NUVEM (OPENROUTER)
  if (process.env.API_KEY) {
    console.log("✅ IA principal: OpenRouter (Nuvem)");
    console.log("🧠 Modelo:", process.env.MODEL_NAME || 'qwen/qwen2.5-coder-32b');
    return await chamarAPI(pergunta, contextoUsuario);
  }
  
  // SE NÃO TIVER, TENTA OLLAMA LOCAL (para testes no celular)
  console.log("️ API_KEY não configurada. Usando Ollama local...");
  return "Configure a API_KEY no servidor para usar a IA na nuvem.";
}

module.exports = { processarMensagem };
