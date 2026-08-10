const fs = require('fs');
const path = require('path');
const auth = require('./auth');

const PLUGINS_DIR = path.join(__dirname, '../plugins');
const USUARIOS_PATH = path.join(__dirname, '../memoria/usuarios_db.json');

// Listar todos os plugins disponíveis
function listarPluginsDisponiveis() {
  const plugins = [];
  
  if (!fs.existsSync(PLUGINS_DIR)) return plugins;
  
  const pastas = fs.readdirSync(PLUGINS_DIR);
  
  pastas.forEach(pasta => {
    const metadataPath = path.join(PLUGINS_DIR, pasta, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        plugins.push({
          id: pasta,
          ...metadata
        });
      } catch (e) {
        console.error(`Erro ao ler metadata de ${pasta}:`, e);
      }
    }
  });
  
  return plugins;
}

// Obter plugins instalados de um usuário
function obterPluginsUsuario(userId) {
  const banco = JSON.parse(fs.readFileSync(USUARIOS_PATH, 'utf8'));
  
  if (auth.isMaster(userId)) {
    return banco.master.plugins_instalados || [];
  }
  
  const usuario = banco.usuarios[String(userId)];
  return usuario ? (usuario.plugins_instalados || []) : [];
}

// Instalar plugin para um usuário
function instalarPlugin(userId, pluginId) {
  const banco = JSON.parse(fs.readFileSync(USUARIOS_PATH, 'utf8'));
  
  // Verificar se o plugin existe
  const pluginPath = path.join(PLUGINS_DIR, pluginId, 'plugin.js');
  if (!fs.existsSync(pluginPath)) {
    return { sucesso: false, mensagem: `❌ Plugin "${pluginId}" não encontrado.` };
  }
  
  let usuario;
  if (auth.isMaster(userId)) {
    usuario = banco.master;
  } else {
    usuario = banco.usuarios[String(userId)];
  }
  
  if (!usuario) {
    return { sucesso: false, mensagem: '❌ Usuário não encontrado.' };
  }
  
  if (!usuario.plugins_instalados) {
    usuario.plugins_instalados = [];
  }
  
  if (usuario.plugins_instalados.includes(pluginId)) {
    return { sucesso: false, mensagem: `⚠️ Você já tem o plugin "${pluginId}" instalado.` };
  }
  
  usuario.plugins_instalados.push(pluginId);
  fs.writeFileSync(USUARIOS_PATH, JSON.stringify(banco, null, 2));
  
  return { sucesso: true, mensagem: `✅ Plugin "${pluginId}" instalado com sucesso!` };
}

// Desinstalar plugin de um usuário
function desinstalarPlugin(userId, pluginId) {
  const banco = JSON.parse(fs.readFileSync(USUARIOS_PATH, 'utf8'));
  
  let usuario;
  if (auth.isMaster(userId)) {
    usuario = banco.master;
  } else {
    usuario = banco.usuarios[String(userId)];
  }
  
  if (!usuario || !usuario.plugins_instalados) {
    return { sucesso: false, mensagem: '❌ Nenhum plugin instalado.' };
  }
  
  const index = usuario.plugins_instalados.indexOf(pluginId);
  if (index === -1) {
    return { sucesso: false, mensagem: `❌ Plugin "${pluginId}" não está instalado.` };
  }
  
  usuario.plugins_instalados.splice(index, 1);
  fs.writeFileSync(USUARIOS_PATH, JSON.stringify(banco, null, 2));
  
  return { sucesso: true, mensagem: `🗑️ Plugin "${pluginId}" desinstalado.` };
}

// Executar um plugin
async function executarPlugin(userId, pluginId, pergunta, contexto) {
  const pluginPath = path.join(PLUGINS_DIR, pluginId, 'plugin.js');
  
  if (!fs.existsSync(pluginPath)) {
    return { sucesso: false, mensagem: '❌ Plugin não encontrado.' };
  }
  
  try {
    const plugin = require(pluginPath);
    const resultado = await plugin.executar(pergunta, contexto);
    return { sucesso: true, resultado };
  } catch (error) {
    console.error(`Erro ao executar plugin ${pluginId}:`, error);
    return { sucesso: false, mensagem: `❌ Erro ao executar plugin: ${error.message}` };
  }
}

// Verificar se uma mensagem deve ser roteada para um plugin
function detectarPlugin(pergunta, pluginsInstalados) {
  const perguntaLower = pergunta.toLowerCase();
  
  for (const pluginId of pluginsInstalados) {
    const pluginPath = path.join(PLUGINS_DIR, pluginId, 'plugin.js');
    
    if (!fs.existsSync(pluginPath)) continue;
    
    try {
      const plugin = require(pluginPath);
      
      if (plugin.detectar && plugin.detectar(perguntaLower)) {
        return pluginId;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// Listar plugins de um usuário com detalhes
function listarPluginsUsuarioDetalhado(userId) {
  const instalados = obterPluginsUsuario(userId);
  const disponiveis = listarPluginsDisponiveis();
  
  return instalados.map(id => {
    const info = disponiveis.find(p => p.id === id);
    return info || { id, nome: id, descricao: 'Plugin sem descrição' };
  });
}

module.exports = {
  listarPluginsDisponiveis,
  obterPluginsUsuario,
  instalarPlugin,
  desinstalarPlugin,
  executarPlugin,
  detectarPlugin,
  listarPluginsUsuarioDetalhado
};
