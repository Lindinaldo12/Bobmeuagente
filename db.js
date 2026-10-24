const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'bob-memoria.json');

let supabase = null;
let usarJson = false;
let dados = {};

if (config.temBanco) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('Memoria: Supabase');
  } catch (e) {
    console.error('Supabase indisponivel, usando arquivo local:', e.message);
    usarJson = true;
  }
} else {
  usarJson = true;
  console.log('Memoria: arquivo local (Supabase nao configurado)');
}

function carregarJson() {
  try {
    if (fs.existsSync(DB_PATH)) {
      dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Falha ao ler memoria:', e.message);
    dados = {};
  }
}

function gravarJson() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dados), 'utf8');
  } catch (e) {
    console.error('Falha ao gravar memoria:', e.message);
  }
}

if (usarJson) carregarJson();

function trocarParaJson(motivo) {
  console.error('Supabase falhou, trocando para arquivo local:', motivo);
  usarJson = true;
  carregarJson();
}

async function salvar(chatId, role, content) {
  if (usarJson) {
    const id = String(chatId);
    if (!dados[id]) dados[id] = [];
    dados[id].push({ role, content, em: Date.now() });
    gravarJson();
    return;
  }
  const { error } = await supabase
    .from('historico')
    .insert({ chat_id: String(chatId), role, content });
  if (error) trocarParaJson(error.message);
}

async function buscar(chatId, limite) {
  if (usarJson) {
    const lista = dados[String(chatId)] || [];
    return lista.slice(-limite).map((m) => ({ role: m.role, content: m.content }));
  }
  const { data, error } = await supabase
    .from('historico')
    .select('role, content')
    .eq('chat_id', String(chatId))
    .order('id', { ascending: false })
    .limit(limite);
  if (error) {
    trocarParaJson(error.message);
    const lista = dados[String(chatId)] || [];
    return lista.slice(-limite).map((m) => ({ role: m.role, content: m.content }));
  }
  return data.reverse();
}

async function limpar(chatId) {
  if (usarJson) {
    delete dados[String(chatId)];
    gravarJson();
    return;
  }
  const { error } = await supabase
    .from('historico')
    .delete()
    .eq('chat_id', String(chatId));
  if (error) trocarParaJson(error.message);
}

module.exports = {
  salvar,
  buscar,
  limpar,
  modo: () => (usarJson ? 'arquivo local' : 'Supabase'),
};
