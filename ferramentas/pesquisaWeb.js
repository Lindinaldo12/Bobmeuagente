async function pesquisarNaWeb(termoDeBusca) {
    console.log(`🔍 Bob está usando o binóculo VIP (Wikipedia) para pesquisar: "${termoDeBusca}"`);
    
    try {
        const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termoDeBusca)}&srlimit=3&format=json&origin=*`;
        
        const response = await fetch(url);
        const data = await response.json();

        // DETECTOR DE MENTIRAS: Mostra no terminal o que a Wikipedia realmente enviou
        console.log("📄 DADOS BRUTOS DA WIKIPEDIA:", JSON.stringify(data.query?.search || "Nenhum dado"));

        if (!data.query || !data.query.search || data.query.search.length === 0) {
            return "NÃO ENCONTREI DADOS NA WIKIPEDIA. NÃO INVENTE RESPOSTAS.";
        }

        const top3 = data.query.search;
        let textoFormatado = "DADOS REAIS DA WIKIPEDIA (USE APENAS ESTAS INFORMAÇÕES):\n\n";
        
        top3.forEach((item, index) => {
            const resumoLimpo = item.snippet.replace(/<[^>]*>/g, '');
            textoFormatado += `FONTE ${index + 1}: ${item.title} - ${resumoLimpo}\n`;
        });

        return textoFormatado;

    } catch (erro) {
        console.error("❌ Erro ao pesquisar na Wikipedia:", erro.message);
        return "ERRO DE CONEXÃO. NÃO INVENTE RESPOSTAS.";
    }
}

module.exports = { pesquisarNaWeb };
