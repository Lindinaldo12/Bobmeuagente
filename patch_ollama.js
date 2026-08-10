const fs = require('fs');
let code = fs.readFileSync('bot.js', 'utf8');

// Substituir chamadas perigosas de Ollama por versões seguras
code = code.replace(
  /execSync\(['"]ollama[^)]*\)/g,
  '(() => { try { return require("child_process").execSync($&); } catch(e) { console.log("⚠️ Ollama não disponível, ignorando..."); return null; } })()'
);

code = code.replace(
  /spawn\(['"]ollama[^)]*\)/g,
  '(() => { try { return require("child_process").spawn($&); } catch(e) { console.log("⚠️ Ollama não disponível, ignorando..."); return null; } })()'
);

// Adicionar verificação no início
if (!code.includes('USE_OLLAMA')) {
  code = 'const USE_OLLAMA = process.env.USE_OLLAMA !== "false";\n' + code;
}

fs.writeFileSync('bot.js', code);
console.log('✅ bot.js patcheado com segurança contra Ollama!');
