function extrair(texto) {

    const memoria = {
        nome: null,
        projeto: null,
        estuda: null
    };

    let m;

    m = texto.match(/meu nome é (.+)/i);
    if (m) memoria.nome = m[1].trim();

    m = texto.match(/meu projeto (?:se chama|chama) (.+)/i);
    if (m) memoria.projeto = m[1].trim();

    m = texto.match(/estou aprendendo (.+)/i);
    if (m) memoria.estuda = m[1].trim();

    return memoria;
}

module.exports = {
    extrair
};
