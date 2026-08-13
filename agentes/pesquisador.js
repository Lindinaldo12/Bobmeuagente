const axios = require('axios');
const https = require('https');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
    this.tavilyApiKey = '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';
  }

  // Cotação de Moedas
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
            resolve('📊 *Cotação Atual:* Não foi possível carregar os dados no momento.');
          }
        });
      });

      req.on('error', () => {
        resolve('❌ Erro ao consultar a cotação no momento.');
      });

      req.end();
    });
  }

  // Pesquisa Web em Tempo Real via Tavily
  async buscarNaWebTavily(query) {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      }, { timeout: 10000 });

      const data = response.data;

      if (data && data.answer) {
        let resposta = `🌐 *Pesquisa Web em Tempo Real:*\n\n${data.answer}`;
        return resposta;
      }

      if (data && data.results && data.results.length > 0) {
        let resposta = `🌐 *Resultados da Pesquisa Web:*\n\n`;
        data.results.forEach((res, index) => {
          resposta += `*${index + 1}. ${res.title}*\n${res.content.substring(0, 180)}...\n\n`;
        });
        return resposta;
      }

      return null;
    } catch (error) {
      console.error('Erro Tavily:', error.message);
      return null;
    }
  }

  async executar(comando) {
    const termo = (comando || '').toLowerCase().trim();

    if (termo.includes('dolar') || termo.includes('dólar') || termo.includes('euro') || termo.includes('cotacao') || termo.includes('cotação')) {
      return await this.buscarCotacaoMoedas();
    }

    const resultadoWeb = await this.buscarNaWebTavily(comando);
    if (resultadoWeb) {
      return resultadoWeb;
    }

    return '⚠️ Não foram encontradas informações atualizadas na web para essa busca.';
  }
}

module.exports = new AgentePesquisador();
