const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function processarArquivo(ctx, bot, doc) {
  try {
    console.log("1. Iniciando processamento de arquivo...");
    
    const fileId = doc.file_id || doc.fileId;
    const fileName = doc.file_name || doc.fileName || 'arquivo_baixado.pdf';
    const fileType = fileName.split('.').pop().toLowerCase();

    console.log(`2. Arquivo: ${fileName}, Tipo: ${fileType}`);

    if (!fileId) {
      return { sucesso: false, erro: "ID do arquivo não encontrado." };
    }
    
    // 1. Obter informações do arquivo
    console.log("3. Buscando informações do arquivo na API do Telegram...");
    const file = await bot.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    
    // 2. Baixar o arquivo
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);
    console.log(`4. Baixando arquivo para: ${filePath}`);
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Falha ao baixar: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`5. Arquivo baixado com sucesso. Tamanho: ${buffer.length} bytes`);

    let conteudoExtraido = "";

    // 3. Extrair o conteúdo
    if (fileType === 'pdf') {
      console.log("6. Lendo PDF com pdf-parse v1.1.1...");
      // Na versão 1.1.1, passamos o buffer diretamente
      const data = await pdf(buffer);
      conteudoExtraido = data.text;
      console.log(`7. PDF lido com sucesso. Caracteres extraídos: ${conteudoExtraido.length}`);
    } else if (fileType === 'txt') {
      console.log("6. Lendo arquivo de texto...");
      conteudoExtraido = fs.readFileSync(filePath, 'utf8');
    } else {
      return { sucesso: false, erro: `Formato .${fileType} não suportado.` };
    }

    // 4. Limpar arquivo temporário
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("8. Arquivo temporário removido.");
    }

    return {
      sucesso: true,
      nome: fileName,
      conteudo: conteudoExtraido.substring(0, 6000)
    };

  } catch (error) {
    console.error("❌ Erro CRÍTICO ao processar arquivo:", error);
    return { sucesso: false, erro: `Falha interna: ${error.message}` };
  }
}

module.exports = { processarArquivo };
