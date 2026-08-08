require("dotenv").config();
const memoria = require("../memoria_v2");

// Verifica se é o dono (Master)
function isMaster(userId) {
  return String(userId) === String(process.env.MASTER_ID);
}

// Verifica se é administrador
function isAdmin(userId) {
  const adminIds = JSON.parse(process.env.ADMIN_IDS || "[]");
  return adminIds.includes(String(userId));
}

// Verifica senha administrativa
function checkPassword(password) {
  return password === process.env.ACCESS_PASSWORD;
}

// Verifica se usuário está autorizado no banco
function isAuthorized(usuario) {
  return Boolean(usuario && usuario.autorizado === true);
}

// Verifica se usuário está bloqueado
function isBlocked(usuario) {
  return Boolean(usuario && usuario.bloqueado === true);
}

// Autoriza usuário no banco
function authorizeUser(usuario) {
  if (!usuario) return null;
  usuario.autorizado = true;
  memoria.salvarUsuario(usuario);
  return usuario;
}

module.exports = {
  isMaster,
  isAdmin,
  checkPassword,
  isAuthorized,
  isBlocked,
  authorizeUser
};
