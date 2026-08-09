const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("./database/bob.json");
const db = low(adapter);

// Define valores padrão se o banco estiver vazio
db.defaults({
    usuarios: [],
    memoria: [],
    historico: [],
    configuracoes: {}
}).write();

async function conectar() {
    console.log("✅ Banco JSON carregado.");
}

module.exports = {
    db,
    conectar
};
