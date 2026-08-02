require("dotenv").config();

// Módulo de memória atualizado para a versão 2
const memoria = require("../memoria_v2");

function checkPassword(password) {
  return password === process.env.ACCESS_PASSWORD;
}

function isMaster(userId) {
  return String(userId) === String(process.env.MASTER_ADMIN);
}

function isAuthorized(usuario) {
  return Boolean(usuario && usuario.autorizado === true);
}

function isBlocked(usuario) {
  return Boolean(usuario && usuario.bloqueado === true);
}

function authorizeUser(usuario) {
  if (!usuario) return null;
  
  usuario.autorizado = true;
  memoria.salvarUsuario(usuario);
  return usuario;
}

module.exports = {
  checkPassword,
  isMaster,
  isAuthorized,
  isBlocked,
  authorizeUser
};

