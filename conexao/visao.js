"use strict";

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const MODELO_PADRAO = "google/gemini-2.0-flash-exp";

function validarToken() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN não configurado no ambiente.");
  }
  return token;
}

function validarApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("apiKey não fornecida.");
  }
  return apiKey;
}

// fetch com timeout, para a chamada nunca travar o bot.
async function buscarComTimeout(url, opcoes) {
  return fetch(url, {
    ...opcoes,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function baixarImagem(bot, fileId) {
  if (!bot?.api?.getFile) {
    throw new Error("Objeto bot inválido: bot.api.getFile ausente.");
  }
  if (!fileId) {
    throw new Error("fileId não fornecido.");
  }

  const token = validarToken();

  const file = await bot.api.getFile(fileId);
  if (!file?.file_path) {
    throw new Error("Telegram não retornou file_path para a imagem.");
  }

  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const resposta = await buscarComTimeout(url);

  if (!resposta.ok) {
    throw new Error(`Falha ao baixar imagem: HTTP ${resposta.status}`);
  }

  return Buffer.from(await resposta.arrayBuffer());
}

// Mapeia o tipo retornado pelo Telegram para o MIME usado no data URL.
function obterMime(file) {
  const mapa = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
  };

  const tipo = file?.file_path?.split(".").pop()?.toLowerCase() || "jpeg";
  return mapa[tipo] || "image/jpeg";
}

async function chamarOpenRouter(apiKey, corpo) {
  const resposta = await buscarComTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(corpo),
    }
  );

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const detalhe = dados?.error?.message || dados?.message || resposta.status;
    throw new Error(`OpenRouter HTTP ${resposta.status}: ${detalhe}`);
  }

  return dados;
}

async function analisarImagem({ bot, fileId, texto, apiKey, modelo }) {
  // Validação de entrada
  const chave = validarApiKey(apiKey);
  const prompt = texto || "Descreva o que está na imagem.";
  const nomeModelo = modelo || MODELO_PADRAO;

  // Baixa a imagem e descobre o MIME real
  const file = await bot.getFile(fileId);
  const bytes = await baixarImagem(bot, fileId);
  const base64 = bytes.toString("base64");
  const mime = obterMime(file);

  const corpo = {
    model: nomeModelo,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${base64}` },
          },
        ],
      },
    ],
  };

  // Retry em falha transitória (rede / 5xx / 429)
  let ultimoErro = null;

  for (let tentativa = 0; tentativa <= MAX_RETRIES; tentativa++) {
    try {
      const dados = await chamarOpenRouter(chave, corpo);
      const conteudo = dados?.choices?.[0]?.message?.content;

      if (!conteudo || !conteudo.trim()) {
        throw new Error("OpenRouter retornou resposta vazia.");
      }

      return conteudo.trim();
    } catch (erro) {
      ultimoErro = erro;

      // Não tenta de novo em erro de autenticação (401) ou de entrada (400)
      const codigo = Number(erro.message?.match(/HTTP (\d+)/)?.[1]);
      if (codigo === 401 || codigo === 400) {
        break;
      }

      if (tentativa < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (tentativa + 1)));
      }
    }
  }

  throw new Error(
    ultimoErro?.message || "Não foi possível analisar a imagem."
  );
}

module.exports = { analisarImagem };
