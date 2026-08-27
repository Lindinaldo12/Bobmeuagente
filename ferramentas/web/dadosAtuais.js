const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ARQ_CTX = path.join(__dirname, "../../memoria/contexto_conversa.json");
const HEADERS = { "User-Agent": "BobAIX/2.0 (assistente pessoal; github.com/Lindinaldo12/Bobmeuagente)" };

let contextos = {};
try { contextos = JSON.parse(fs.readFileSync(ARQ_CTX, "utf8")); } catch (e) { contextos = {}; }

const cacheGeo = {};
const cacheClima = {};
const cacheCambio = {};

function salvarCtx() {
  try {
    fs.mkdirSync(path.dirname(ARQ_CTX), { recursive: true });
    fs.writeFileSync(ARQ_CTX, JSON.stringify(contextos, null, 2));
  } catch (e) {}
}

function ctxDe(userId) {
  const id = String(userId || "anonimo");
  if (!contextos[id]) contextos[id] = { ultimoTopico: null, ultimaCidade: "João Pessoa", ultimaMoeda: "USD" };
  return contextos[id];
}

function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function cacheGet(mapa, chave, ms) {
  const item = mapa[chave];
  if (item && Date.now() - item.ts < ms) return item.valor;
  return null;
}

function cacheSet(mapa, chave, valor) {
  mapa[chave] = { ts: Date.now(), valor };
  return valor;
}

const IGNORAR = ["hoje","agora","atualmente","atual","amanha","neste","nesse","momento","no","na","em","de","do","da","paraiba","pb","sp","brasil","br","qual","quais","clima","temperatura","tempo","previsao","vai","chover","chuva","chovendo","esta","estava","faz","e","o","a","um","uma","me","fala","diz","sobre","como","esta","ta"];

function detectarTopico(t) {
  if (/(clima|temperatura|chover|chuva|chovendo|previsao|tempo)/.test(t)) return "clima";
  if (/(cotacao|dolar|euro|cambio|usd|eur)/.test(t)) return "cambio";
  return null;
}

function extrairCidade(original) {
  const t = String(original || "");
  const m = t.match(/(?:^|\s)(?:em|de|para)\s+(.+)$/i);
  const bruto = (m ? m[1] : t).replace(/[?!.,;:]+/g, " ");
  const palavras = bruto.split(/\s+/).filter((p) => {
    const n = normalizar(p);
    return n && !IGNORAR.includes(n);
  });
  return palavras.join(" ").trim() || null;
}

function descricaoTempo(codigo) {
  const mapa = {0:"ceu limpo",1:"principalmente claro",2:"parcialmente nublado",3:"nublado",45:"neblina",51:"garoa fraca",61:"chuva fraca",63:"chuva moderada",65:"chuva forte",80:"pancadas fracas",81:"pancadas moderadas",95:"trovoadas"};
  return mapa[codigo] || "condicao nao especificada";
}

async function geocodificar(cidade) {
  const chave = normalizar(cidade);
  const hit = cacheGet(cacheGeo, chave, 24 * 60 * 60 * 1000);
  if (hit) return hit;

  const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
    params: { name: cidade, count: 1, language: "pt", format: "json" },
    headers: HEADERS,
    timeout: 12000
  });
  const local = geo.data && geo.data.results && geo.data.results[0];
  if (!local) return null;
  return cacheSet(cacheGeo, chave, local);
}

async function climaOpenMeteo(local) {
  const chave = local.latitude + "," + local.longitude;
  const hit = cacheGet(cacheClima, chave, 10 * 60 * 1000);
  if (hit) return hit;

  const clima = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: local.latitude,
      longitude: local.longitude,
      current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
      daily: "precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min",
      timezone: local.timezone || "America/Fortaleza",
      forecast_days: 1
    },
    headers: HEADERS,
    timeout: 12000
  });

  const a = clima.data.current || {};
  const d = clima.data.daily || {};
  const prob = Array.isArray(d.precipitation_probability_max) ? d.precipitation_probability_max[0] : 0;
  const vol = Array.isArray(d.precipitation_sum) ? d.precipitation_sum[0] : 0;
  const tMax = Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max[0] : "-";
  const tMin = Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min[0] : "-";
  const chuvaAgora = a.rain != null ? a.rain : (a.precipitation || 0);

  let resumo = "Nao ha indicacao forte de chuva agora.";
  if (prob >= 60 || vol >= 2 || chuvaAgora > 0) resumo = "Ha possibilidade relevante de chuva hoje.";
  else if (prob >= 30) resumo = "Possibilidade moderada de chuva hoje.";

  const nomeLocal = [local.name, local.admin1, local.country].filter(Boolean).join(", ");
  const texto = [
    "🌦️ **Clima — " + nomeLocal + "**",
    "",
    "**Condicao:** " + descricaoTempo(a.weather_code),
    "**Temperatura agora:** " + a.temperature_2m + " °C",
    "**Umidade:** " + a.relative_humidity_2m + "%",
    "**Vento:** " + a.wind_speed_10m + " km/h",
    "**Chuva agora:** " + chuvaAgora + " mm",
    "**Prob. de chuva hoje:** " + prob + "%",
    "**Volume previsto hoje:** " + vol + " mm",
    "**Min/Max hoje:** " + tMin + " °C / " + tMax + " °C",
    "",
    "**Resumo:** " + resumo
  ].join("\n");

  return cacheSet(cacheClima, chave, texto);
}

async function climaWttr(cidade) {
  const chave = "wttr:" + normalizar(cidade);
  const hit = cacheGet(cacheClima, chave, 10 * 60 * 1000);
  if (hit) return hit;

  const res = await axios.get("https://wttr.in/" + encodeURIComponent(cidade), {
    params: { format: "j1" },
    headers: HEADERS,
    timeout: 12000
  });

  const atual = res.data && res.data.current_condition && res.data.current_condition[0];
  const area = res.data && res.data.nearest_area && res.data.nearest_area[0];
  const dia = res.data && res.data.weather && res.data.weather[0];
  if (!atual) return null;

  const nome = area ? [area.areaName && area.areaName[0] && area.areaName[0].value, area.region && area.region[0] && area.region[0].value].filter(Boolean).join(", ") : cidade;
  const chance = dia && dia.hourly ? Math.max.apply(null, dia.hourly.map(function (h) { return Number(h.chanceofrain || 0); })) : 0;
  const texto = [
    "🌦️ **Clima — " + nome + "**",
    "",
    "**Condicao:** " + ((atual.lang_pt && atual.lang_pt[0] && atual.lang_pt[0].value) || atual.weatherDesc[0].value),
    "**Temperatura agora:** " + atual.temp_C + " °C",
    "**Umidade:** " + atual.humidity + "%",
    "**Vento:** " + atual.windspeedKmph + " km/h",
    "**Chance de chuva hoje:** " + chance + "%",
    "",
    "**Fonte:** wttr.in"
  ].join("\n");

  return cacheSet(cacheClima, chave, texto);
}

async function buscarClima(cidade) {
  try {
    const local = await geocodificar(cidade);
    if (local) return await climaOpenMeteo(local);
  } catch (e) {
    console.error("Open-Meteo falhou:", e.response && e.response.status, e.message);
  }
  try {
    const alt = await climaWttr(cidade);
    if (alt) return alt;
  } catch (e) {
    console.error("wttr.in falhou:", e.message);
  }
  return null;
}

async function buscarCambio(moeda) {
  const chave = moeda;
  const hit = cacheGet(cacheCambio, chave, 5 * 60 * 1000);
  if (hit) return hit;

  const nome = moeda === "EUR" ? "Euro" : "Dolar americano";

  try {
    const res = await axios.get("https://economia.awesomeapi.com.br/json/last/" + moeda + "-BRL", { timeout: 8000, headers: HEADERS });
    const d = res.data && res.data[moeda + "BRL"];
    if (d && d.bid) {
      return cacheSet(cacheCambio, chave, [
        "💱 **Cotacao — " + nome + " (" + moeda + "/BRL)**",
        "",
        "**Valor:** R$ " + d.bid,
        "**Maxima:** R$ " + (d.high || "-"),
        "**Minima:** R$ " + (d.low || "-"),
        "**Variacao:** " + (d.pctChange || "-") + "%",
        "**Atualizado:** " + (d.create_date || "-")
      ].join("\n"));
    }
  } catch (e) { console.error("AwesomeAPI falhou:", e.response && e.response.status, e.message); }

  try {
    const res = await axios.get("https://open.er-api.com/v6/latest/" + moeda, { timeout: 8000, headers: HEADERS });
    const brl = res.data && res.data.rates && res.data.rates.BRL;
    if (brl) return cacheSet(cacheCambio, chave, "💱 **" + nome + " (" + moeda + "/BRL):** R$ " + Number(brl).toFixed(2) + "\n(fonte: ER-API)");
  } catch (e) { console.error("ER-API falhou:", e.message); }

  return null;
}

async function executar(pergunta, usuarioId) {
  const ctx = ctxDe(usuarioId);
  const t = normalizar(pergunta);
  let topico = detectarTopico(t);
  let cidade = extrairCidade(pergunta);
  const ehContinuacao = /^(e|e em|e o|e a)\b/.test(t) || t.split(/\s+/).length <= 3;

  if (!topico && ehContinuacao && ctx.ultimoTopico) {
    topico = ctx.ultimoTopico;
    console.log("🧠 Continuando topico:", topico);
  }

  if (topico === "clima") {
    if (!cidade) cidade = ctx.ultimaCidade || "João Pessoa";
    ctx.ultimoTopico = "clima";
    ctx.ultimaCidade = cidade;
    salvarCtx();
    console.log("🌦️ Clima para:", cidade);
    return await buscarClima(cidade);
  }

  if (topico === "cambio") {
    const moeda = t.includes("euro") ? "EUR" : "USD";
    ctx.ultimoTopico = "cambio";
    ctx.ultimaMoeda = moeda;
    salvarCtx();
    return await buscarCambio(moeda);
  }

  return null;
}

module.exports = { executar };
