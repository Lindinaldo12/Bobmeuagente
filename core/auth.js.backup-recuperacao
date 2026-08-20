const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USUARIOS_PATH = path.join(__dirname, '../memoria/usuarios_db.json');
const CONVITES_PATH = path.join(__dirname, '../memoria/convites_db.json');

// Inicializar bancos
function inicializarBancos() {
  if (!fs.existsSync(USUARIOS_PATH)) {
    const bancoInicial = {
      master: {
        id: process.env.MASTER_ID || '8133082447',
        senha: process.env.MASTER_PASSWORD || 'master123',
        status: 'ativo',
        preferencias: {
          estilo_resposta: 'tecnico',
          usar_emojis: true,
          idioma: 'pt-BR'
        }
      },
      usuarios: {}
    };
    fs.writeFileSync(USUARIOS_PATH, JSON.stringify(bancoInicial, null, 2));
  }
  
  if (!fs.existsSync(CONVITES_PATH)) {
    fs.writeFileSync(CONVITES_PATH, JSON.stringify({ convites: [] }, null, 2));
  }
}

function carregarBanco() {
  inicializarBancos();
  return JSON.parse(fs.readFileSync(USUARIOS_PATH, 'utf8'));
}

function carregarConvites() {
  inicializarBancos();
  return JSON.parse(fs.readFileSync(CONVITES_PATH, 'utf8'));
}

function salvarBanco(banco) {
  fs.writeFileSync(USUARIOS_PATH, JSON.stringify(banco, null, 2));
}

function salvarConvites(convites) {
  fs.writeFileSync(CONVITES_PATH, JSON.stringify(convites, null, 2));
}

function isMaster(userId) {
  const banco = carregarBanco();
  return banco.master.id === String(userId);
}

function isAutenticado(userId) {
  const banco = carregarBanco();
  if (isMaster(userId)) return true;
  const usuario = banco.usuarios[String(userId)];
  if (!usuario) return false;
  if (usuario.status === 'bloqueado') return false;
  return true;
}

// GERAR LINK DE CONVITE (só MASTER)
function gerarConvite() {
  const token = crypto.randomBytes(8).toString('hex');
  const convites = carregarConvites();
  
  const novoConvite = {
    token: token,
    criado_em: new Date().toISOString(),
    usado: false,
    usado_por: null,
    ativo: true
  };
  
  convites.convites.push(novoConvite);
  salvarConvites(convites);
  
  return {
    sucesso: true,
    token: token,
    link: `https://t.me/BobMeuAgente2_bot?start=convite_${token}`
  };
}

// VALIDAR E USAR CONVITE
function usarConvite(token, userId, nome) {
  const convites = carregarConvites();
  const convite = convites.convites.find(c => c.token === token);
  
  if (!convite) {
    return { sucesso: false, mensagem: '❌ Convite inválido ou expirado.' };
  }
  
  if (!convite.ativo) {
    return { sucesso: false, mensagem: '❌ Este convite foi desativado.' };
  }
  
  if (convite.usado) {
    return { sucesso: false, mensagem: '❌ Este convite já foi utilizado.' };
  }
  
  // Gerar senha automática
  const senha = crypto.randomBytes(4).toString('hex');
  
  // Criar usuário
  const banco = carregarBanco();
  banco.usuarios[String(userId)] = {
    id: String(userId),
    nome: nome,
    senha: senha,
    status: 'ativo',
    criado_em: new Date().toISOString(),
    primeiro_acesso: true,
    preferencias: {
      estilo_resposta: 'normal',
      usar_emojis: true,
      idioma: 'pt-BR',
      tamanho_resposta: 'medio',
      assuntos_interesse: []
    }
  };
  
  salvarBanco(banco);
  
  // Marcar convite como usado
  convite.usado = true;
  convite.usado_por = userId;
  convite.data_uso = new Date().toISOString();
  salvarConvites(convites);
  
  return {
    sucesso: true,
    mensagem: `✅ Bem-vindo(a), ${nome}!`,
    senha: senha
  };
}

// LISTAR CONVITES (só MASTER)
function listarConvites() {
  const convites = carregarConvites();
  return convites.convites;
}

// DESATIVAR CONVITE (só MASTER)
function desativarConvite(token) {
  const convites = carregarConvites();
  const convite = convites.convites.find(c => c.token === token);
  
  if (!convite) {
    return { sucesso: false, mensagem: '❌ Convite não encontrado.' };
  }
  
  convite.ativo = false;
  salvarConvites(convites);
  
  return { sucesso: true, mensagem: '✅ Convite desativado.' };
}

// FUNÇÕES EXISTENTES (mantidas)
function fazerLogin(userId, senha) {
  const banco = carregarBanco();
  const usuario = banco.usuarios[String(userId)];
  
  if (!usuario) {
    return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
  }
  
  if (usuario.status === 'bloqueado') {
    return { sucesso: false, mensagem: '🚫 Sua conta está bloqueada.' };
  }
  
  if (usuario.senha !== senha) {
    return { sucesso: false, mensagem: '❌ Senha incorreta.' };
  }
  
  usuario.primeiro_acesso = false;
  salvarBanco(banco);
  
  return { sucesso: true, mensagem: `✅ Bem-vindo(a), ${usuario.nome}!` };
}

function criarUsuario(userId, nome, senha) {
  const banco = carregarBanco();
  
  if (banco.usuarios[String(userId)]) {
    return { sucesso: false, mensagem: '❌ Usuário já existe.' };
  }
  
  banco.usuarios[String(userId)] = {
    id: String(userId),
    nome: nome,
    senha: senha,
    status: 'ativo',
    criado_em: new Date().toISOString(),
    primeiro_acesso: false,
    preferencias: {
      estilo_resposta: 'normal',
      usar_emojis: true,
      idioma: 'pt-BR',
      tamanho_resposta: 'medio',
      assuntos_interesse: []
    }
  };
  
  salvarBanco(banco);
  return { sucesso: true, mensagem: `✅ Usuário ${nome} criado!` };
}

function bloquearUsuario(userId) {
  const banco = carregarBanco();
  const usuario = banco.usuarios[String(userId)];
  
  if (!usuario) {
    return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
  }
  
  usuario.status = 'bloqueado';
  salvarBanco(banco);
  
  return { sucesso: true, mensagem: `🚫 Usuário ${usuario.nome} bloqueado.` };
}

function desbloquearUsuario(userId) {
  const banco = carregarBanco();
  const usuario = banco.usuarios[String(userId)];
  
  if (!usuario) {
    return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
  }
  
  usuario.status = 'ativo';
  salvarBanco(banco);
  
  return { sucesso: true, mensagem: `✅ Usuário ${usuario.nome} desbloqueado.` };
}

function resetarSenha(userId, novaSenha) {
  const banco = carregarBanco();
  const usuario = banco.usuarios[String(userId)];
  
  if (!usuario) {
    return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
  }
  
  usuario.senha = novaSenha;
  salvarBanco(banco);
  
  return { sucesso: true, mensagem: `✅ Senha alterada para: ${novaSenha}` };
}

function mudarPropriaSenha(userId, novaSenha) {
  const banco = carregarBanco();
  
  if (isMaster(userId)) {
    banco.master.senha = novaSenha;
  } else {
    const usuario = banco.usuarios[String(userId)];
    if (!usuario) {
      return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
    }
    usuario.senha = novaSenha;
  }
  
  salvarBanco(banco);
  return { sucesso: true, mensagem: '✅ Senha alterada!' };
}

function listarUsuarios() {
  const banco = carregarBanco();
  const lista = [];
  
  lista.push({
    id: banco.master.id,
    nome: 'MASTER (Você)',
    status: 'ativo',
    tipo: 'master'
  });
  
  Object.values(banco.usuarios).forEach(u => {
    lista.push({
      id: u.id,
      nome: u.nome,
      status: u.status,
      tipo: 'usuario'
    });
  });
  
  return lista;
}

function atualizarPreferencias(userId, novasPreferencias) {
  const banco = carregarBanco();
  
  if (isMaster(userId)) {
    banco.master.preferencias = { ...banco.master.preferencias, ...novasPreferencias };
  } else {
    const usuario = banco.usuarios[String(userId)];
    if (!usuario) {
      return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
    }
    usuario.preferencias = { ...usuario.preferencias, ...novasPreferencias };
  }
  
  salvarBanco(banco);
  return { sucesso: true, mensagem: '✅ Preferências atualizadas!' };
}

function obterPreferencias(userId) {
  const banco = carregarBanco();
  
  if (isMaster(userId)) {
    return banco.master.preferencias;
  }
  
  const usuario = banco.usuarios[String(userId)];
  return usuario ? usuario.preferencias : null;
}

module.exports = {
  isMaster,
  isAutenticado,
  fazerLogin,
  criarUsuario,
  bloquearUsuario,
  desbloquearUsuario,
  resetarSenha,
  mudarPropriaSenha,
  listarUsuarios,
  atualizarPreferencias,
  obterPreferencias,
  gerarConvite,
  usarConvite,
  listarConvites,
  desativarConvite,
  carregarBanco
};
