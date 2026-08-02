const { carregarFerramentas } = require("./carregador");

function listar() {

    return carregarFerramentas().map(f => ({
        nome: f.nome || "Sem nome",
        categoria: f.categoria || "Outros",
        versao: f.versao || "1.0.0",
        descricao: f.descricao || "",
        exemplos: f.exemplos || []
    }));

}

function ajuda() {

    const ferramentas = listar();

    let resposta = "🧰 Posso fazer o seguinte:\n\n";

    for (const f of ferramentas) {

        resposta += `📂 ${f.categoria}\n`;
        resposta += `• ${f.nome}\n`;

        if (f.exemplos.length > 0) {

            for (const exemplo of f.exemplos) {
                resposta += `   ◦ ${exemplo}\n`;
            }

        }

        resposta += "\n";
    }

    return resposta;
}

module.exports = {
    listar,
    ajuda
};
