require('dotenv').config();

function primeiro(...nomes) {
  for (const nome of nomes) {
    const valor = process.env[nome];
    if (valor && String(valor).trim()) return String(valor).trim();
  }
  return '';
}

function lista(...nomes) {
  const bruto = primeiro(...nomes);
  if (!bruto) return [];
  return bruto
    .replace(/[\[\]"]/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function numero(nome, padrao) {
  const v = parseInt(process.env[nome] || '', 10);
  return Number.isFinite(v) ? v : padrao;
}

const MODELOS_CANDIDATOS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];

const modeloPedido = primeiro('AI_MODEL');
const modelos = modeloPedido
  ? [modeloPedido, ...MODELOS_CANDIDATOS.filter((m) => m !== modeloPedido)]
  : MODELOS_CANDIDATOS;

const config = {
  telegramToken: primeiro('TELEGRAM_TOKEN', 'TELEGRAM_BOT_TOKEN', 'BOT_TOKEN'),
  googleKey: primeiro('GOOGLE_API_KEY', 'AI_API_KEY', 'GEMINI_API_KEY'),
  fallbackKey: primeiro('AI_FALLBACK_KEY', 'OPENROUTER_API_KEY'),
  fallbackUrl: primeiro('AI_FALLBACK_URL') || 'https://openrouter.ai/api/v1',
  fallbackModel: primeiro('AI_FALLBACK_MODEL') || 'google/gemini-3.8-flash',
  modelos,
  temperatura: parseFloat(primeiro('AI_TEMPERATURE') || '0.7'),
  maxTokens: numero('AI_MAX_TOKENS', 2048),
  botName: primeiro('BOT_NAME') || 'Bob IA',
  persona:
    primeiro('BOT_PERSONA') ||
    'Voce e o Bob, assistente pessoal direto e objetivo. Responda em portugues do Brasil, com respostas curtas.',
  allowedIds: lista('BOT_ALLOWED_IDS'),
  adminIds: lista('ADMIN_IDS'),
  masterId: primeiro('BOB_MASTER_ID', 'MASTER_ID'),
  maxHistorico: numero('MAX_HISTORICO', 20),
  maxCharsArquivo: numero('MAX_CHARS_ARQUIVO', 10000),
  rateLimit: numero('RATE_LIMIT_PER_MIN', 10),
  supabaseUrl: primeiro('SUPABASE_URL'),
  supabaseKey: primeiro('SUPABASE_KEY'),
  cronSecret: primeiro('CRON_SECRET'),
  cronMessage: primeiro('CRON_MESSAGE') || '',
  cronTarget: primeiro('CRON_TARGET'),
  tz: primeiro('TZ') || 'America/Sao_Paulo',
};

process.env.TZ = config.tz;

config.acessoLiberado = config.allowedIds.length === 0;
config.temIA = Boolean(config.googleKey || config.fallbackKey);
config.temBanco = Boolean(config.supabaseUrl && config.supabaseKey);

module.exports = config;
