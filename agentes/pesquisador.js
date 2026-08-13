const axios = require('axios');
const https = require('https');

class AgentePesquisador {
  constructor() {
    this.tavilyApiKey = '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';
  }

  async buscarNaWeb(query) {
    try {
      const termoLimpo = query.replace(/^\/pesquisar\s*/i, '').trim();
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: termoLimpo,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3
      }, { timeout: 8000 });

      if (response.data && response.data.answer) {
        return `🌐 *Informação Atualizada (Web):*\n\n${response.data.answer}`;
      }
      return null;
    } catch (e) {
      console.error("Erro na busca Tavily:", e.message);
      return null;
    }
  }

  async buscarCotacao() {
    return new Promise((resolve) => {
      https.get('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', { timeout: 5000 }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const j = JSON.parse(body);
            resolve(`📊 *Cotação Atual:*\n💵 Dólar: R$ ${parseFloat(j.USDBRL.bid).toFixed(2)}\n💶 Euro: R$ ${parseFloat(j.EURBRL.bid).toFixed(2)}`);
          } catch { resolve(null); }
        });
      }).on('error', () => resolve(null));
    });
  }

  async executar(comando) {
    const t = comando.toLowerCase();
    if (t.includes('dolar') || t.includes('dólar') || t.includes('euro') || t.includes('cotacao')) {
      const cot = await this.buscarCotacao();
      if (cot) return cot;
    }
    return await this.buscarNaWeb(comando);
  }
}

module.exports = new AgentePesquisador();
