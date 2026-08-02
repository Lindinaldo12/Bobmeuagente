function gerar(nomeFuncao) {

    return `const { ${nomeFuncao} } = require("./${nomeFuncao}");

describe("${nomeFuncao}", () => {

    test("deve executar corretamente", () => {

        expect(${nomeFuncao}()).toBeDefined();

    });

});
`;

}

module.exports = {
    gerar
};
