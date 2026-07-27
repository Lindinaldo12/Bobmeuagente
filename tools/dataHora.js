function executar() {
    const agora = new Date();

    return {
        sucesso: true,
        resposta: `Data e hora atuais: ${agora.toLocaleString("pt-BR")}`
    };
}

module.exports = {
    executar
};
