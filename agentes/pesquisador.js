const axios = require('axios');
const https = require('https');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
    this.tavilyApiKey = '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';
  }

  async buscarCotacaoMoedas() {
    return new Promise((resolve) => {
      https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 5000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            let resposta = '📊 *COTAÇÃO EM TEMPO REAL*\n\n';
            if (json.USDBRL) resposta += `💵 *Dólar:* R$ ${parseFloat(json.USDBRL.bid).toFixed(2)}\n`;
            if (json.EURBRL) resposta += `💶 *Euro:* R$ ${parseFloat(json.EURBRL.bid).toFixed(2)}\n`;
            resolve(resposta);
          } catch (e) {
            resolve('⚠️ Erro ao processar cotação.');
          }
        });
      }).on('error', () => resolve('⚠️ Falha na conexão com a API de moedas.'));
    });
  }

  async buscarNaWebTavily(query) {
    try {
      const res = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 2
      }, { timeout: 8000 });

      if (res.data && res.data.answer) {
        return `🌐 *INFORMAÇÃO DA WEB EM TEMPO REAL:*\n\n${res.data.answer}`;
      } else if (res.data && res.data.results && res.data.results.length > 0) {
        return `🌐 *INFORMAÇÃO DA WEB:*\n\n${res.data.results[0].content}`;
      }
      return '⚠️ Nenhuma informação encontrada na web para esse termo.';
    } catch (err) {
      console.error('Erro Tavily:', err.message);
      return `⚠️ Erro ao buscar na web: ${err.message}`;
    }
  }

  async executar(comando) {
    const termo = (comando || '').toLowerCase().trim();

    if (termo.includes('dolar') || termo.includes('dólar') || termo.includes('euro') || termo.includes('cotacao') || termo.includes('cotação')) {
      return await this.buscarCotacaoMoedas();
    }

    return await this.buscarNaWebTavily(comando);
  }
}

module.exports = new AgentePesquisador();
