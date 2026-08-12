const fs = require('fs');
const path = require('path');
const { chamarAPI } = require('../../ia/apiExterna');

async function executar(pergunta, contexto) {
  console.log("🎓 Professor executando. Entrada:", pergunta);
  
  const userId = (contexto && contexto.from && contexto.from.id) ? String(contexto.from.id) : '8133082447';
  const sessaoPath = path.join(__dirname, '../../memoria/sessoes', userId + '_sessao.json');

  // 1. 🖼️ COMANDO: DESENHAR / IMAGEM (O Pincel Mágico)
  if (pergunta.toLowerCase().startsWith('/desenhar') || pergunta.toLowerCase().startsWith('/imagem')) {
    console.log("🖼️ MODO DESENHO ATIVADO!");
    const conceito = pergunta.replace(/^\/(desenhar|imagem)\s*/i, '').trim();
    
    if (!conceito) {
      return "⚠️ O que você quer que eu desenhe? Exemplo: `/desenhar um cérebro estudando`";
    }

    const promptImagem = encodeURIComponent(`${conceito}, educational illustration, clear, vibrant colors, no text, masterpiece`);
    const urlImagem = `https://image.pollinations.ai/prompt/${promptImagem}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    return `🎨 *Aqui está a representação visual de:* **${conceito}**\n\n🖼️ [Clique aqui para ver a imagem](${urlImagem})\n\n💡 _Lembre-se: IAs de desenho às vezes erram letras, mas a ideia principal está na imagem! Quer que eu explique esse conceito com palavras? É só pedir!_ 🕊️`;
  }

  // 2. 🗺️ COMANDO: MENU / AJUDA
  if (pergunta.toLowerCase().includes('/menu') || pergunta.toLowerCase().includes('/ajuda') || pergunta.toLowerCase().includes('/comandos')) {
    return `🗺️ **MAPA DO CÉREBRO DO BOB** 🗺️\n\nOi, Lindinaldo! Aqui está o que sei fazer:\n\n🧠 **/estudar** ou **/flashcards**\nTe faço perguntas sobre o que você me ensinou.\n\n🪄 **/simplificar [texto]**\nReescrevo textos difíceis de um jeito fácil, com metáforas.\n\n🖼️ **/desenhar [conceito]**\nGero uma imagem para te ajudar a visualizar o assunto.\n\n📝 **"Anote que..."** ou **"Não esqueça que..."**\nGuardo na minha memória permanente para sempre!\n\n💵 **/pesquisar dólar**\nBusco a cotação em tempo real.\n\n*Qual superpoder vamos usar agora?* 🕊️`;
  }

  // 3. 📝 AVALIAÇÃO DE FLASHCARD
  let sessaoAtiva = null;
  if (fs.existsSync(sessaoPath)) {
    try { sessaoAtiva = JSON.parse(fs.readFileSync(sessaoPath, 'utf8')); } catch (e) { sessaoAtiva = null; }
  }

  if (sessaoAtiva && !pergunta.toLowerCase().startsWith('/')) {
    console.log("📝 AVALIANDO RESPOSTA DO ALUNO...");
    const promptAvaliacao = `Você é um professor amigo avaliando a resposta.\nPERGUNTA: "${sessaoAtiva.pergunta}"\nRESPOSTA CORRETA: "${sessaoAtiva.respostaCorreta}"\nRESPOSTA DO ALUNO: "${pergunta}"\nTAREFA: Dê uma NOTA de 0 a 10. Seja natural, amigável, use emojis (🎉 👏 🧠 🕊️). Se acertou, elogie. Se errou, explique gentilmente. Termine com: "Quer tentar outra? Use /estudar!"`;
    try {
      const avaliacao = await chamarAPI("Avalie", { promptSistema: promptAvaliacao, historico: [] });
      if (fs.existsSync(sessaoPath)) {
        fs.unlinkSync(sessaoPath);
      }
      return avaliacao;
    } catch (e) { return "⚠️ Erro ao avaliar."; }
  }

  // 4. 🧠 MODO FLASHCARDS
  if (pergunta.toLowerCase().includes('/estudar') || pergunta.toLowerCase().includes('/flashcards') || pergunta.toLowerCase().includes('/quiz')) {
    console.log("🧠 MODO FLASHCARDS ATIVADO!");
    const memoriaPath = path.join(__dirname, '../../memoria/usuarios', userId + '.json');
    let fatos = [];
    if (fs.existsSync(memoriaPath)) {
      try {
        const memoria = JSON.parse(fs.readFileSync(memoriaPath, 'utf8'));
        if (memoria.memoriaLongoPrazo && Array.isArray(memoria.memoriaLongoPrazo)) {
          fatos = memoria.memoriaLongoPrazo.map(m => m.fato);
        }
      } catch (e) {}
    }
    if (fatos.length === 0) return "⚠️ Você ainda não me ensinou nada! Use 'Anote que...' para me ensinar algo.";

    const fatoAleatorio = fatos[Math.floor(Math.random() * fatos.length)];
    const promptPergunta = `Faça UMA pergunta curta e direta sobre este fato: "${fatoAleatorio}". NÃO dê a resposta. Termine com: "Estou aguardando sua resposta para te dar uma nota!"`;
    
    try {
      const perguntaGerada = await chamarAPI("Crie uma pergunta", { promptSistema: promptPergunta, historico: [] });
      fs.writeFileSync(sessaoPath, JSON.stringify({ pergunta: perguntaGerada, respostaCorreta: fatoAleatorio }, null, 2));
      return `🎓 *MODO ESTUDO ATIVADO!* 🧠\n\n${perguntaGerada}`;
    } catch (e) { return "⚠️ Erro ao gerar pergunta."; }
  }

  // 5. 🪄 MODO SIMPLIFICADOR
  if (pergunta.toLowerCase().startsWith('/simplificar') || pergunta.toLowerCase().startsWith('/resumir')) {
    console.log("🪄 MODO SIMPLIFICADOR ATIVADO!");
    const textoParaSimplificar = pergunta.replace(/^\/(simplificar|resumir)\s*/i, '').trim();
    if (!textoParaSimplificar) return "⚠️ Envie o texto junto! Ex: `/simplificar A fotossíntese é...`";

    const promptSimplificar = `Você é o Bob, melhor amigo do Lindinaldo. Reescreva o texto para uma criança de 10 anos de forma extremamente simples.\nREGRAS: 1. Frases curtas. 2. Termos importantes em **negrito**. 3. Crie uma **metáfora do dia a dia**. 4. Use emojis (🧠 🕊️ ✨). 5. APENAS Português do Brasil.\nTEXTO: "${textoParaSimplificar}"`;
    try {
      return await chamarAPI("Simplifique", { promptSistema: promptSimplificar, historico: [] });
    } catch (e) { return "⚠️ Erro ao simplificar."; }
  }
  
  // 6. LÓGICA NORMAL (Fallback)
  const promptNormal = `Você é o Bob, melhor amigo do Lindinaldo. Responda de forma natural, direta, em Português do Brasil.`;
  try {
    return await chamarAPI(pergunta, { ...contexto, promptSistema: promptNormal });
  } catch (e) {
    return "⚠️ Erro ao processar.";
  }
}

module.exports = { executar };
