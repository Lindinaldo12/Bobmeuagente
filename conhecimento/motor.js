const fs = require("fs");
const path = require("path");

const STOPWORDS = [
    "que",
    "como",
    "para",
    "com",
    "por",
    "uma",
    "das",
    "dos",
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
    "fale",
    "analise",
    "analisei",

    // ==========================================
    // TERMOS GENÉRICOS
    // ==========================================
    // Não ajudam a identificar um documento.
    // Evitam falsos positivos na Base de Conhecimento.

    "palavra",
    "origem",
    "historica",
    "historico",
    "criar",
    "fazer",
    "explicar",
    "nome",
    "projeto",
    "pergunta",
    "coisa",
    "coisas"
];


function normalizar(texto) {

    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


function extrairPalavras(pergunta) {

    return normalizar(pergunta)
        .split(" ")
        .filter(p =>
            p.length > 2 &&
            !STOPWORDS.includes(p)
        );
}


function detectarContexto(pergunta) {

    const texto = normalizar(pergunta);

    const contexto = {
        programacao: false,
        javascript: false,
        nodejs: false,
        linux: false
    };

    if (
        texto.includes("codigo") ||
        texto.includes("programacao") ||
        texto.includes("programar") ||
        texto.includes("funcao") ||
        texto.includes("variavel")
    ) {
        contexto.programacao = true;
    }

    if (
        texto.includes("javascript") ||
        texto.includes("js")
    ) {
        contexto.javascript = true;
        contexto.programacao = true;
    }

    if (
        texto.includes("nodejs") ||
        texto.includes("node")
    ) {
        contexto.nodejs = true;
        contexto.programacao = true;
    }

    if (
        texto.includes("linux") ||
        texto.includes("kernel")
    ) {
        contexto.linux = true;
    }

    return contexto;
}


function buscar(pergunta) {

    const palavras =
        extrairPalavras(pergunta);

    const contexto =
        detectarContexto(pergunta);

    const resultados = [];

    pesquisar(
        __dirname,
        palavras,
        contexto,
        resultados
    );

    resultados.sort(
        (a, b) => b.pontos - a.pontos
    );

    console.log(
        "===== RESULTADOS DA BUSCA ====="
    );

    for (const r of resultados) {

        console.log(
            r.nome,
            "->",
            r.pontos
        );
    }

    console.log(
        "==============================="
    );

    /*
     * Somente documentos com pontuação mínima.
     */

    return resultados
        .filter(r => r.pontos >= 10)
        .slice(0, 3);
}


function pesquisar(
    diretorio,
    palavras,
    contexto,
    resultados
) {

    const itens =
        fs.readdirSync(diretorio);

    for (const item of itens) {

        const caminho =
            path.join(diretorio, item);

        const stat =
            fs.statSync(caminho);

        if (stat.isDirectory()) {

            pesquisar(
                caminho,
                palavras,
                contexto,
                resultados
            );

            continue;
        }

        if (!item.endsWith(".md")) {
            continue;
        }

        const conteudo =
            fs.readFileSync(
                caminho,
                "utf8"
            );

        const conteudoNormalizado =
            normalizar(conteudo);

        const nome =
            normalizar(item);

        const palavrasDocumento =
            conteudoNormalizado.split(/\s+/);

        let pontos = 0;

        for (const palavra of palavras) {

            if (
                nome
                    .split(/\s+/)
                    .includes(palavra)
            ) {

                console.log(
                    `[NOME] ${item} encontrou "${palavra}"`
                );

                pontos += 8;
            }

            if (
                palavrasDocumento.includes(palavra)
            ) {

                console.log(
                    `[MATCH] ${item} encontrou "${palavra}"`
                );

                pontos += 10;
            }
        }

        /*
         * Reforço contextual.
         *
         * Isso impede que um documento genérico
         * de Linux domine uma pergunta claramente
         * relacionada a JavaScript.
         */

        if (
            contexto.javascript &&
            (
                nome.includes("javascript") ||
                nome.includes("js")
            )
        ) {

            pontos += 25;
        }

        if (
            contexto.nodejs &&
            nome.includes("node")
        ) {

            pontos += 25;
        }

        if (
            contexto.linux &&
            nome.includes("linux")
        ) {

            pontos += 25;
        }

        if (pontos > 0) {

            resultados.push({
                nome,
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
