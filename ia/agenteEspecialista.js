const memoriaLongoPrazo = require("../memoria/longoPrazo");

async function executarEspecialista(
  perguntaUsuario,
  documentosDaBase,
  promptDoAgente,
  usuario // <-- Agora recebemos o usuário aqui
) {
  console.log("🧠 Preparando o cérebro do Bob...");

  let textoBaseConhecimento = "";
  if (documentosDaBase) {
    if (Array.isArray(documentosDaBase)) {
      const textos = documentosDaBase.map(function(doc) {
        return doc.conhecimento || doc.text || "";
      });
      textoBaseConhecimento = textos.join("\n\n---\n\n");
    } else if (documentosDaBase.conhecimento) {
      textoBaseConhecimento = documentosDaBase.conhecimento;
    } else if (typeof documentosDaBase === 'string') {
      textoBaseConhecimento = documentosDaBase;
    }
  }

  let avisoBase = "";
  if (!textoBaseConhecimento) {
    avisoBase = "\n\n[AVISO]: Base de Conhecimento vazia.";
  }

  // 🧠 NOVO: Ler a memória de longo prazo do usuário
  let memoriaUsuario = "";
  if (usuario && usuario.id) {
    const fatos = memoriaLongoPrazo.lerFatos(String(usuario.id));
    if (fatos.length > 0) {
      memoriaUsuario = "\n\n🧠 MEMÓRIA SOBRE O USUÁRIO (Use estas informações para personalizar sua resposta):\n- " + fatos.join("\n- ");
    }
  }

  const promptAgente = promptDoAgente || "Você é um especialista.";

  const systemPromptFinal =
    promptAgente +
    memoriaUsuario + // <-- Injetamos a memória aqui, junto com o prompt
    "\n\n=========================\n" +
    "BASE DE CONHECIMENTO\n" +
    "=========================\n" +
    textoBaseConhecimento +
    "\n" + avisoBase +
    "\n\n[INSTRUÇÃO]: Responda usando a base de conhecimento e a memória do usuário fornecidas acima.";

  const payloadOllama = {
    model: 'qwen2.5-coder:3b',
    messages: [
      {
        role: 'system',
        content: systemPromptFinal
      },
      {
        role: 'user',
        content: typeof perguntaUsuario === 'string' ? perguntaUsuario : (perguntaUsuario.texto || 'Mensagem inválida')
      }
    ],
    stream: false
  };

  console.log("🔍 RAIO-X:");
  console.log("Modelo:", payloadOllama.model);
  console.log("Tamanho do prompt:", systemPromptFinal.length);

  try {
    console.log("🚀 Enviando para o Ollama...");
    const url = 'http://127.0.0.1:11434/api/chat';
    const opcoes = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadOllama)
    };

    const response = await fetch(url, opcoes);
    const data = await response.json();

    if (!response.ok) {
      const msgErro = data.error || "Erro";
      console.error("❌ Ollama reclamou:", msgErro);
      throw new Error(msgErro);
    }

    return data.message.content;
  } catch (error) {
    console.error("❌ Erro:", error.message);
    return "Desculpe, tive um probleminha. Tente de novo!";
  }
}

module.exports = { executarEspecialista };
