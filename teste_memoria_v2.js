const memoria = require("./memoria_v2");

let usuario = memoria.carregarUsuario(999999, "Teste");

usuario = memoria.aprender(
    usuario,
    "Meu projeto é NaldoIA"
);

usuario = memoria.aprender(
    usuario,
    "Meu objetivo é criar um agente especialista"
);

memoria.salvarUsuario(usuario);

console.log(usuario);
