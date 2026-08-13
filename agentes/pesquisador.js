const axios = require('axios');
const https = require('https');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
    this.tavilyApiKey = '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';
  }

  buscarCotacaoMoedas() {
    return new Promise((resolve) => {
      https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 8000 }, (res) => {
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
            resolve('⚠️ Não foi possível obter a cotação no momento.');
          }
        });
      }).on('error', () => resolve('⚠️ Erro ao conectar no serviço de cotações.'));
    });
  }

  async buscarNaWebTavily(query) {
    try {
      // Limpa comandos do texto da busca
      const termoLimpo = query.replace(/^\/pesquisar\s*/i, '').replace(/pesquise/i, '').trim();

      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: termoLimpo,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      }, { timeout: 10000 });

      if (response.data && response.data.answer) {
        return `🌐 *PESQUISA WEB EM TEMPO REAL*\n\n${response.data.answer}`;
      } else if (response.data && response.data.results && response.data.results.length > 0) {
        let txt = `🌐 *RESULTADOS DA BUSCA:*\n\n`;
        response.data.results.forEach((r, i) => {
          txt += `*${i+1}. ${r.title}*\n${r.content.substring(0, 150)}...\n\n`;
        });
        return txt;
      }
      return '⚠️ Não foram encontrados resultados atualizados para esta busca.';
    } catch (error) {
      console.error('Erro Tavily:', error.message);
      return '⚠️ Ocorreu uma falha ao pesquisar na web no momento.';
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
