"use strict";
class Pipeline {
  constructor({ steps = [], logger, onError = null } = {}) {
    this.steps = steps;
    this.logger = logger;
    this.onError = onError;
  }
  use(step) { this.steps.push(step); return this; }
  async run(ctx) {
    let atual = ctx;
    for (const step of this.steps) {
      const nome = step.name || "step_anon";
      const inicio = Date.now();
      try {
        this.logger?.debug(`[step:${nome}] iniciando`);
        const resultado = await step(atual);
        atual = resultado ?? atual;
        this.logger?.debug(`[step:${nome}] ok em ${Date.now() - inicio}ms`);
      } catch (erro) {
        this.logger?.error(`[step:${nome}] falhou`, { erro: erro.message, stack: erro.stack });
        if (!this.onError) throw erro;
        const tratado = await this.onError({ erro, step: nome, ctx: atual });
        if (tratado?.ctx) atual = tratado.ctx;
        if (tratado?.abortar) break;
      }
    }
    return atual;
  }
}
module.exports = Pipeline;
