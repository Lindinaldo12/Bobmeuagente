const fs = require("fs");
const path = require("path");
const { executarEspecialista } = require("../../ia/agenteEspecialista");
const { pesquisarNaWeb } = require("../../ferramentas/pesquisaWeb");

const prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8");

async function executar(contexto) {
    let conhecimentoFinal = contexto.conhecimento || "";
    
    // O Pesquisador SEMPRE usa o binóculo para garantir informações atualizadas!
    console.log("📡 Agente Pesquisador ativando busca na Web...");
    const resultadoWeb = await pesquisarNaWeb(contexto.texto);
    
    // Combina o conhecimento local com o da web
    if (conhecimentoFinal && conhecimentoFinal.trim() !== "") {
        conhecimentoFinal += "\n\n--- INFORMAÇÕES ATUALIZADAS DA WEB ---\n" + resultadoWeb;
    } else {
        conhecimentoFinal = resultadoWeb;
    }

    return await executarEspecialista(
        contexto.texto,
        conhecimentoFinal,
        prompt,
        contexto.usuario
    );
}

module.exports = { executar };
