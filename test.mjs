import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: 'Responda apenas: Teste bem-sucedido!',
    });
    console.log("Resposta da API:", response.text);
  } catch (error) {
    console.error("Erro na API:", error.message);
  }
}

run();
