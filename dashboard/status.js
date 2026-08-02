const agentes = require("../agentes/gerenciador");
const ferramentas = require("../ferramentas/gerenciador");

function gerarStatus() {

    const qtdAgentes = agentes.listar().length;
    const qtdFerramentas = ferramentas.listar().length;

    return `🤖 Bob AI X

🟢 Sistema Online

Versão: 3.1.0

🤖 Agentes: ${qtdAgentes}

🧰 Ferramentas: ${qtdFerramentas}

🧠 IA: Ollama

✅ Sistema funcionando normalmente.`;

}

module.exports = {
    gerarStatus
};
