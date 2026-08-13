const fs = require('fs');
const path = require('path');

function carregarEnv() {
  const envPath = path.join(__dirname, '../.env');
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Variáveis de ambiente carregadas do .env');
    
    // Verificar chaves críticas
    const chaves = ['TELEGRAM_BOT_TOKEN', 'API_KEY', 'MASTER_ID'];
    chaves.forEach(chave => {
      if (!process.env[chave]) {
        console.error(`❌ ERRO: ${chave} não encontrada no .env!`);
      } else {
        console.log(`✅ ${chave} carregada`);
      }
    });
  } else {
    console.warn('⚠️ Arquivo .env não encontrado');
  }
}

module.exports = { carregarEnv };
