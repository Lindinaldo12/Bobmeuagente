"use strict";
const PADROES_CONTINUIDADE = [
  /\b(?:resum(?:a|ir|indo|o)|explic(?:a|ar|ando)|continu(?:e|ar|ando)|detalh(?:e|ar|ando)|compar(?:e|ar|ando)|aprofund(?:e|ar))\b/i,
  /^(?:fa[çc]a\s+um\s+resumo|resumo\s+de)/i,
];
function detectarContinuidade(texto) {
  if (!texto) return false;
  return PADROES_CONTINUIDADE.some((re) => re.test(texto));
}
module.exports = {
  PADROES_CONTINUIDADE,
  detectarContinuidade,
  web: { timeoutMs: 8000, tentativas: 2 },
  ia: { timeoutMs: 15000 },
};
