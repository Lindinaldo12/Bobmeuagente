const agentes = require("../agentes/gerenciador");
const ferramentas = require("../ferramentas/gerenciador");
const metricas = require("../monitor/metricas");

function gerarStatus() {
    const qtdAgentes = agentes.listar().length;
    const qtdFerramentas = ferramentas.listar().length;
    
    const dados = metricas.obter();

    return `
🤖 Bob AI X

 STATUS DO SISTEMA

Total de requisições: ${dados.totalRequisicoes}
Total de erros: ${dados.totalErros}

Agentes monitorados: ${Object.keys(dados.agentes).length}

Versão: 3.1.0

🤖 Agentes: ${qtdAgentes}
🧰 Ferramentas: ${qtdFerramentas}
🧠 IA: Ollama
✅ Sistema funcionando normalmente.`;
}

module.exports = {
    gerarStatus
};
