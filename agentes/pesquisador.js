const { search } = require('duck-duck-scrape');
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
      // 🕒 FILTRO DE RELEVÂNCIA TEMPORAL
      // ==========================================

      const consultaNormalizada =
        termoOriginal
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      const buscaAtual =
        /\b(agora|atual|atualmente|neste momento|nesse momento)\b/
          .test(consultaNormalizada);

      let resultadosFiltrados = resultados;

      // ==========================================
      // 📅 VALIDAÇÃO DE DATA NO CONTEÚDO
      // ==========================================

      const agora = new Date();

      const diaAtual =
        String(agora.getDate()).padStart(2, "0");

      const mesAtual =
        String(agora.getMonth() + 1).padStart(2, "0");

      const anoAtual =
        String(agora.getFullYear());

      const dataAtualBR =
        `${diaAtual}/${mesAtual}/${anoAtual}`;

      if (buscaAtual && resultados.length > 1) {

        resultadosFiltrados =
          resultados
            .map((resultado) => {

              const titulo =
                String(resultado?.title || "")
                  .normalize("NFD")
                  .replace(/[\\u0300-\\u036f]/g, "")
                  .toLowerCase();

              const conteudo =
                String(resultado?.content || "")
                  .normalize("NFD")
                  .replace(/[\\u0300-\\u036f]/g, "")
                  .toLowerCase();

              const texto =
                `${titulo} ${conteudo}`;

              let pontos = 0;

              // ==========================================
              // 📅 DATA EXPLÍCITA DE HOJE
              // ==========================================

              const dataHoje =
                texto.includes(dataAtualBR);

              if (dataHoje) {
                pontos += 40;
              }

              // ==========================================
              // 📅 DATA ANTIGA DETECTADA
              // ==========================================

              const datasEncontradas =
                texto.match(
                  /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/g
                ) || [];

              const meses = {
                janeiro: 1,
                fevereiro: 2,
                marco: 3,
                março: 3,
                abril: 4,
                maio: 5,
                junho: 6,
                julho: 7,
                agosto: 8,
                setembro: 9,
                outubro: 10,
                novembro: 11,
                dezembro: 12
              };

              const datasPorExtenso =
                texto.match(
                  /\b\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}\b/g
                ) || [];

              for (const dataTexto of datasPorExtenso) {

                const partes =
                  dataTexto
                    .replace(/\s+/g, " ")
                    .split(" de ");

                if (partes.length !== 3) {
                  continue;
                }

                const dia = Number(partes[0]);
                const mes = meses[partes[1]];
                const ano = Number(partes[2]);

                if (
                  !mes ||
                  ano !== agora.getFullYear() ||
                  mes !== agora.getMonth() + 1 ||
                  dia !== agora.getDate()
                ) {
                  datasEncontradas.push(dataTexto);
                }

              }

              for (const dataTexto of datasEncontradas) {

                const partes =
                  dataTexto.replace(/-/g, "/").split("/");

                if (partes.length !== 3) {
                  continue;
                }

                const dia =
                  Number(partes[0]);

                const mes =
                  Number(partes[1]);

                const ano =
                  Number(partes[2]);

                if (
                  ano !== agora.getFullYear() ||
                  mes !== agora.getMonth() + 1 ||
                  dia !== agora.getDate()
                ) {
                  pontos -= 50;
                }
              }

              // ==========================================
              // 🔎 RELEVÂNCIA TEMPORAL
              // ==========================================

              if (
                titulo.includes("tempo agora") ||
                titulo.includes("agora")
              ) {
                pontos += 30;
              }

              if (texto.includes("tempo agora")) {
                pontos += 15;
              }

              if (
                texto.includes("no momento") ||
                texto.includes("neste momento")
              ) {
                pontos += 12;
              }

              if (texto.includes("temperatura atual")) {
                pontos += 12;
              }

              if (texto.includes("esta fazendo")) {
                pontos += 10;
              }

              if (texto.includes("agora")) {
                pontos += 5;
              }

              if (texto.includes("hoje")) {
                pontos += 2;
              }

              // ==========================================
              // 🚫 CONTEÚDO FUTURO / HISTÓRICO
              // ==========================================

              if (titulo.includes("previsao para 5 dias")) {
                pontos -= 25;
              }

              if (titulo.includes("15 dias")) {
                pontos -= 30;
              }

              if (
                texto.includes("historico") ||
                texto.includes("histórico")
              ) {
                pontos -= 20;
              }

              if (texto.includes("previsao para cinco dias")) {
                pontos -= 25;
              }

              return {
                resultado,
                pontos,
                dataHoje,
                datasEncontradas,
                dataAntiga:
                  possuiDataExplicita && !dataHoje
              };

            })
            .filter(item => !item.dataAntiga)
            .sort((a, b) => {

              if (b.pontos !== a.pontos) {
                return b.pontos - a.pontos;
              }

              return (
                Number(b.resultado?.score || 0) -
                Number(a.resultado?.score || 0)
              );

            })
            .slice(0, 3)
            .map(item => item.resultado);



      // ==========================================
        }
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

      if (resultadosFiltrados.length > 0) {

        resposta.push(
          "\n\n### FONTES DA PESQUISA"
        );

        resultadosFiltrados.forEach(
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
        resultadosFiltrados.length
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


  
  async executar(query) {
    // Tenta primeiro a Tavily
    const resultadoTavily = await this.buscarNaWeb(query);
    
    if (resultadoTavily) {
      return resultadoTavily;
    }
    
    // Se Tavily falhar, usa DuckDuckGo
    console.log("⚠️ Tavily falhou. Tentando DuckDuckGo...");
    return await this.fallbackDuckDuckGo(query);
  }


  async fallbackDuckDuckGo(query) {
    try {
      console.log("🌐 Tavily indisponível. Usando DuckDuckGo Fallback...");
      const searchRes = await search(query);
      if (!searchRes || !searchRes.results || searchRes.results.length === 0) {
        return null;
      }
      const topResults = searchRes.results.slice(0, 5).map(r => `• [${r.title}](${r.url}): ${r.description}`).join("

");
      return `FONTE: DuckDuckGo (Busca Gratuita)

${topResults}`;
    } catch (e) {
      console.error("❌ Erro no fallback DuckDuckGo:", e.message);
      return null;
    }
  }

module.exports = new AgentePesquisador();
