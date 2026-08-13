const axios = require('axios');
const https = require('https');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
    this.tavilyApiKey = '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';
  }

  buscarCotacaoMoedas() {
    return new Promise((resolve) => {
      const req = https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            let dados = 'DADOS ATUAIS DA COTAÇÃO DE MOEDAS:\n';
            if (json.USDBRL) dados += `- Dólar Americano: R$ ${parseFloat(json.USDBRL.bid).toFixed(2)}\n`;
            if (json.EURBRL) dados += `- Euro: R$ ${parseFloat(json.EURBRL.bid).toFixed(2)}\n`;
            resolve(dados);
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  async buscarNaWebTavily(query) {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      }, { timeout: 10000 });

      if (response.data && response.data.answer) {
        return `DADOS EM TEMPO REAL OBTIDOS NA WEB (TAVILY):\n${response.data.answer}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async executar(comando) {
    const termo = (comando || '').toLowerCase().trim();

    if (termo.includes('dolar') || termo.includes('dólar') || termo.includes('euro') || termo.includes('cotacao') || termo.includes('cotação')) {
      const cotacao = await this.buscarCotacaoMoedas();
      if (cotacao) return cotacao;
    }

    return await this.buscarNaWebTavily(comando);
  }
}

module.exports = new AgentePesquisador();
