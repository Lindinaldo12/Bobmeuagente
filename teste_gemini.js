require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function testar() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const resposta = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Diga apenas: Olá!"
    });

    console.log(resposta.text);
  } catch (erro) {
    console.log(erro);
  }
}

testar();
