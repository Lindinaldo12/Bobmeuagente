const fs = require("fs");
const path = require("path");

// Lista de palavras que não são relevantes para busca
const STOPWORDS = [
    "que",
    "como",
    "para",
    "com",
    "por",
    "uma",
    "das",
    "dos",
    "das",
    "este",
    "esta",
    "isso",
    "isto",
    "qual",
    "quais",
    "sobre",
    "explique",
    "ensine",
    "defina",
    "mostrar",
    "mostre",
    "fale"
];

// ✅ NOVA FUNÇÃO: Normaliza texto (remove acentos, pontuação, deixa minúsculo)
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[^\w\s]/g, '')           // Remove pontuação
        .replace(/\s+/g, ' ')              // Remove espaços extras
        .trim();
}

function buscar(pergunta) {
    // Processa a pergunta em palavras-chave
    const palavras = normalizar(pergunta)
        .split(" ")
        .filter(p =>
            p.length > 2 &&
            !STOPWORDS.includes(p)
        );

    const resultados = [];
    pesquisar(__dirname, palavras, resultados);

    // Ordena por pontuação (maior primeiro)
    resultados.sort((a, b) => b.pontos - a.pontos);

    // ✅ Remove documentos sem relevância
    const relevantes = resultados.filter(r => r.pontos >= 15);

    // ✅ LOG: Mostra a pontuação de cada documento
    console.log("===== RESULTADOS DA BUSCA =====");
    for (const r of resultados) {
        console.log(
            r.nome,
            "->",
            r.pontos
        );
    }
    console.log("===============================");

    // ✅ Retorna no máximo 3 documentos
    return relevantes.slice(0, 3);
}

function pesquisar(diretorio, palavras, resultados) {
    const itens = fs.readdirSync(diretorio);

    for (const item of itens) {
        const caminho = path.join(diretorio, item);
        const stat = fs.statSync(caminho);

        if (stat.isDirectory()) {
            pesquisar(caminho, palavras, resultados);
            continue;
        }

        if (!item.endsWith(".md")) {
            continue;
        }

        const conteudo = fs.readFileSync(caminho, "utf8");
        const conteudoNormalizado = normalizar(conteudo);
        
        let pontos = 0;
        const nome = normalizar(item);

        // ✅ MODIFICAÇÃO APLICADA: Busca por palavras inteiras
        const palavrasDocumento = conteudoNormalizado.split(/\s+/);

        // Busca por cada palavra-chave
        for (const palavra of palavras) {
            if (nome.includes(palavra)) {
                console.log(
                    `[NOME] ${item} encontrou "${palavra}"`
                );
                pontos += 20;
            }

            // ✅ AGORA USA includes() no array de palavras
            if (palavrasDocumento.includes(palavra)) {
                console.log(
                    `[MATCH] ${item} encontrou a palavra "${palavra}"`
                );
                pontos += 5;
            }
        }

        if (pontos > 0) {
            resultados.push({
                nome: item,
                caminho,
                conteudo,
                pontos
            });
        }
    }
}

module.exports = {
    buscar
};
