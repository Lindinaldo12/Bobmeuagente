const { adicionarFato, lerFatos } = require("../../memoria/longoPrazo");

function registrarComandosMemoria(bot) {
    // Comando para ensinar algo ao Bob
    bot.command("lembrar", async (ctx) => {
        const texto = ctx.message.text;
        const fato = texto.replace("/lembrar", "").trim();
        
        if (!fato) {
            return ctx.reply("⚠️ Use assim: /lembrar Eu me chamo Lindinaldo e tenho dislexia");
        }
        
        const sucesso = adicionarFato(String(ctx.from.id), fato);
        if (sucesso) {
            await ctx.reply(`✅ Anotei no meu caderno: "${fato}"`);
        } else {
            await ctx.reply("ℹ️ Eu já sabia disso! Não preciso anotar duas vezes.");
        }
    });

    // Comando para ver o que o Bob sabe
    bot.command("meucaderno", async (ctx) => {
        const fatos = lerFatos(String(ctx.from.id));
        if (fatos.length === 0) {
            await ctx.reply("📖 Meu caderno sobre você está vazio. Use /lembrar para me ensinar algo!");
        } else {
            const lista = fatos.map((f, i) => `${i + 1}. ${f}`).join("\n");
            await ctx.reply(`📖 **Meu Caderno sobre você:**\n\n${lista}`);
        }
    });
}

module.exports = { registrarComandosMemoria };
