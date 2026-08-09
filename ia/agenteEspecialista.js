const { chamarAPI } = require("./apiExterna");

async function executarEspecialista(perguntaUsuario, documentosDaBase, promptDoAgente, usuario) {
    console.log("🧠 Preparando o cérebro do Bob...");

    let textoBase = "";
    if (documentosDaBase) {
        if (Array.isArray(documentosDaBase)) {
            textoBase = documentosDaBase.map(doc => doc.conhecimento || doc.text || "").join("\n\n");
        } else if (typeof documentosDaBase === 'string') {
            textoBase = documentosDaBase;
        }
    }

    let memoria = "";
    if (usuario && usuario.id) {
        const memoriaLongoPrazo = require("../memoria/longoPrazo");
        const fatos = memoriaLongoPrazo.lerFatos(String(usuario.id));
        if (fatos.length > 0) {
            memoria = "\n\n🧠 MEMÓRIA SOBRE O USUÁRIO:\n- " + fatos.join("\n- ");
        }
    }

    const promptFinal = promptDoAgente + memoria + "\n\n📚 BASE DE CONHECIMENTO:\n" + textoBase;
    const perguntaCompleta = promptFinal + "\n\n❓ PERGUNTA DO USUÁRIO: " + perguntaUsuario;

    console.log(" RAIO-X: Usando API de Nuvem (OpenRouter)");
    
    const resposta = await chamarAPI(perguntaCompleta, usuario);
    
    return resposta;
}

module.exports = { executarEspecialista };
