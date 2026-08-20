const memoriaV4 = require("../../memoria_v4/interface");

function registrarComandosMemoria(bot) {

    bot.command("lembrar", async (ctx) => {

        const texto = ctx.message.text || "";
        const fato = texto.replace("/lembrar", "").trim();

        if (!fato) {
            return ctx.reply(
                "⚠️ Use assim: /lembrar Eu me chamo Lindinaldo"
            );
        }

        const usuario = memoriaV4.carregarUsuario(
            String(ctx.from.id)
        );

        const sucesso = memoriaV4.adicionarFato(
            usuario,
            fato
        );

        memoriaV4.salvarUsuario(usuario);

        if (sucesso) {
            await ctx.reply(
                `✅ Anotei na memória: "${fato}"`
            );
        } else {
            await ctx.reply(
                "ℹ️ Eu já sabia disso!"
            );
        }
    });

    bot.command("meucaderno", async (ctx) => {

        const usuario = memoriaV4.carregarUsuario(
            String(ctx.from.id)
        );

        const fatos = usuario.conhecimentos || [];

        if (fatos.length === 0) {
            await ctx.reply(
                "📖 Minha memória sobre você está vazia."
            );
            return;
        }

        const lista = fatos
            .map((fato, i) => `${i + 1}. ${fato}`)
            .join("\n");

        await ctx.reply(
            `📖 Memória sobre você:\n\n${lista}`
        );
    });
}

module.exports = {
    registrarComandosMemoria
};
