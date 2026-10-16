'use strict';

const pdfParse = require('pdf-parse');
const { PERSONALIDADE } = require('./ia/personalidade');

const API_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';
const MAX_HISTORICO = Number(process.env.MAX_HISTORICO || 20);
const MAX_CHARS_ARQUIVO = Number(process.env.MAX_CHARS_ARQUIVO || 15000);

const historico = new Map();
const ultimoArquivo = new Map();

function getHistorico(chatId) {
  if (!historico.has(chatId)) historico.set(chatId, []);
  return historico.get(chatId);
}

function limparHistorico(chatId) {
  historico.delete(chatId);
  ultimoArquivo.delete(chatId);
}

function guardarUltimoArquivo(chatId, texto, nome) {
  ultimoArquivo.set(chatId, { texto, nome });
}

function getUltimoArquivo(chatId) {
  return ultimoArquivo.get(chatId) || null;
}

async function chamarIA(mensagens) {
  if (!API_KEY) throw new Error('AI_API_KEY não configurada.');

  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: mensagens,
      temperature: 0.7
    })
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha na API (${resposta.status}): ${erro.slice(0, 300)}`);
  }

  const dados = await resposta.json();
  const conteudo = dados?.choices?.[0]?.message?.content;
  if (!conteudo) throw new Error('Resposta vazia da API.');
  return conteudo.trim();
}

async function responder(chatId, textoUsuario) {
  const hist = getHistorico(chatId);
  hist.push({ role: 'user', content: textoUsuario });
  while (hist.length > MAX_HISTORICO) hist.shift();

  const mensagens = [{ role: 'system', content: PERSONALIDADE }, ...hist];
  const resposta = await chamarIA(mensagens);

  hist.push({ role: 'assistant', content: resposta });
  while (hist.length > MAX_HISTORICO) hist.shift();

  return resposta;
}

function extrairTexto(buffer, nomeArquivo, mimetype) {
  const nome = (nomeArquivo || '').toLowerCase();
  if (nome.endsWith('.pdf') || mimetype === 'application/pdf') {
    return pdfParse(buffer).then((d) => d.text || '');
  }
  if (nome.endsWith('.txt') || (mimetype || '').startsWith('text/')) {
    return Promise.resolve(buffer.toString('utf-8'));
  }
  return Promise.reject(new Error('Formato não suportado. Envie PDF ou TXT.'));
}

async function processarArquivo(chatId, buffer, nomeArquivo, mimetype) {
  const texto = (await extrairTexto(buffer, nomeArquivo, mimetype)).trim();
  if (!texto) throw new Error('Não consegui extrair texto do arquivo.');

  const recorte = texto.slice(0, MAX_CHARS_ARQUIVO);
  guardarUltimoArquivo(chatId, recorte, nomeArquivo);

  const instrucao = [
    `O usuário enviou o arquivo "${nomeArquivo}".`,
    'Resuma o conteúdo em português do Brasil, em no máximo 10 linhas,',
    'e liste os pontos-chave. Se houver dados numéricos, destaque.',
    '',
    'CONTEÚDO DO ARQUIVO:',
    recorte
  ].join('\n');

  return responder(chatId, instrucao);
}

async function resumirUltimoArquivo(chatId) {
  const arq = getUltimoArquivo(chatId);
  if (!arq) return 'Nenhum arquivo recente para resumir. Envie um PDF ou TXT primeiro.';

  const instrucao = [
    `Resuma novamente o arquivo "${arq.nome}" de forma mais curta (até 5 linhas).`,
    '',
    'CONTEÚDO:',
    arq.texto
  ].join('\n');

  return responder(chatId, instrucao);
}

module.exports = {
  responder,
  processarArquivo,
  resumirUltimoArquivo,
  limparHistorico,
  getUltimoArquivo
};
