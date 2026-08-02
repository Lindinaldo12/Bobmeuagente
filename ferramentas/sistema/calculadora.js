function executar(texto) {

    const pergunta = texto.toLowerCase().trim();

    const regex = /^(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)$/;

    const match = pergunta.match(regex);

    if (!match) {
        return null;
    }

    const a = Number(match[1]);
    const op = match[2];
    const b = Number(match[3]);

    let resultado;

    switch (op) {

        case "+":
            resultado = a + b;
            break;

        case "-":
            resultado = a - b;
            break;

        case "*":
            resultado = a * b;
            break;

        case "/":
            if (b === 0) {
                return "Não é possível dividir por zero.";
            }
            resultado = a / b;
            break;

        default:
            return null;
    }

    return `Resultado: ${resultado}`;
}

module.exports = {
    nome: "Calculadora",
    categoria: "Sistema",
    versao: "1.0.0",
    descricao: "Realiza operações matemáticas básicas.",

    exemplos: [
        "10 + 5",
        "25 * 8",
        "100 / 4",
        "7 - 3"
    ],

    executar
};
