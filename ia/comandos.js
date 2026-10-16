'use strict';

const COMANDOS = {
  '/start': 'Inicia o Bob e mostra a apresentação.',
  '/help': 'Lista os comandos disponíveis.',
  '/limpar': 'Apaga o histórico da conversa neste chat.',
  '/resumo': 'Resume o último arquivo enviado.'
};

function textoAjuda() {
  const linhas = Object.entries(COMANDOS).map(([cmd, desc]) => `${cmd} — ${desc}`);
  return ['Comandos disponíveis:', ...linhas].join('\n');
}

function textoBoasVindas() {
  return [
    'Bob online.',
    '',
    'Sou seu assistente pessoal. Posso:',
    '- Conversar e responder perguntas',
    '- Ler arquivos PDF e TXT que você enviar',
    '- Resumir documentos',
    '',
    'Envie uma mensagem ou um arquivo para começar.',
    '',
    textoAjuda()
  ].join('\n');
}

module.exports = { COMANDOS, textoAjuda, textoBoasVindas };
