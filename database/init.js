const database = require("./database");

async function inicializarBanco() {
    await database.conectar();
    console.log("✅ Banco inicializado.");
}

module.exports = {
    inicializarBanco
};
