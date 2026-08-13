const https = require('https');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
  }

  buscarCotacaoMoedas() {
    return new Promise((resolve) => {
      const req = https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            let resposta = '📊 *Cotação Atual (Fonte: AwesomeAPI)*\n\n';

            if (json.USDBRL) {
              const dolar = parseFloat(json.USDBRL.bid).toFixed(2);
              resposta += `💵 *Dólar:* R$ ${dolar}\n`;
            }
            if (json.EURBRL) {
              const euro = parseFloat(json.EURBRL.bid).toFixed(2);
              resposta += `💶 *Euro:* R$ ${euro}\n`;
            }

            resolve(resposta);
          } catch (e) {
            resolve('📊 *Cotação Atual:* Não foi possível processar os valores no momento.');
          }
        });
      });

      req.on('error', () => {
        resolve('❌ Erro ao consultar a cotação de moedas no momento.');
      });

      req.end();
    });
  }

  async executar(comando, contexto = {}) {
    const termo = (comando || '').toLowerCase();

    // Intercepta qualquer termo relacionado a moedas/cotação
    if (
      termo.includes('dolar') || 
      termo.includes('dólar') || 
      termo.includes('euro') || 
      termo.includes('cotacao') || 
      termo.includes('cotação') ||
      termo.includes('moeda') ||
      termo.includes('valor')
    ) {
      return await this.buscarCotacaoMoedas();
    }

    return await this.buscarCotacaoMoedas(); // Fallback seguro para requisições do pesquisador
  }
}

module.exports = new AgentePesquisador();
