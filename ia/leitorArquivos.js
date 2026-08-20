const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

async function extrairTextoDeArquivo(caminhoArquivo, mimeType) {
  try {
    console.log(`📄 Analisando arquivo: ${mimeType}`);

    if (mimeType.includes('text') || caminhoArquivo.endsWith('.txt') || caminhoArquivo.endsWith('.md')) {
      return fs.readFileSync(caminhoArquivo, 'utf-8');
    }

    if (mimeType.includes('pdf')) {
      const dataBuffer = fs.readFileSync(caminhoArquivo);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }

    if (mimeType.includes('image')) {
      console.log('👁️ Iniciando reconhecimento visual OCR (Isso pode levar alguns segundos)...');
      const { data: { text } } = await Tesseract.recognize(caminhoArquivo, 'por');
      return text;
    }

    return "❌ Formato não suportado. Envie PDF, TXT ou Imagens.";
  } catch (erro) {
    console.error("❌ Erro ao ler arquivo:", erro.message);
    return "❌ Erro ao tentar ler o conteúdo do arquivo.";
  }
}

module.exports = { extrairTextoDeArquivo };
