const memoria = new Map();

function adicionar(usuarioId, tipo, valor, palavras = []) {

    if (!memoria.has(usuarioId)) {
        memoria.set(usuarioId, []);
    }

    memoria.get(usuarioId).push({
        tipo,
        valor,
        palavras,
        criadoEm: Date.now()
    });
}

function listar(usuarioId) {
    return memoria.get(usuarioId) || [];
}

function procurar(usuarioId, texto) {

    const registros = listar(usuarioId);

    texto = texto.toLowerCase();

    return registros.filter(item => {

        if (item.valor.toLowerCase().includes(texto)) {
            return true;
        }

        return item.palavras.some(p =>
            texto.includes(p.toLowerCase())
        );

    });
}

module.exports = {
    adicionar,
    listar,
    procurar
};
