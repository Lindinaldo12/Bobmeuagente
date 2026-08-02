const agentes = require("../agentes/gerenciador");
const ferramentas = require("../ferramentas/gerenciador");

function gerarAjuda() {

    const listaAgentes = agentes.listar();
    const listaFerramentas = ferramentas.listar();

    let resposta = "🤖 Bob AI X\n\n";

    resposta += "📌 Agentes:\n";

    for (const agente of listaAgentes) {
        resposta += `• ${agente.nome}\n`;
    }

    resposta += "\n🧰 Ferramentas:\n";

    for (const ferramenta of listaFerramentas) {
        resposta += `• ${ferramenta.nome}\n`;
    }

    resposta += "\nDigite sua solicitação normalmente.";

    return resposta;
}

module.exports = {
    gerarAjuda
};
