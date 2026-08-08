const fs = require('fs');
const path = require('path');

// O caminho do nosso "Caderno"
const ARQUIVO_CADERNO = path.join(__dirname, 'fatos.json');

// Função para LER o caderno
function lerFatos(userId) {
    if (!fs.existsSync(ARQUIVO_CADERNO)) return [];
    try {
        const dados = JSON.parse(fs.readFileSync(ARQUIVO_CADERNO, 'utf8'));
        return dados[userId] || [];
    } catch (e) {
        return [];
    }
}

// Função para ESCREVER no caderno
function adicionarFato(userId, fato) {
    let dados = {};
    if (fs.existsSync(ARQUIVO_CADERNO)) {
        try {
            dados = JSON.parse(fs.readFileSync(ARQUIVO_CADERNO, 'utf8'));
        } catch (e) {
            dados = {};
        }
    }
    
    if (!dados[userId]) {
        dados[userId] = [];
    }
    
    // Só adiciona se o fato ainda não estiver no caderno
    if (!dados[userId].includes(fato)) {
        dados[userId].push(fato);
        fs.writeFileSync(ARQUIVO_CADERNO, JSON.stringify(dados, null, 2));
        return true;
    }
    return false;
}

module.exports = { lerFatos, adicionarFato };
