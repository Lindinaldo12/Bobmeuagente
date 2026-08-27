const axios = require("axios");

function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function ehPerguntaClima(texto) {
  const t = normalizar(texto);
  return t.includes("clima") || t.includes("temperatura") || t.includes("chover") || t.includes("chuva") || t.includes("tempo");
}

function ehPerguntaCambio(texto) {
  const t = normalizar(texto);
  return t.includes("cotacao") || t.includes("dolar") || t.includes("euro") || t.includes("cambio") || t.includes("preco do");
}

// Melhoria: se o usuário disser "E em São Paulo", ele mantém São Paulo
let ultimaCidade = "João Pessoa";

function extrairCidade(texto) {
  const original = String(texto || "");
  const match = original.match(/(?:em|para|de)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)/i);
  if (match && match[1]) {
    ultimaCidade = match[1];
    return match[1];
  }
  return ultimaCidade;
}

// ... (Restante da lógica do clima e cambio permanece igual)
async function buscarClima(pergunta) {
  const cidade = extrairCidade(pergunta);
  try {
    const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", { params: { name: cidade, count: 1, language: "pt" } });
    const local = geo.data?.results?.[0];
    if (!local) return "Não encontrei a cidade: " + cidade;
    const clima = await axios.get("https://api.open-meteo.com/v1/forecast", { params: { latitude: local.latitude, longitude: local.longitude, current: "temperature_2m,weather_code", forecast_days: 1 } });
    const atual = clima.data.current;
    return `🌦️ *${local.name}*: ${atual.temperature_2m}°C.`;
  } catch(e) { return "Erro ao buscar clima."; }
}

async function buscarCambio(pergunta) {
  try {
    const moeda = pergunta.toLowerCase().includes("euro") ? "EUR" : "USD";
    const res = await axios.get("https://economia.awesomeapi.com.br/json/last/" + moeda + "-BRL");
    const data = res.data[moeda + "BRL"];
    return `💱 *${moeda === "EUR" ? "Euro" : "Dólar"}*: R$ ${data.bid}`;
  } catch(e) { return "Erro ao buscar cotação."; }
}

async function executar(pergunta) {
  if (ehPerguntaClima(pergunta)) return await buscarClima(pergunta);
  if (ehPerguntaCambio(pergunta)) return await buscarCambio(pergunta);
  return null;
}

module.exports = { executar };
