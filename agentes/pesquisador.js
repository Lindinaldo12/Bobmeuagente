const https = require('https');
const { chamarAPI } = require('../ia/apiExterna');

class AgentePesquisador {
  constructor() {
    this.nome = 'Pesquisador';
  }

  async buscarCotacaoMoedas() {
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
    const termo = comando.toLowerCase();

    if (termo.includes('dolar') || termo.includes('dólar') || termo.includes('euro') || termo.includes('cotacao') || termo.includes('cotação')) {
      return await this.buscarCotacaoMoedas();
    }

    try {
      const prompt = `Responda à seguinte pesquisa de forma objetiva e direta: ${comando}`;
      return await chamarAPI(prompt);
    } catch (error) {
      return `❌ Erro ao realizar pesquisa: ${error.message}`;
    }
  }
}

module.exports = new AgentePesquisador();
