const fs = require("fs");
const path = require("path");

const ARQ = path.join(__dirname, "../memoria/fatos_aprendidos.json");

let fatos = [];
try { fatos = JSON.parse(fs.readFileSync(ARQ, "utf8")); } catch (e) { fatos = []; }

function salvar() {
  try {
    fs.mkdirSync(path.dirname(ARQ), { recursive: true });
    fs.writeFileSync(ARQ, JSON.stringify(fatos, null, 2));
  } catch (e) { console.error("Erro ao salvar fatos:", e.message); }
}

function normalizar(texto) {
  return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function extrairComandoAprender(texto) {
  const m = String(texto || "").match(/^(?:bob[,!\s]*)?(?:lembre(?:-se)?(?:\s+que)?|lembra(?:\s+que)?|aprenda(?:\s+que)?|memorize(?:\s+que)?|guarde(?:\s+que)?|anote(?:\s+que)?|nunca\s+esqueca(?:\s+que)?|grave(?:\s+que)?)\s*[:\-]?\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function extrairComandoEsquecer(texto) {
  const m = String(texto || "").match(/^(?:bob[,!\s]*)?(?:esqueca(?:\s+que)?|esquecer|apague(?:\s+que)?|delete(?:\s+que)?)\s*[:\-]?\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function aprender(fato, userId) {
  const existe = fatos.some(f => normalizar(f.fato) === normalizar(fato));
  if (existe) return { repetido: true, total: fatos.length };
  fatos.push({ fato, por: String(userId || ""), em: new Date().toISOString() });
  salvar();
  return { repetido: false, total: fatos.length };
}

function esquecer(trecho) {
  const alvo = normalizar(trecho);
  const antes = fatos.length;
  fatos = fatos.filter(f => !normalizar(f.fato).includes(alvo));
  if (fatos.length < antes) { salvar(); return antes - fatos.length; }
  return 0;
}

function listar() { return fatos; }

function buscarRelevantes(pergunta) {
  const palavras = normalizar(pergunta).split(/\s+/).filter(p => p.length > 3);
  if (palavras.length === 0) return [];
  return fatos.filter(f => {
    const n = normalizar(f.fato);
    return palavras.some(p => n.includes(p));
  }).slice(-6);
}

module.exports = { extrairComandoAprender, extrairComandoEsquecer, aprender, esquecer, listar, buscarRelevantes };
