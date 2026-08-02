const projetos = require("../../geradores/projetos");
const codigo = require("../../geradores/codigo");
const testes = require("../../geradores/testes");
const documentacao = require("../../geradores/documentacao");

function executar(contexto) {

    const texto = contexto.texto;
    const resposta = [];

    if (texto.toLowerCase().includes("projeto")) {

        resposta.push(
            projetos.criarProjeto("NovoProjeto")
        );
    }

    if (
        texto.toLowerCase().includes("função") ||
        texto.toLowerCase().includes("funcao")
    ) {

        resposta.push("");

        resposta.push("📄 Código:");

        resposta.push(
            codigo.gerar("funcao", "novaFuncao")
        );

        resposta.push("");

        resposta.push("🧪 Teste:");

        resposta.push(
            testes.gerar("novaFuncao")
        );

        resposta.push("");

        resposta.push("📚 Documentação:");

        resposta.push(
            documentacao.gerar(
                "novaFuncao",
                "Função"
            )
        );
    }

    if (resposta.length === 0) {

        return "👨💻 Agente Programador pronto para desenvolver.";
    }

    return resposta.join("\n");
}

module.exports = {
    executar
};
