const fs = require("fs");
const path = require("path");
const { executarEspecialista } = require("../../ia/agenteEspecialista");
const { pesquisarNaWeb } = require("../../ferramentas/pesquisaWeb");

const prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8");

async function executar(contexto) {
    let conhecimentoFinal = contexto.conhecimento || "";

    // SE NÃO TIVER INFORMAÇÃO LOCAL, USA O BINÓCULO VIP!
    if (!conhecimentoFinal || conhecimentoFinal.trim() === "") {
        console.log("📡 Base local vazia. Programador ativando busca na Web...");
        const resultadoWeb = await pesquisarNaWeb(contexto.texto);
        conhecimentoFinal = resultadoWeb;
    }

    // REGRA ANTI-ALUCINAÇÃO
    const regraAntiAlucinacao = "\n\n⚠️ REGRA ABSOLUTA: Se os 'DADOS REAIS DA WIKIPEDIA' acima não responderem à pergunta, responda apenas: 'Desculpe, não encontrei essa informação.' NUNCA invente fatos.";

    return await executarEspecialista(
        contexto.texto,
        conhecimentoFinal + regraAntiAlucinacao,
        prompt,
        contexto.usuario
    );
}

module.exports = { executar };
