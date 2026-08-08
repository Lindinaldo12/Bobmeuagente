const { chamarAPI } = require('./apiExterna');

async function processarMensagem(pergunta, contextoUsuario) {
  if (process.env.API_KEY) {
    console.log("✅ IA: OpenRouter");
    return await chamarAPI(pergunta);
  }
  return "Configure API_KEY";
}

module.exports = { processarMensagem };
