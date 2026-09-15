"use strict";
const Pipeline = require("./pipeline");
const Logger = require("./core/logger");
const config = require("./config");
const steps = require("./steps");
const deps = {
  memoria: require("../memoria_v4/gerenciador"),
  planner: require("../planner/planner"),
  conhecimento: require("../conhecimento/gerenciador"),
  orquestrador: require("../orquestrador/orquestrador"),
  memoriaContexto: require("../memoria/contexto"),
  validadorResposta: require("../core/validadorResposta"),
  detectorAlucinacao: require("../core/detectorAlucinacao"),
  autoavaliador: require("../core/autoavaliador"),
  detectorWeb: require("../core/detectorWeb"),
  pesquisador: require("../agentes/pesquisador"),
  logger: new Logger({ nivel: process.env.LOG_LEVEL || "info" }),
  config,
};
async function executar(contexto) {
  const ctx = {
    ...contexto,
    deps,
    texto: contexto.texto,
    dadosWeb: "",
    conhecimento: null,
    resposta: null,
    respostaFinal: "",
    perguntaOriginal: "",
  };
  const pipeline = new Pipeline({
    logger: deps.logger,
    onError: ({ erro, step }) => {
      deps.logger.error(`Pipeline abortado no step ${step}`, { erro: erro.message });
      throw erro;
    },
  });
  pipeline
    .use(steps.carregarMemoria)
    .use(steps.aplicarContinuidade)
    .use(steps.pesquisarWeb)
    .use(steps.consultarConhecimento)
    .use(steps.orquestrar)
    .use(steps.validarResposta)
    .use(steps.salvarMemoria);
  const resultado = await pipeline.run(ctx);
  return resultado.respostaFinal;
}
module.exports = { executar };
