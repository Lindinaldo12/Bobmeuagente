const axios = require("axios");

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function ehPerguntaClima(texto) {
  const t = normalizar(texto);

  return (
    t.includes("temperatura") ||
    t.includes("clima") ||
    t.includes("previsao do tempo") ||
    t.includes("vai chover") ||
    t.includes("chover") ||
    t.includes("chuva") ||
    t.includes("chovendo") ||
    t.includes("tempo agora") ||
    t.includes("tempo em")
  );
}

function ehPerguntaCambio(texto) {
  const t = normalizar(texto);

  return (
    t.includes("cotacao") ||
    t.includes("dolar") ||
    t.includes("usd") ||
    t.includes("euro") ||
    t.includes("cambio")
  );
}

function extrairCidade(texto) {
  const original = String(texto || "");

  const match = original.match(
    /\bem\s+(.+?)(?:\s+(hoje|agora|atualmente|neste momento|nesse momento)\b|[?!.]|$)/i
  );

  if (match && match[1]) {
    return match[1]
      .replace(/\b(pb|paraíba|paraiba)\b/gi, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  if (/jo[aã]o pessoa/i.test(original)) {
    return "João Pessoa";
  }

  return "João Pessoa";
}

function descricaoTempo(codigo) {
  const mapa = {
    0: "céu limpo",
    1: "principalmente claro",
    2: "parcialmente nublado",
    3: "nublado",
    45: "neblina",
    48: "neblina com geada",
    51: "garoa fraca",
    53: "garoa moderada",
    55: "garoa intensa",
    61: "chuva fraca",
    63: "chuva moderada",
    65: "chuva forte",
    80: "pancadas de chuva fracas",
    81: "pancadas de chuva moderadas",
    82: "pancadas de chuva fortes",
    95: "trovoadas"
  };

  return mapa[codigo] || "condição meteorológica não especificada";
}

function fmt(valor, unidade) {
  if (valor === undefined || valor === null || valor === "") {
    return "não informado";
  }

  return String(valor) + (unidade || "");
}

async function buscarClima(pergunta) {
  const cidade = extrairCidade(pergunta);

  const geo = await axios.get(
    "https://geocoding-api.open-meteo.com/v1/search",
    {
      params: {
        name: cidade,
        count: 1,
        language: "pt",
        format: "json"
      },
      timeout: 15000
    }
  );

  const local = geo.data && geo.data.results && geo.data.results[0];

  if (!local) {
    return null;
  }

  const clima = await axios.get(
    "https://api.open-meteo.com/v1/forecast",
    {
      params: {
        latitude: local.latitude,
        longitude: local.longitude,
        current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        daily: "precipitation_probability_max,precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min",
        timezone: local.timezone || "America/Fortaleza",
        forecast_days: 1
      },
      timeout: 15000
    }
  );

  const atual = clima.data.current || {};
  const diario = clima.data.daily || {};

  const probChuva = Array.isArray(diario.precipitation_probability_max)
    ? diario.precipitation_probability_max[0]
    : null;

  const chuvaDia = Array.isArray(diario.precipitation_sum)
    ? diario.precipitation_sum[0]
    : null;

  const tempMax = Array.isArray(diario.temperature_2m_max)
    ? diario.temperature_2m_max[0]
    : null;

  const tempMin = Array.isArray(diario.temperature_2m_min)
    ? diario.temperature_2m_min[0]
    : null;

  const chuvaAgora =
    atual.rain !== undefined && atual.rain !== null
      ? atual.rain
      : atual.precipitation;

  let conclusao = "Não há indicação forte de chuva neste momento.";

  if ((probChuva || 0) >= 60 || (chuvaDia || 0) >= 2 || (chuvaAgora || 0) > 0) {
    conclusao = "Há possibilidade relevante de chuva hoje.";
  } else if ((probChuva || 0) >= 30) {
    conclusao = "Existe possibilidade moderada de chuva hoje.";
  }

  const nomeLocal = [local.name, local.admin1, local.country]
    .filter(Boolean)
    .join(", ");

  return [
    "🌦️ **Clima atual — Open-Meteo**",
    "",
    "**Local:** " + nomeLocal,
    "**Condição:** " + descricaoTempo(atual.weather_code),
    "**Temperatura agora:** " + fmt(atual.temperature_2m, " °C"),
    "**Umidade:** " + fmt(atual.relative_humidity_2m, "%"),
    "**Vento:** " + fmt(atual.wind_speed_10m, " km/h"),
    "**Chuva agora:** " + fmt(chuvaAgora, " mm"),
    "**Probabilidade máxima de chuva hoje:** " + fmt(probChuva, "%"),
    "**Volume previsto de chuva hoje:** " + fmt(chuvaDia, " mm"),
    "**Mínima hoje:** " + fmt(tempMin, " °C"),
    "**Máxima hoje:** " + fmt(tempMax, " °C"),
    "",
    "**Resumo:** " + conclusao
  ].join("\n");
}

function moedaPedida(pergunta) {
  const t = normalizar(pergunta);

  if (t.includes("euro") || t.includes("eur")) {
    return "EUR";
  }

  return "USD";
}

async function buscarCambio(pergunta) {
  const moeda = moedaPedida(pergunta);
  const par = moeda + "-BRL";

  const resposta = await axios.get(
    "https://economia.awesomeapi.com.br/json/last/" + par,
    {
      timeout: 15000
    }
  );

  const chave = moeda + "BRL";
  const dados = resposta.data && resposta.data[chave];

  if (!dados || !dados.bid) {
    return null;
  }

  const nomeMoeda = moeda === "EUR" ? "Euro" : "Dólar americano";

  return [
    "💱 **Cotação atual — AwesomeAPI**",
    "",
    "**Moeda:** " + nomeMoeda + " (" + moeda + "/BRL)",
    "**Compra/referência:** R$ " + dados.bid,
    "**Venda:** R$ " + (dados.ask || "não informado"),
    "**Máxima do dia:** R$ " + (dados.high || "não informado"),
    "**Mínima do dia:** R$ " + (dados.low || "não informado"),
    "**Variação:** " + (dados.pctChange || "não informado") + "%",
    "**Atualizado em:** " + (dados.create_date || "não informado")
  ].join("\n");
}

async function executar(pergunta) {
  try {
    if (ehPerguntaClima(pergunta)) {
      console.log("🌦️ Ferramenta dedicada: clima");
      return await buscarClima(pergunta);
    }

    if (ehPerguntaCambio(pergunta)) {
      console.log("💱 Ferramenta dedicada: câmbio");
      return await buscarCambio(pergunta);
    }

    return null;
  } catch (erro) {
    console.error("❌ Erro em dadosAtuais:", erro.response?.data || erro.message);
    return null;
  }
}

module.exports = {
  executar
};
