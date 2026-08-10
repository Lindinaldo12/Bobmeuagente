async function buscarNaWeb(pergunta, historico = []) {
  console.log("🔍 Buscando na web...");
  if (typeof pergunta !== 'string') pergunta = String(pergunta);
  
  let resultados = [];
  let contextoAnterior = "";

  try {
    console.log("📚 Buscando na Wikipedia...");
    let termoDeBusca = pergunta;

    if (historico && historico.length > 0) {
      const recentes = historico.slice(-6);
      
      contextoAnterior = recentes.map(h => {
        let texto = "";
        let autor = "Usuário"; // Padrão seguro

        // 1. Tenta identificar o formato do objeto
        if (h.pergunta) {
          texto = h.pergunta;
          autor = "Usuário";
        } else if (h.resposta) {
          texto = h.resposta;
          autor = "Bob";
        } else if (h.content || h.text || h.message) {
          texto = h.content || h.text || h.message;
          // Verifica se é do bot
          if (h.role === 'assistant' || (h.from && h.from.is_bot === true)) {
            autor = "Bob";
          } else {
            autor = "Usuário";
          }
        } else if (typeof h === 'string' && h.includes('{')) {
          // Tenta fazer parse de string JSON
          try {
            const parsed = JSON.parse(h);
            if (parsed.pergunta) { texto = parsed.pergunta; autor = "Usuário"; }
            else if (parsed.resposta) { texto = parsed.resposta; autor = "Bob"; }
            else { texto = parsed.content || parsed.text || h; autor = "Usuário"; }
          } catch (e) {
            texto = h;
          }
        } else {
          texto = JSON.stringify(h);
        }

        return `${autor}: ${texto}`;
      }).join('\n');
      
      console.log("💡 CONTEXTO RECUPERADO FORMATADO:\n", contextoAnterior);

      // Expansão de consulta: pega a última pergunta do Usuário
      if (pergunta.length < 40) {
        const perguntasUsuario = recentes
          .filter(h => {
            if (h.pergunta) return true;
            if (h.role === 'user' || (h.from && h.from.is_bot === false)) return true;
            return false;
          })
          .map(h => h.pergunta || h.content || h.text || h.message || "")
          .filter(t => t && t.length > 5);
        
        if (perguntasUsuario.length > 0) {
          const ultimaPergunta = perguntasUsuario[perguntasUsuario.length - 1];
          termoDeBusca = ultimaPergunta + " " + pergunta;
          console.log("🔗 Termo de busca expandido:", termoDeBusca);
        }
      }
    }

    let searchTerm = termoDeBusca.replace(/[?¿!¡.,]/g, '').trim();
    
    // Regras de foco
    if (termoDeBusca.toLowerCase().includes('copa') && termoDeBusca.toLowerCase().includes('2022')) {
      searchTerm = "Copa do Mundo FIFA de 2022";
    } else if (termoDeBusca.toLowerCase().includes('placar') || termoDeBusca.toLowerCase().includes('final') || termoDeBusca.toLowerCase().includes('contra')) {
      searchTerm = "Final da Copa do Mundo FIFA de 2022";
    }

    const wikiResponse = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`);
    
    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      if (wikiData.extract && wikiData.extract.length > 50) {
        resultados.push({
          fonte: 'Wikipedia',
          conteudo: `Título: ${wikiData.title}\nInformação: ${wikiData.extract}`
        });
        console.log("✅ Wikipedia retornou resumo direto!");
      }
    }

    if (resultados.length === 0) {
      const searchResponse = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoDeBusca)}&format=json&origin=*`);
      const searchData = await searchResponse.json();
      if (searchData.query && searchData.query.search.length > 0) {
         resultados.push({
          fonte: 'Wikipedia Busca',
          conteudo: `Título: ${searchData.query.search[0].title}\nTrecho: ${searchData.query.search[0].snippet.replace(/<[^>]*>/g, '')}...`
        });
      }
    }
  } catch (error) {
    console.log("⚠️ Erro na busca:", error.message);
  }
  
  return { resultados, contextoAnterior };
}
module.exports = { buscarNaWeb };
