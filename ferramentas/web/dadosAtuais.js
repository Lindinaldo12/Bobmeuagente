const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ARQ_CTX = path.join(__dirname, "../../memoria/contexto_conversa.json");

let contextos = {};
try { contextos = JSON.parse(fs.readFileSync(ARQ_CTX, "utf8")); } catch (e) { contextos = {}; }

function salvarCtx() {
  try {
    fs.mkdirSync(path.dirname(ARQ_CTX), { recursive: true });
    fs.writeFileSync(ARQ_CTX, JSON.stringify(contextos, null, 2));
  } catch (e) {}
}

function ctxDe(userId) {
  const id = String(userId || "anonimo");
  if (!contextos[id]) contextos[id] = { ultimoTopico: null, ultimaCidade: null, ultimaMoeda: "USD" };
  return contextos[id];
}

function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const IGNORAR = ["hoje","agora","atualmente","atual","amanha","neste","nesse","momento","no","na","em","de","do","da","paraiba","pb","brasil","br","qual","quais","clima","temperatura","tempo","previsao","vai","chover","chuva","chovendo","esta","estava","faz","fazendo","e","o","a","um","uma","me","fala","diz","conta","sobre"];

function detectarTopico(t) {
  if (/(clima|temperatura|chover|chuva|chovendo|previsao do tempo|tempo agora|tempo em)/.test(t)) return "clima";
  if (/(cotacao|dolar|euro|cambio|usd|eur)/.test(t)) return "cambio";
  return null;
}

function extrairCidade(original) {
  const t = String(original || "");
  const m = t.match(/(?:^|\s)(?:em|de|para)\s+(.+)$/i);
  const bruto = (m ? m[1] : t).replace(/[?!.,;:]+/g, " ");
  const palavras = bruto.split(/\s+/).filter(p => {
    const n = normalizar(p);
    return n && !IGNORAR.includes(n);
  });
  return palavras.join(" ").trim() || null;
}

function descricaoTempo(codigo) {
  const mapa = {0:"ceu limpo",1:"principalmente claro",2:"parcialmente nublado",3:"nublado",45:"neblina",48:"neblina com geada",51:"garoa fraca",53:"garoa moderada",55:"garoa intensa",61:"chuva fraca",63:"chuva moderada",65:"chuva forte",80:"pancadas fracas",81:"pancadas moderadas",82:"pancadas fortes",95:"trovoadas"};
  return mapa[codigo] || "condicao nao especificada";
}

async function buscarClima(cidade) {
  try {
    const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: cidade, count: 1, language: "pt", format: "json" }, timeout: 15000
    });
    const local = geo.data && geo.data.results && geo.data.results[0];
    if (!local) return "Nao encontrei a cidade: " + cidade + ". Tente informar a cidade e o estado.";

    const clima = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: local.latitude, longitude: local.longitude,
        current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        daily: "precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min",
        timezone: local.timezone || "America/Fortaleza", forecast_days: 1
      }, timeout: 15000
    });

    const a = clima.data.current || {};
    const d = clima.data.daily || {};
    const prob = Array.isArray(d.precipitation_probability_max) ? d.precipitation_probability_max[0] : null;
    const vol = Array.isArray(d.precipitation_sum) ? d.precipitation_sum[0] : null;
    const tMax = Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max[0] : null;
    const tMin = Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min[0] : null;
    const chuvaAgora = a.rain != null ? a.rain : a.precipitation;

    let resumo = "Nao ha indicacao forte de chuva agora.";
    if ((prob || 0) >= 60 || (vol || 0) >= 2 || (chuvaAgora || 0) > 0) resumo = "Ha possibilidade relevante de chuva hoje.";
    else if ((prob || 0) >= 30) resumo = "Possibilidade moderada de chuva hoje.";

    const nomeLocal = [local.name, local.admin1, local.country].filter(Boolean).join(", ");

    return [
      "🌦️ **Clima — " + nomeLocal + "**",
      "",
      "**Condicao:** " + descricaoTempo(a.weather_code),
      "**Temperatura agora:** " + a.temperature_2m + " °C",
      "**Umidade:** " + a.relative_humidity_2m + "%",
      "**Vento:** " + a.wind_speed_10m + " km/h",
      "**Chuva agora:** " + (chuvaAgora != null ? chuvaAgora : 0) + " mm",
      "**Prob. de chuva hoje:** " + (prob != null ? prob : 0) + "%",
      "**Volume previsto hoje:** " + (vol != null ? vol : 0) + " mm",
      "**Min/Max hoje:** " + tMin + " °C / " + tMax + " °C",
      "",
      "**Resumo:** " + resumo
    ].join("\n");
  } catch (e) {
    console.error("Erro clima:", e.message);
    return "Nao consegui obter o clima agora. Tente novamente em instantes.";
  }
}

async function buscarCambio(moeda) {
  const nome = moeda === "EUR" ? "Euro" : "Dolar americano";
  try {
    const res = await axios.get("https://economia.awesomeapi.com.br/json/last/" + moeda + "-BRL", { timeout: 12000 });
    const d = res.data && res.data[moeda + "BRL"];
    if (d && d.bid) {
      return [
        "💱 **Cotacao — " + nome + " (" + moeda + "/BRL)**",
        "",
        "**Valor:** R$ " + d.bid,
        "**Maxima do dia:** R$ " + (d.high || "-"),
        "**Minima do dia:** R$ " + (d.low || "-"),
        "**Variacao:** " + (d.pctChange || "-") + "%",
        "**Atualizado:** " + (d.create_date || "-")
      ].join("\n");
    }
  } catch (e) { console.error("AwesomeAPI falhou:", e.message); }

  try {
    const res = await axios.get("https://open.er-api.com/v6/latest/" + moeda, { timeout: 12000 });
    const brl = res.data && res.data.rates && res.data.rates.BRL;
    if (brl) return "💱 **" + nome + " (" + moeda + "/BRL):** R$ " + Number(brl).toFixed(2) + "\n(fonte: ER-API)";
  } catch (e) { console.error("ER-API falhou:", e.message); }

  return "Nao consegui obter a cotacao agora. Tente novamente em instantes.";
}

async function executar(pergunta, usuarioId) {
  const ctx = ctxDe(usuarioId);
  const t = normalizar(pergunta);

  let topico = detectarTopico(t);
  let cidade = extrairCidade(pergunta);

  const palavras = t.split(/\s+/).filter(Boolean);
  const ehContinuacao = /^e\b/.test(t) || palavras.length <= 5;

  if (!topico && ehContinuacao && ctx.ultimoTopico) {
    topico = ctx.ultimoTopico;
    console.log("🧠 Contexto: continuando topico '" + topico + "'");
  }

  if (topico === "clima") {
    if (!cidade) cidade = ctx.ultimaCidade || "João Pessoa";
    ctx.ultimoTopico = "clima";
    ctx.ultimaCidade = cidade;
    salvarCtx();
    return await buscarClima(cidade);
  }

  if (topico === "cambio") {
    const moeda = t.includes("euro") ? "EUR" : (ctx.ultimaMoeda || "USD");
    ctx.ultimoTopico = "cambio";
    ctx.ultimaMoeda = moeda;
    salvarCtx();
    return await buscarCambio(moeda);
  }

  return null;
}

module.exports = { executar };
