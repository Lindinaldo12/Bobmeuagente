#!/usr/bin/env node

/**
 * Doctor Agent — Agente Especialista em Programação e Segurança
 * 
 * Funções:
 * - Lê arquivos de texto (JS, Python, HTML, CSS, JSON, Markdown, etc.)
 * - Processa links (URLs) e extrai informações
 * - Executa comandos seguros com filtros
 * - Configuração via JSON/ENV
 * 
 * Uso:
 *   node doctor_agent.js [comando] [argumentos]
 * 
 * Exemplo:
 *   node doctor_agent.js read package.json
 *   node doctor_agent.js link https://github.com/Lindinaldo12/Bobmeuagente
 *   node doctor_agent.js search "const" in ./src
 * 
 * License: MIT
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { URL } = require('url');
const { WebSocket } = require('ws');

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  // Caminhos sensíveis que não podem ser lidos
  SENSITIVE_PATHS: [
    '/etc/shadow',
    '/etc/passwd',
    '/etc/sudoers',
    '/proc/self',
    '/sys/kernel',
    '/root/.ssh',
    '/home/*/.ssh'
  ],

  // Comandos permitidos
  ALLOWED_COMMANDS: [
    'cat', 'ls', 'cd', 'pwd', 'find', 'grep', 'head', 'tail',
    'echo', 'ls -la', 'tree', 'npm', 'git', 'python', 'node'
  ],

  // Comandos bloqueados (nunca devem ser executados)
  DENIED_COMMANDS: [
    'rm', 'del', 'format', 'dd', 'mkfs', 'shutdown', 'reboot', 'poweroff',
    'chmod', 'chown', 'kill', 'pkill'
  ],

  // Domínios permitidos para links
  ALLOWED_DOMAINS: [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'docs.github.com',
    'stackoverflow.com'
  ],

  // Limite de tamanho de arquivo (em bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

  // Limite de tamanho de resposta (em caracteres)
  MAX_RESPONSE_SIZE: 100000
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se o caminho está em lista de sensíveis
 */
function isSensitivePath(filePath) {
  return CONFIG.SENSITIVE_PATHS.some(p =>
    filePath.includes(p.replace('*', '.*')) ||
    filePath === p
  );
}

/**
 * Tenta adivinhar o tipo do arquivo
 */
function guessFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.txt': 'text',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sh': 'shell',
    '.toml': 'toml'
  };
  return types[ext] || 'unknown';
}

/**
 * Normaliza o path para Linux/Windows
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}

/**
 * Valida se o path é seguro
 */
function validatePath(filePath) {
  const normalized = normalizePath(filePath);
  
  // Verificar caminhos absolutos
  if (!normalized.startsWith('/') && !normalized.startsWith('~')) {
    return { valid: false, error: 'Caminho deve ser absoluto ou relativo' };
  }
  
  // Verificar caminhos sensíveis
  if (isSensitivePath(normalized)) {
    return { valid: false, error: 'Acesso negado a caminho sensível' };
  }
  
  // Verificar existência
  if (!fs.existsSync(normalized)) {
    return { valid: false, error: `Arquivo não encontrado: ${normalized}` };
  }
  
  // Verificar tamanho
  try {
    const stats = fs.statSync(normalized);
    if (stats.size > CONFIG.MAX_FILE_SIZE) {
      return { valid: false, error: 'Arquivo muito grande (limite: 50MB)' };
    }
  } catch (err) {
    return { valid: false, error: `Erro ao acessar arquivo: ${err.message}` };
  }
  
  return { valid: true, path: normalized };
}
// ============================================================================
// MAIN CLASS
// ============================================================================

class DoctorAgent {
  constructor(config = {}) {
    this.name = 'Doctor Agent';
    this.role = 'Programação e Segurança';
    this.mode = config.mode || 'safe';
    this.commands = new Map();
    this.history = [];
    this.maxCommands = 100;
    
    this.loadConfig();
    this.registerCommands();
  }
  
  /**
   * Carrega configuração do arquivo
   */
  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        Object.assign(CONFIG, config);
      }
    } catch (err) {
      console.warn('⚠️  Não foi possível carregar config.json');
    }
  }
  
  /**
   * Registra um novo comando
   */
  registerCommand(name, config) {
    if (this.commands.has(name)) {
      console.warn(`⚠️  Comando "${name}" já existe, sobrescrevendo`);
    }
    this.commands.set(name, config);
  }
  
  /**
   * Registra todos os comandos padrão
   */
  registerCommands() {
    this.registerCommand('read', {
      description: 'Ler arquivo',
      pattern: /^read\s+(.+)$/,
      handler: (args) => this.readFile(args[0]),
      requires: ['file']
    });
    
    this.registerCommand('link', {
      description: 'Processar link',
      pattern: /^link\s+(.+)$/,
      handler: (args) => this.processLink(args[0]),
      requires: ['url']
    });
    
    this.registerCommand('search', {
      description: 'Buscar texto em arquivos',
      pattern: /^search\s+(.+?)\s+in\s+(.+)$/,
      handler: (args) => this.searchFiles(args[0], args[1]),
      requires: ['pattern', 'path']
    });
    
    this.registerCommand('generate', {
      description: 'Gerar código',
      pattern: /^generate\s+(.+)$/,
      handler: (args) => this.generateCode(args[0]),
      requires: ['language']
    });
    
    this.registerCommand('list', {
      description: 'Listar arquivos',
      pattern: /^list\s+(.+)$/,
      handler: (args) => this.listFiles(args[0]),
      requires: ['path']
    });
    
    this.registerCommand('info', {
      description: 'Ver informações de arquivo',
      pattern: /^info\s+(.+)$/,
      handler: (args) => this.getFileInfo(args[0]),
      requires: ['file']
    });
  }
  
  /**
   * Lê arquivo
   */
  async readFile(filePath) {
    const { valid, path: normalizedPath, error } = validatePath(filePath);
    
    if (!valid) {
      return { success: false, error };
    }
    
    try {
      const stats = fs.statSync(normalizedPath);
      
      // Ler conteúdo
      let content;
      const ext = path.extname(normalizedPath).toLowerCase();
      
      if (ext === '.bin' || ext === '.pdf' || ext === '.docx' || ext === '.xlsx') {
        const buffer = fs.readFileSync(normalizedPath);
        content = `📄 Arquivo binário (${stats.size} bytes)\n` +
                  `Tipo: ${ext}\n` +
                  `Tamanho: ${stats.size} bytes`;
      } else {
        content = fs.readFileSync(normalizedPath, 'utf-8');
        // Limitar tamanho
        if (content.length > CONFIG.MAX_RESPONSE_SIZE) {
          content = content.substring(0, CONFIG.MAX_RESPONSE_SIZE) + '\n\n[... fim do conteúdo ]';
        }
      }
      
      return {
        success: true,
        file: normalizedPath,
        size: stats.size,
        type: guessFileType(normalizedPath),
        content: content
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  /**
   * Processa link
   */
  async processLink(url) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      
      // Verificar dominio
      if (!CONFIG.ALLOWED_DOMAINS.includes(domain)) {
        return { success: false, error: `⛔ Domínio não permitido: ${domain}` };
      }
      
      // Buscar conteúdo
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const text = await response.text();
      
      return {
        success: true,
        url: url,
        domain: domain,
        length: text.length,
        preview: text.substring(0, 500),
        status: response.status
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  /**
   * Busca texto em arquivos
   */
  async searchFiles(pattern, path) {
    const results = [];
    const normalizedPath = validatePath(path).path || path;
    
    try {
      const command = `grep -r "${pattern}" "${normalizedPath}" --include="*.js" --include="*.ts" --include="*.py" --include="*.html" --include="*.css" --include="*.json" --include="*.md" --include="*.txt" --include="*.xml" --include="*.yaml" --include="*.yml"`;
      
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      
      if (stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.startsWith('Binary')) {
            results.push(line);
          }
        }
      }
      
      if (stderr) {
        console.warn('⚠️  stderr:', stderr);
      }
      
      return { success: true, results: results.slice(0, 100), count: results.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  /**
   * Gera código
   */
  generateCode(language, options = {}) {
    const templates = {
      javascript: `// Gerado por Doctor Agent - ${new Date().toISOString()}\n`,
      typescript: `// Generado por Doctor Agent - ${new Date().toISOString()}\n`,
      python: '# Gerado por Doctor Agent - ${new Date().toISOString()}\n',
      rust: '// Gerado por Doctor Agent - ${new Date().toISOString()}\n',
      go: '// Gerado por Doctor Agent - ${new Date().toISOString()}\n'
    };
    
    const code = templates[language] || templates.javascript;
    
    return {
      success: true,
      language: language,
      code: code
    };
  }
  
  /**
   * Lista arquivos
   */
  async listFiles(path) {
    const normalizedPath = validatePath(path).path || path;
    
    try {
      const files = fs.readdirSync(normalizedPath);
      const filtered = files.filter(f => {
        const fullPath = path.join(normalizedPath, f);
        return fs.statSync(fullPath).isFile();
      });
      
      return {
        success: true,
        path: normalizedPath,
        files: filtered.slice(0, 100),
        count: filtered.length
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  /**
   * Obtém informações de arquivo
   */
  getFileInfo(filePath) {
    const { valid, path: normalizedPath, error } = validatePath(filePath);
    
    if (!valid) {
      return { success: false, error };
    }
    
    try {
      const stats = fs.statSync(normalizedPath);
      
      return {
        success: true,
        file: normalizedPath,
        size: stats.size,
        type: guessFileType(normalizedPath),
        modified: stats.mtime,
        created: stats.birthtime
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  /**
   * Processa comando de texto
   */
  async processCommand(text) {
    const lowerText = text.toLowerCase();
    const trimmed = lowerText.trim();
    
    // Verificar se é comando de leitura
    const readMatch = trimmed.match(/^read\s+(.+)$/i);
    if (readMatch) {
      return this.readFile(readMatch[1]);
    }
    
    // Verificar se é link
    const linkMatch = trimmed.match(/^link\s+(.+)$/i);
    if (linkMatch) {
      return this.processLink(linkMatch[1]);
    }
    
    // Verificar se é busca
    const searchMatch = trimmed.match(/^search\s+(.+?)\s+in\s+(.+)$/i);
    if (searchMatch) {
      return this.searchFiles(searchMatch[1], searchMatch[2]);
    }
    
    // Verificar se é geração
  const generateMatch = trimmed.match(/^generate\s+(.+)$/i);
    if (generateMatch) {
      const args = generateMatch[1].split(' as ');
      const language = args[0]?.trim();
      const template = args[1] || 'default';
      return this.generateCode(language, template);
    }
    
    // Verificar se é lista
    const listMatch = trimmed.match(/^list\s+(.+)$/i);
    if (listMatch) {
      return this.listFiles(listMatch[1]);
    }
    
    // Verificar se é info
    const infoMatch = trimmed.match(/^info\s+(.+)$/i);
    if (infoMatch) {
      return this.getFileInfo(infoMatch[1]);
    }
    
    // Se não for comando reconhecido
    return {
      success: false,
      error: 'Comando não reconhecido. Use: read, link, search, generate, list, info'
    };
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
  const agent = new DoctorAgent();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🤖 Doctor Agent — Agente Especialista em Programação e Segurança
    
Uso:
  node doctor_agent.js <comando> [argumentos]

Comandos disponíveis:
  read <arquivo>        — Lê arquivo
  link <url>            — Processa link
  search <pattern> in <caminho> — Busca texto
  generate <linguagem>  — Gera código
  list <caminho>        — Lista arquivos
  info <arquivo>        — Informações de arquivo

Exemplos:
  node doctor_agent.js read package.json
  node doctor_agent.js link https://github.com/Lindinaldo12/Bobmeuagente
  node doctor_agent.js search "const" in ./src
  node doctor_agent.js generate javascript
    `);
  } else {
    agent.processCommand(args.join(' '))
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch(err => {
        console.error('❌ Erro:', err);
      });
  }
}

module.exports = DoctorAgent;
