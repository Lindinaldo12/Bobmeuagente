function registrarAdmin(bot) {

    bot.command("admin", async (ctx) => {

        await ctx.reply(
`👑 Painel Master Admin

1️⃣ Usuários

2️⃣ Autorizar usuário

3️⃣ Bloquear usuário

4️⃣ Desbloquear usuário

5️⃣ Estatísticas

6️⃣ Configurações

🚧 Em desenvolvimento.`
        );

    });

}

module.exports = {
    registrarAdmin
};
