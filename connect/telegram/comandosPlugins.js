const pluginManager = require('../../core/pluginManager');
const auth = require('../../core/auth');

function registrarComandosPlugins(bot) {
  
  // LOJA DE PLUGINS
  bot.command('loja', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const disponiveis = pluginManager.listarPluginsDisponiveis();
    const instalados = pluginManager.obterPluginsUsuario(ctx.from.id);
    
    if (disponiveis.length === 0) {
      return ctx.reply('📭 A loja está vazia no momento. Em breve teremos novos plugins!');
    }
    
    let mensagem = '🏪 LOJA DE PLUGINS DO BOB\n━━━━━━━━━━━━━━━━━━\n\n';
    mensagem += '📲 Plugins disponíveis:\n\n';
    
    disponiveis.forEach((plugin, index) => {
      const instalado = instalados.includes(plugin.id);
      const statusEmoji = instalado ? '✅' : '📦';
      const statusTexto = instalado ? '(INSTALADO)' : '';
      
      mensagem += `${statusEmoji} ${index + 1}. ${plugin.nome} ${statusTexto}\n`;
      mensagem += `   ${plugin.descricao}\n`;
      mensagem += `   📌 Versão: ${plugin.versao}\n`;
      mensagem += `   💬 Comandos: ${plugin.comandos ? plugin.comandos.slice(0, 3).join(', ') : 'automático'}\n\n`;
    });
    
    mensagem += '━━━━━━━━━━━━━━━━━━\n';
    mensagem += '📲 Para instalar: /instalar NOME_DO_PLUGIN\n';
    mensagem += '🗑️ Para desinstalar: /desinstalar NOME_DO_PLUGIN\n';
    mensagem += '📋 Ver seus plugins: /meus_plugins';
    
    await ctx.reply(mensagem);
  });
  
  // INSTALAR PLUGIN
  bot.command('instalar', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /instalar nome_do_plugin\n\nUse /loja para ver os disponíveis.');
    }
    
    const pluginId = args[0];
    const resultado = pluginManager.instalarPlugin(ctx.from.id, pluginId);
    
    if (resultado.sucesso) {
      const plugins = pluginManager.listarPluginsDisponiveis();
      const plugin = plugins.find(p => p.id === pluginId);
      
      let mensagem = `${resultado.mensagem}\n\n`;
      if (plugin) {
        mensagem += `📦 ${plugin.nome}\n`;
        mensagem += `${plugin.descricao}\n\n`;
        if (plugin.comandos && plugin.comandos.length > 0) {
          mensagem += `💬 Experimente dizer:\n`;
          plugin.comandos.forEach(cmd => {
            mensagem += `• "${cmd}"\n`;
          });
        }
      }
      
      await ctx.reply(mensagem);
    } else {
      await ctx.reply(resultado.mensagem);
    }
  });
  
  // DESINSTALAR PLUGIN
  bot.command('desinstalar', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /desinstalar nome_do_plugin\n\nUse /meus_plugins para ver os instalados.');
    }
    
    const resultado = pluginManager.desinstalarPlugin(ctx.from.id, args[0]);
    await ctx.reply(resultado.mensagem);
  });
  
  // MEUS PLUGINS
  bot.command('meus_plugins', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const plugins = pluginManager.listarPluginsUsuarioDetalhado(ctx.from.id);
    
    if (plugins.length === 0) {
      return ctx.reply('📭 Você não tem plugins instalados.\n\nUse /loja para ver os disponíveis!');
    }
    
    let mensagem = '📲 SEUS PLUGINS INSTALADOS\n━━━━━━━━━━━━━━━━━━\n\n';
    
    plugins.forEach((plugin, index) => {
      mensagem += `${index + 1}. ${plugin.nome}\n`;
      mensagem += `   ${plugin.descricao}\n`;
      mensagem += `   📌 v${plugin.versao}\n\n`;
    });
    
    mensagem += '━━━━━━━━━━━━━━━━━━\n';
    mensagem += '💡 Dica: Cada plugin responde a comandos específicos. Experimente!';
    
    await ctx.reply(mensagem);
  });
}

module.exports = { registrarComandosPlugins };
