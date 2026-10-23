const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let supabase = null;

if (config.temBanco) {
  supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false },
  });
} else {
  console.error('Supabase nao configurado. Memoria desativada.');
}

async function salvar(chatId, role, content) {
  if (!supabase) return;
  const { error } = await supabase
    .from('historico')
    .insert({ chat_id: String(chatId), role, content });
  if (error) console.error('Supabase insert:', error.message);
}

async function buscar(chatId, limite) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('historico')
    .select('role, content')
    .eq('chat_id', String(chatId))
    .order('id', { ascending: false })
    .limit(limite);
  if (error) {
    console.error('Supabase select:', error.message);
    return [];
  }
  return data.reverse();
}

async function limpar(chatId) {
  if (!supabase) return;
  const { error } = await supabase
    .from('historico')
    .delete()
    .eq('chat_id', String(chatId));
  if (error) console.error('Supabase delete:', error.message);
}

module.exports = { salvar, buscar, limpar };
