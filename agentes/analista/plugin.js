const fs = require("fs");
const path = require("path");
const { executarEspecialista } = require("../../ia/agenteEspecialista");

const prompt = fs.readFileSync(
    path.join(__dirname, "prompt.txt"),
    "utf8"
);

async function executar(contexto) {
    return await executarEspecialista(
        contexto.texto,           // 1. O texto da pergunta
        contexto.conhecimento,    // 2. A base de conhecimento
        prompt,                   // 3. O prompt do agente
        contexto.usuario          // 4. O usuário (crachá com ID)
    );
}

module.exports = {
    executar
};
