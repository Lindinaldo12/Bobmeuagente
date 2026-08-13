// Carrega as variáveis de ambiente do .env
require("dotenv").config({
  path: require("path").join(__dirname, "../.env")
});

const axios = require("axios");
const https = require("https");

class AgentePesquisador {
  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY || "";
  }

  // 🌐 BUSCA NA WEB (Tavily)
  async buscarNaWeb(query) {
    if (!this.tavilyApiKey) {
      console.error("❌ TAVILY_API_KEY não configurada!");
      return null;
    }

    try {
      const termoLimpo = String(query)
        .replace(/^\/pesquisar\s*/i, "")
        .trim();

      if (!termoLimpo) return null;

      console.log("🌐 ===== PESQUISA WEB =====");
      console.log("Consulta:", termoLimpo);

      const response = await axios.post(
        "https://api.tavily.com/search",
        {
          query: termoLimpo,
          search_depth: "basic",
          topic: "general",
          include_answer: true,
          max_results: 5
        },
        {
          headers: {
            "Authorization": `Bearer ${this.tavilyApiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      const dados = response.data;
      console.log("Resultados:", dados?.results?.length || 0);

      if (!dados) return null;

      const resposta = [];

      if (dados.answer) {
        resposta.push(`🌐 **Informação atualizada da Web**\n\n${dados.answer}`);
      }

      if (Array.isArray(dados.results)) {
        resposta.push("\n### Fontes encontradas:");
        dados.results.slice(0, 5).forEach((resultado, index) => {
          resposta.push(
            `\n${index + 1}. **${resultado.title || "Sem título"}**\n` +
            `${resultado.content || ""}\n` +
            `Fonte: ${resultado.url || "URL desconhecida"}`
          );
        });
      }

      if (resposta.length === 0) return null;

      console.log("✅ Pesquisa Web concluída.");
      console.log("============================");

      return resposta.join("\n");

    } catch (erro) {
      console.error("❌ Erro na busca Tavily:", erro.response?.data || erro.message);
      return null;
    }
  }

  //  COTAÇÃO DE MOEDAS (AwesomeAPI)
  async buscarCotacao() {
    return new Promise((resolve) => {
      https.get(
        "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL",
        { timeout: 5000 },
        (res) => {
          let body = "";
          res.on("data", chunk => { body += chunk; });
          res.on("end", () => {
            try {
              const dados = JSON.parse(body);
              const dolar = parseFloat(dados.USDBRL.bid).toFixed(2);
              const euro = parseFloat(dados.EURBRL.bid).toFixed(2);
              const variacaoDolar = dados.USDBRL.pctChange;
              const variacaoEuro = dados.EURBRL.pctChange;

              resolve(
                `📊 **Cotação Atual** (Fonte: AwesomeAPI)\n\n` +
                `💵 *Dólar:* R$ ${dolar} (Variação: ${variacaoDolar}%)\n` +
                `💶 *Euro:* R$ ${euro} (Variação: ${variacaoEuro}%)`
              );
            } catch (erro) {
              console.error("Erro ao processar cotação:", erro.message);
              resolve(null);
            }
          });
        }
      ).on("error", () => {
        resolve(null);
      });
    });
  }

  // 🎯 EXECUTAR (Roteador principal)
  async executar(comando) {
    const texto = String(comando).toLowerCase();

    // Se for cotação, usa AwesomeAPI (rápido e gratuito)
    if (
      texto.includes("dólar") ||
      texto.includes("dolar") ||
      texto.includes("euro") ||
      texto.includes("cotação") ||
      texto.includes("cotacao")
    ) {
      const cotacao = await this.buscarCotacao();
      if (cotacao) return cotacao;
    }

    // Para qualquer outra coisa, usa Tavily
    return await this.buscarNaWeb(comando);
  }
}

module.exports = new AgentePesquisador();
