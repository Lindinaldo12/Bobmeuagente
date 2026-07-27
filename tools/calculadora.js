function executar(expressao) {
    try {
        const resultado = Function('"use strict"; return (' + expressao + ')')();

        return {
            sucesso: true,
            resposta: `Resultado: ${resultado}`
        };
    } catch {
        return {
            sucesso: false,
            resposta: "Expressão matemática inválida."
        };
    }
}

module.exports = {
    executar
};
