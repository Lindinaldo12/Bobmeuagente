const { chamarAPI } = require('./apiExterna');

// Função que o bot.js chama ao iniciar
async function inicializar() {
  console.log("========================================");
  console.log("Inicializando Gerenciador de IA");
  console.log("========================================");
  
  if (process.env.API_KEY) {
    console.log("✅ IA principal: OpenRouter (Nuvem)");
    console.log("🧠 Modelo:", process.env.MODEL_NAME || 'qwen/qwen2.5-coder-32b');
  } else {
    console.log("⚠️ API_KEY não configurada. Usando fallback local.");
  }
  
  console.log("========================================");
}

// Função que processa as mensagens
async function processarMensagem(pergunta, contextoUsuario) {
  if (process.env.API_KEY) {
    console.log("🌐 Usando API de Nuvem (OpenRouter)...");
    return await chamarAPI(pergunta);
  }
  return "Configure API_KEY no servidor para usar a IA na nuvem.";
}

module.exports = { inicializar, processarMensagem };
