const { exec } = require('child_process');
const { verificarPorta } = require('./utils');

async function verificarServicos() {
  console.log('🔧 Verificando serviços...');
  
  // Verificar servidor web
  const portaWeb = process.env.PORT || 3000;
  console.log(`  Servidor Web iniciado na porta ${portaWeb}`);
  
  // Verificar Ollama (OPCIONAL - não trava se não existir)
  try {
    const ollamaRodando = await verificarPorta(11434);
    if (!ollamaRodando) {
      console.log('  ⚠️ Ollama não está rodando (opcional).');
      console.log('  📡 Usando apenas API em nuvem (OpenRouter).');
    } else {
      console.log('  ✅ Ollama já está em execução.');
    }
  } catch (e) {
    console.log('  ️ Ollama não detectado (usando nuvem).');
  }
}

module.exports = { verificarServicos };
