const https = require('https');
const { chamarAPI } = require('../ia/apiExterna');

const palavrasChave = ['pesquise', 'pesquisar', 'cotação', 'dólar', 'dolar', 'euro', 'valor', 'hoje', 'agora', '/web', '/pesquisar'];

function detectar(pergunta) {
  return palavrasChave.some(p => pergunta.toLowerCase().includes(p));
}

async function executar(pergunta, contexto) {
  console.log("📻 MODO RÁDIO DE PILHA ATIVADO: Buscando dados JSON puros");
  const termo = pergunta.toLowerCase();

  // SE FOR COTAÇÃO, USA A PORTA DOS FUNDOS (API JSON LEVE)
  if (termo.includes('dólar') || termo.includes('dolar') || termo.includes('euro')) {
    console.log("💱 Sintonizando na frequência da AwesomeAPI...");
    
    return new Promise((resolve) => {
      // Usando o módulo 'https' NATIVO do Node (mais estável no Termux que node-fetch)
      const req = https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 8000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            let msg = "📊 *Cotação Atual (Fonte: AwesomeAPI)*\n\n";
            
            if (json.USDBRL) {
              const valor = parseFloat(json.USDBRL.bid).toFixed(2).replace('.', ',');
              msg += `🇺🇸 *Dólar Comercial*: R$ ${valor} (Variação: ${json.USDBRL.pctChange}%)\n`;
            }
            if (json.EURBRL) {
              const valor = parseFloat(json.EURBRL.bid).toFixed(2).replace('.', ',');
              msg += `🇪🇺 *Euro*: R$ ${valor} (Variação: ${json.EURBRL.pctChange}%)\n`;
            }
            resolve(msg.trim());
          } catch (e) {
            console.error("❌ Erro ao processar JSON:", e.message);
            resolve("⚠️ Recebi os dados, mas não consegui ler os números. Tente novamente.");
          }
        });
      });

      req.on('error', (err) => {
        console.error("❌ Falha na conexão com a API:", err.message);
        resolve("⚠️ Falha de rede ao conectar com a API de cotação. Verifique seu Wi-Fi e tente novamente.");
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve("⚠️ A conexão com a API demorou muito e foi cancelada. Tente novamente.");
      });
    });
  }

  // SE NÃO FOR COTAÇÃO, DEIXA A IA RESPONDER COM CONHECIMENTO GERAL
  console.log("🧠 Não é cotação. Usando conhecimento geral da IA.");
  const prompt = `Você é o Bob. Responda de forma clara e direta (nível 10 anos). Se perguntarem sobre notícias recentes, avise que sua busca na web está em manutenção, mas responda com o que sabe sobre o tema.`;
  
  try {
    return await chamarAPI(pergunta, { ...contexto, promptSistema: prompt, historico: [] });
  } catch (e) {
    return "Opa! Tive um probleminha técnico ao processar a resposta.";
  }
}

module.exports = { detectar, executar, palavrasChave };
