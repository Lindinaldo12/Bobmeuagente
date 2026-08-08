const { chamarAPI } = require('./apiExterna');

async function processarMensagem(pergunta, contextoUsuario) {
  if (process.env.API_KEY) {
    console.log("✅ IA: OpenRouter (Nuvem)");
    return await chamarAPI(pergunta, contextoUsuario);
  }
  return "Configure API_KEY no servidor.";
}

module.exports = { processarMensagem };
