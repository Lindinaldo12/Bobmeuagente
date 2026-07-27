import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

async function run() {
  try {
    const list = await ai.models.list();
    console.log("Modelos disponíveis na sua conta:");
    for await (const model of list) {
      console.log("-", model.name);
    }
  } catch (error) {
    console.error("Erro ao listar:", error.message);
  }
}

run();
