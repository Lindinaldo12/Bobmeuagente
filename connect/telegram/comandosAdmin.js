const auth = require('../../core/auth');

function registrarComandosAdmin(bot) {
  
  // GERAR LINK DE CONVITE (só MASTER)
  bot.command('convite', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode gerar convites.');
    }
    
    const resultado = auth.gerarConvite();
    
    if (resultado.sucesso) {
      const mensagem = `🎟️ NOVO CONVITE GERADO!

📎 Link de convite:
${resultado.link}

📋 Como usar:
1. Copie o link acima
2. Envie para quem você quer convidar
3. A pessoa clica no link
4. O Bob cria a conta automaticamente
5. A pessoa recebe a senha no primeiro acesso

⚠️ Este convite é de uso único!`;
      
      await ctx.reply(mensagem);
    } else {
      await ctx.reply('❌ Erro ao gerar convite.');
    }
  });
  
  // LISTAR CONVITES (só MASTER)
  bot.command('lista_convites', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode ver convites.');
    }
    
    const convites = auth.listarConvites();
    
    if (convites.length === 0) {
      return ctx.reply('📭 Nenhum convite gerado ainda.\n\nUse /convite para gerar um novo.');
    }
    
    let mensagem = '🎟️ CONVITES GERADOS\n━━━━━━━━━━━━━━━\n\n';
    
    convites.forEach((c, index) => {
      const statusEmoji = c.usado ? '✅' : (c.ativo ? '🟢' : '🔴');
      const statusTexto = c.usado ? 'Usado' : (c.ativo ? 'Ativo' : 'Desativado');
      
      mensagem += `${index + 1}. Token: ${c.token.substring(0, 8)}...\n`;
      mensagem += `   Status: ${statusEmoji} ${statusTexto}\n`;
      mensagem += `   Criado: ${new Date(c.criado_em).toLocaleDateString('pt-BR')}\n`;
      
      if (c.usado) {
        mensagem += `   Usado por: ${c.usado_por}\n`;
        mensagem += `   Data: ${new Date(c.data_uso).toLocaleDateString('pt-BR')}\n`;
      }
      
      mensagem += `   Link: https://t.me/BobMeuAgente2_bot?start=convite_${c.token}\n\n`;
    });
    
    ctx.reply(mensagem);
  });
  
  // DESATIVAR CONVITE (só MASTER)
  bot.command('desativar_convite', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode desativar convites.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /desativar_convite TOKEN\n\nUse /lista_convites para ver os tokens.');
    }
    
    const resultado = auth.desativarConvite(args[0]);
    ctx.reply(resultado.mensagem);
  });
  
  // COMANDOS EXISTENTES (mantidos)
  bot.command('senha', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode resetar senhas.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('❌ Uso: /senha @usuario_id nova_senha');
    }
    
    const [userId, novaSenha] = args;
    const resultado = auth.resetarSenha(userId, novaSenha);
    ctx.reply(resultado.mensagem);
  });
  
  bot.command('bloquear', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode bloquear usuários.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /bloquear @usuario_id');
    }
    
    const resultado = auth.bloquearUsuario(args[0]);
    ctx.reply(resultado.mensagem);
  });
  
  bot.command('desbloquear', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode desbloquear usuários.');
    }
    
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /desbloquear @usuario_id');
    }
    
    const resultado = auth.desbloquearUsuario(args[0]);
    ctx.reply(resultado.mensagem);
  });
  
  bot.command('lista_usuarios', async (ctx) => {
    if (!auth.isMaster(ctx.from.id)) {
      return ctx.reply('🚫 Apenas o MASTER pode ver a lista.');
    }
    
    const usuarios = auth.listarUsuarios();
    let mensagem = '👥 LISTA DE USUÁRIOS\n━━━━━━━━━━━━━━━\n\n';
    
    usuarios.forEach(u => {
      const statusEmoji = u.status === 'ativo' ? '✅' : '🚫';
      const tipoEmoji = u.tipo === 'master' ? '👑' : '👤';
      mensagem += `${tipoEmoji} ${u.nome}\n`;
      mensagem += `   ID: ${u.id}\n`;
      mensagem += `   Status: ${statusEmoji} ${u.status}\n\n`;
    });
    
    ctx.reply(mensagem);
  });
  
  bot.command('minha_senha', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('❌ Uso: /minha_senha nova_senha');
    }
    
    const resultado = auth.mudarPropriaSenha(ctx.from.id, args[0]);
    ctx.reply(resultado.mensagem);
  });
  
  bot.command('minhas_config', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const prefs = auth.obterPreferencias(ctx.from.id);
    let mensagem = '⚙️ SUAS CONFIGURAÇÕES\n━━━━━━━━━━━━━━━\n\n';
    mensagem += `Estilo: ${prefs.estilo_resposta}\n`;
    mensagem += `Emojis: ${prefs.usar_emojis ? '✅' : '❌'}\n`;
    mensagem += `Idioma: ${prefs.idioma}\n`;
    mensagem += `Tamanho: ${prefs.tamanho_resposta}\n`;
    
    ctx.reply(mensagem);
  });
  
  bot.command('configurar', async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const mensagem = `⚙️ CONFIGURAR PREFERÊNCIAS

/configurar estilo=formal
/configurar emojis=false
/configurar tamanho=curto

Opções:
• estilo: normal, formal, tecnico, criativo
• emojis: true, false
• tamanho: curto, medio, longo`;
    
    ctx.reply(mensagem);
  });
  
  bot.hears(/^\/configurar\s+(.+)$/i, async (ctx) => {
    if (!auth.isAutenticado(ctx.from.id)) {
      return ctx.reply('🚫 Você precisa fazer login primeiro.');
    }
    
    const comando = ctx.match[1];
    const [chave, valor] = comando.split('=');
    
    const novasPreferencias = {};
    
    if (chave === 'estilo') {
      novasPreferencias.estilo_resposta = valor;
    } else if (chave === 'emojis') {
      novasPreferencias.usar_emojis = valor === 'true';
    } else if (chave === 'tamanho') {
      novasPreferencias.tamanho_resposta = valor;
    } else {
      return ctx.reply('❌ Opção inválida.');
    }
    
    const resultado = auth.atualizarPreferencias(ctx.from.id, novasPreferencias);
    ctx.reply(resultado.mensagem);
  });
}

module.exports = { registrarComandosAdmin };
