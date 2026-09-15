"use strict";
const NIVEIS = { debug: 10, info: 20, warn: 30, error: 40 };
class Logger {
  constructor({ nivel = "info", saida = console } = {}) {
    this.nivel = NIVEIS[nivel] ?? NIVEIS.info;
    this.saida = saida;
  }
  pode(nivel) { return (NIVEIS[nivel] ?? 99) >= this.nivel; }
  debug(msg, meta) { if (this.pode("debug")) this.log(msg, meta, "debug"); }
  info(msg, meta) { if (this.pode("info")) this.log(msg, meta, "info"); }
  warn(msg, meta) { if (this.pode("warn")) this.log(msg, meta, "warn"); }
  error(msg, meta) { if (this.pode("error")) this.log(msg, meta, "error"); }
  log(msg, meta, nivel) {
    const linha = `[${nivel.toUpperCase()}] ${msg}`;
    if (meta && Object.keys(meta).length) this.saida[nivel === "error" ? "error" : "log"](linha, meta);
    else this.saida[nivel === "error" ? "error" : "log"](linha);
  }
}
module.exports = Logger;
