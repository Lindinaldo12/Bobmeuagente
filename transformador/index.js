function transformar(tipo, conhecimento) {
    switch (tipo) {

        case "artigo":
            return `
Escreva um artigo utilizando APENAS o conteúdo abaixo.

Regras:

- Não invente informações.
- Não acrescente fatos externos.
- Apenas reorganize o texto.
- Mantenha todas as informações da Base.

Base:

${conhecimento}
`;

        case "resumo":
            return `
Faça um resumo utilizando somente o conteúdo abaixo.

Base:

${conhecimento}
`;

        case "crianca":
            return `
Explique para uma criança de 10 anos usando somente o conteúdo abaixo.

Base:

${conhecimento}
`;

        case "comparacao":
            return `
Faça uma comparação usando somente o conteúdo abaixo.

Base:

${conhecimento}
`;

        case "passo":
            return `
Transforme o conteúdo abaixo em um passo a passo.

Base:

${conhecimento}
`;

        default:
            return conhecimento;
    }
}

module.exports = {
    transformar
};
