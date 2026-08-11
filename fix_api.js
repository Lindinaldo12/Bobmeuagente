const fs = require('fs');
let code = fs.readFileSync('ia/apiExterna.js', 'utf8');

// Substituir a parte do histórico por uma versão à prova de falhas
const oldHistoryBlock = `  // Se tiver histórico no objeto do usuário, adicionamos as últimas 4 mensagens para dar contexto
  if (contextoUsuario && contextoUsuario.historico && Array.isArray(contextoUsuario.historico)) {
    const historicoRecente = contextoUsuario.historico.slice(-4); // Pega as últimas 4 interações
    messages = messages.concat(historicoRecente);
  }`;

const newHistoryBlock = `  // Se tiver histórico, formatamos corretamente para garantir 'role' e 'content'
  if (contextoUsuario && contextoUsuario.historico && Array.isArray(contextoUsuario.historico)) {
    const historicoRecente = contextoUsuario.historico.slice(-4);
    
    historicoRecente.forEach(msg => {
      // Formato 1: Já está no padrão OpenAI
      if (msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content });
      } 
      // Formato 2: Salvo como pergunta/resposta
      else if (msg.pergunta && msg.resposta) {
        messages.push({ role: 'user', content: msg.pergunta });
        messages.push({ role: 'assistant', content: msg.resposta });
      }
      // Formato 3: Objeto bruto do Telegram
      else if (msg.text && msg.from) {
        const role = msg.from.is_bot ? 'assistant' : 'user';
        messages.push({ role: role, content: msg.text });
      }
    });
  }`;

if (code.includes(oldHistoryBlock)) {
  code = code.replace(oldHistoryBlock, newHistoryBlock);
  fs.writeFileSync('ia/apiExterna.js', code);
  console.log("✅ ia/apiExterna.js corrigido com sucesso!");
} else {
  console.log("⚠️ Bloco de histórico não encontrado exatamente como esperado. Verifique manualmente.");
}
