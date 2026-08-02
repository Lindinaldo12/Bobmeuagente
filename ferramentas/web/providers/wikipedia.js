async function pesquisar(consulta) {

    const url =
        "https://pt.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(consulta);

    try {

        const resposta = await fetch(url);

        if (!resposta.ok) {
            return null;
        }

        const dados = await resposta.json();

        return {
            fonte: "Wikipedia",
            titulo: dados.title,
            resumo: dados.extract
        };

    } catch (erro) {

        return null;

    }

}

module.exports = {
    nome: "Wikipedia",
    pesquisar
};
