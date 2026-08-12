const https = require('https');
const { chamarAPI } = require('../ia/apiExterna');

const palavrasChave = ['pesquise', 'pesquisar', 'cotação', 'dólar', 'dolar', 'euro', 'valor', 'hoje', 'agora', 'notícia', 'noticias', '/web', '/pesquisar'];

function detectar(pergunta) {
  return palavrasChave.some(p => pergunta.toLowerCase().includes(p));
}

async function executar(pergunta, contexto) {
  console.log("🚨 MODO BLINDADO ATIVADO: Pesquisador Web");
  const termo = pergunta.replace(/pesquise|pesquisar|na internet|na web|me diga|hoje|agora|\/web|\/pesquisar|\?/gi, '').trim();
  
  console.log(`🌐 Tentando buscar no DuckDuckGo: cotacao ${termo} brasil`);
  
  // Busca direta e simples
  const url = `https://html.duckduckgo.com/html/?q=cotacao+${encodeURIComponent(termo)}+brasil`;
  
  let dadosReais = null;
  
  try {
    const resultado = await new Promise((resolve, reject) => {
      const req = https.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000 
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });

    // Extrair snippets
    const matches = [...resultado.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi)];
    const textos = matches.slice(0, 3).map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').trim());
    
    if (textos.length > 0 && textos[0].length > 20) {
      dadosReais = textos.join('\n- ');
      console.log("✅ DADOS ENCONTRADOS NA WEB!");
    } else {
      console.log("⚠️ Nenhum dado útil encontrado na web.");
    }
  } catch (erro) {
    console.log("❌ ERRO DE REDE (Provável bloqueio da operadora ou sem internet):", erro.message);
  }

  // 🚨 BLOQUEIO TOTAL DA IA SE NÃO HOUVER DADOS
  if (!dadosReais) {
    console.log("🛑 RETORNO FIXO: IA foi bloqueada de responder.");
    return "⚠️ Falha de rede: Meus sistemas não conseguiram acessar a internet neste momento (isso é comum em redes móveis no Termux). Por favor, tente conectar no Wi-Fi ou verifique seu site de finanças.";
  }

  // Se chegou aqui, temos dados!
  console.log("✅ Enviando dados reais para a IA formatar...");
  const prompt = `Você é o Bob. Responda de forma curta e direta. Use APENAS estes dados:\n"""\n- ${dadosReais}\n"""\nDestaque os valores.`;

  try {
    return await chamarAPI(pergunta, { ...contexto, promptSistema: prompt, historico: [] });
  } catch (e) {
    return "Erro ao formatar a resposta.";
  }
}

module.exports = { detectar, executar, palavrasChave };
