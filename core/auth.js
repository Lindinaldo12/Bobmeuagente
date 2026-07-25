require("dotenv").config();

const memoria = require("../memoria/memoria");

function checkPassword(password) {
    return password === process.env.ACCESS_PASSWORD;
}

function isMaster(userId) {
    return String(userId) === String(process.env.MASTER_ADMIN_ID);
}

function isAuthorized(usuario) {
    return usuario && usuario.autorizado === true;
}

function isBlocked(usuario) {
    return usuario && usuario.bloqueado === true;
}

function authorizeUser(usuario) {
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
