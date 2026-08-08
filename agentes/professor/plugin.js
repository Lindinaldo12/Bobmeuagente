const fs = require("fs");
const path = require("path");
const { executarEspecialista } = require("../../ia/agenteEspecialista");
const { pesquisarNaWeb } = require("../../ferramentas/pesquisaWeb");

const prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8");

async function executar(contexto) {
    let conhecimentoFinal = contexto.conhecimento || "";

    if (!conhecimentoFinal || conhecimentoFinal.trim() === "") {
        console.log("📡 Base local vazia. Professor ativando busca na Web...");
        const resultadoWeb = await pesquisarNaWeb(contexto.texto);
        conhecimentoFinal = resultadoWeb;
    }

    // REGRA ABSOLUTA ANTI-ALUCINAÇÃO
    const regraAntiAlucinacao = "\n\n⚠️ REGRA ABSOLUTA: Se os 'DADOS REAIS DA WIKIPEDIA' acima não responderem à pergunta de forma clara, você DEVE responder apenas: 'Desculpe, não encontrei essa informação confiável na minha base de dados.' NUNCA invente fatos, nomes de países ou resultados de jogos.";

    return await executarEspecialista(
        contexto.texto,
        conhecimentoFinal + regraAntiAlucinacao, // Injeta a regra no final
        prompt,
        contexto.usuario
    );
}

module.exports = { executar };
