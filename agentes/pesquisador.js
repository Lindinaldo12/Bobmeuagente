require("dotenv").config({
  path: require("path").join(__dirname, "../.env")
});

const axios = require("axios");
const https = require("https");

class AgentePesquisador {
  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY || "";
  }

  // ==========================================
  // 🌐 PESQUISA NA WEB — TAVILY
  // ==========================================

  async buscarNaWeb(query) {
    if (!this.tavilyApiKey) {
      console.error("❌ TAVILY_API_KEY não configurada!");
      return null;
    }

    try {
      const termoOriginal = String(query || "")
        .replace(/^\/pesquisar\s*/i, "")
        .trim();

      if (!termoOriginal) {
        return null;
      }

      // ==========================================
      // 🔎 MELHORIA DA CONSULTA
      // ==========================================

      const textoNormalizado = termoOriginal
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      const termosAtuais = [
        "agora",
        "atual",
        "atualmente",
        "hoje",
        "neste momento",
        "nesse momento",
        "tempo",
        "temperatura",
        "cotacao",
        "cotação",
        "preco",
        "preço",
        "valor",
        "noticia",
        "notícia"
      ];

      const perguntaAtual = termosAtuais.some(
        termo => textoNormalizado.includes(termo)
      );

      let termoBusca = termoOriginal;

      if (perguntaAtual) {
        termoBusca += " agora atual hoje";
      }

      console.log("🌐 ===== PESQUISA WEB =====");
      console.log("Consulta original:", termoOriginal);
      console.log("Consulta enviada:", termoBusca);

      // ==========================================
      // 🌐 TAVILY
      // ==========================================

      const response = await axios.post(
        "https://api.tavily.com/search",
        {
          query: termoBusca,

          search_depth: perguntaAtual
            ? "advanced"
            : "basic",

          topic: "general",

          include_answer: true,

          max_results: 5,

          include_raw_content: false
        },
        {
          headers: {
            "Authorization": `Bearer ${this.tavilyApiKey}`,
            "Content-Type": "application/json"
          },

          timeout: 15000
        }
      );

      const dados = response.data;

      const resultados =
        Array.isArray(dados?.results)
          ? dados.results
          : [];

      console.log(
        "Resultados:",
        resultados.length
      );

      if (!dados) {
        return null;
      }

      // ==========================================
      // 📦 MONTAGEM DOS DADOS
      // ==========================================

      const resposta = [];

      resposta.push(
        "🌐 **DADOS ATUALIZADOS DA INTERNET**"
      );

      resposta.push(
        `\n🔎 Consulta realizada: ${termoOriginal}`
      );

      // ==========================================
      // ⚠️ IMPORTANTE
      // FONTES VÊM ANTES DO RESUMO DO TAVILY
      // ==========================================

      if (resultados.length > 0) {

        resposta.push(
          "\n\n### FONTES DA PESQUISA"
        );

        resultados.slice(0, 5).forEach(
          (resultado, index) => {

            const titulo =
              resultado?.title ||
              "Sem título";

            const conteudo =
              resultado?.content ||
              "Sem conteúdo disponível.";

            const url =
              resultado?.url ||
              "URL desconhecida";

            resposta.push(
              `\n${index + 1}. **${titulo}**\n` +
              `Conteúdo: ${conteudo}\n` +
              `Fonte: ${url}`
            );
          }
        );
      }

      // ==========================================
      // 🧠 RESUMO DO TAVILY
      // ==========================================

      if (
        dados.answer &&
        String(dados.answer).trim()
      ) {

        resposta.push(
          "\n\n### RESUMO AUTOMÁTICO DA PESQUISA"
        );

        resposta.push(
          String(dados.answer).trim()
        );

        resposta.push(
          "\n⚠️ Este resumo é auxiliar. " +
          "Quando houver divergência, priorize " +
          "informações explicitamente identificadas " +
          "nas fontes como atuais/agora."
        );
      }

      if (resposta.length <= 2) {
        return null;
      }

      console.log(
        "✅ Pesquisa Web concluída."
      );

      console.log(
        "📚 Fontes preservadas:",
        resultados.length
      );

      console.log(
        "🧠 Resumo Tavily:",
        dados.answer
          ? "SIM"
          : "NÃO"
      );

      console.log(
        "============================"
      );

      return resposta.join("\n");

    } catch (erro) {

      console.error(
        "❌ Erro na busca Tavily:",
        erro.response?.data ||
        erro.message
      );

      return null;
    }
  }

  // ==========================================
  // 💰 COTAÇÃO DE MOEDAS
  // ==========================================

  async buscarCotacao() {

    return new Promise((resolve) => {

      https.get(
        "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL",
        { timeout: 5000 },

        (res) => {

          let body = "";

          res.on(
            "data",
            chunk => {
              body += chunk;
            }
          );

          res.on(
            "end",
            () => {

              try {

                const dados =
                  JSON.parse(body);

                const dolar =
                  parseFloat(
                    dados.USDBRL.bid
                  ).toFixed(2);

                const euro =
                  parseFloat(
                    dados.EURBRL.bid
                  ).toFixed(2);

                const variacaoDolar =
                  dados.USDBRL.pctChange;

                const variacaoEuro =
                  dados.EURBRL.pctChange;

                resolve(
                  `📊 **Cotação Atual** ` +
                  `(Fonte: AwesomeAPI)\n\n` +

                  `💵 *Dólar:* R$ ${dolar} ` +
                  `(Variação: ${variacaoDolar}%)\n` +

                  `💶 *Euro:* R$ ${euro} ` +
                  `(Variação: ${variacaoEuro}%)`
                );

              } catch (erro) {

                console.error(
                  "Erro ao processar cotação:",
                  erro.message
                );

                resolve(null);
              }
            }
          );

        }
      ).on(
        "error",
        () => {
          resolve(null);
        }
      );
    });
  }

  // ==========================================
  // 🎯 EXECUTAR
  // ==========================================

  async executar(comando) {

    const texto =
      String(comando || "")
        .toLowerCase();

    // ==========================================
    // 💰 COTAÇÃO
    // ==========================================

    if (
      texto.includes("dólar") ||
      texto.includes("dolar") ||
      texto.includes("euro") ||
      texto.includes("cotação") ||
      texto.includes("cotacao")
    ) {

      const cotacao =
        await this.buscarCotacao();

      if (cotacao) {
        return cotacao;
      }
    }

    // ==========================================
    // 🌐 WEB
    // ==========================================

    return await this.buscarNaWeb(comando);
  }
}

module.exports = new AgentePesquisador();
