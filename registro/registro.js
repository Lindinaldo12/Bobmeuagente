const fs = require("fs");
const path = require("path");

const ARQUIVO = path.join(__dirname, "capacidades.json");

function listar() {
    return JSON.parse(
        fs.readFileSync(ARQUIVO, "utf8")
    );
}

function buscarAgente(texto) {

    texto = texto.toLowerCase();

    const dados = listar();

    for (const agente of dados.agentes) {

        for (const palavra of agente.palavras) {

            if (texto.includes(palavra)) {
                return agente;
            }

        }

    }

    return null;
}

module.exports = {
    listar,
    buscarAgente
};
