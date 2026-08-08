const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const adapter = new JSONFile("./database/bob.json");

const db = new Low(adapter, {
    usuarios: [],
    memoria: [],
    historico: [],
    configuracoes: {}
});

async function conectar() {
    await db.read();

    db.data ||= {
        usuarios: [],
        memoria: [],
        historico: [],
        configuracoes: {}
    };

    await db.write();

    console.log("✅ Banco JSON carregado.");
}

module.exports = {
    db,
    conectar
};
