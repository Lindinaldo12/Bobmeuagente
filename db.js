const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'bob-memoria.json');

let dados = {};

function carregar() {
  try {
    if (fs.existsSync(DB_PATH)) {
      dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Falha ao ler memoria:', err.message);
    dados = {};
  }
}

function gravar() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dados), 'utf8');
  } catch (err) {
    console.error('Falha ao gravar memoria:', err.message);
  }
}

carregar();

function salvar(chatId, role, content) {
  const id = String(chatId);
  if (!dados[id]) dados[id] = [];
  dados[id].push({ role, content, em: Date.now() });
  gravar();
}

function buscar(chatId, limite) {
  const id = String(chatId);
  const lista = dados[id] || [];
  return lista.slice(-limite).map((m) => ({ role: m.role, content: m.content }));
}

function limpar(chatId) {
  delete dados[String(chatId)];
  gravar();
}

module.exports = { salvar, buscar, limpar };
