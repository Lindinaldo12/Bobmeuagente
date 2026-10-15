---
name: programacao
description: Skill de desenvolvimento Node.js para o Bob AI X. Cria projetos Node.js, estrutura de comandos, integração com Telegram e OpenRouter.
category: Programação
author: Bob AI X
version: 1.0.0
---

# Skill: Desenvolvimento Node.js

## Propósito

Este skill define o fluxo de desenvolvimento para projetos Node.js no Bob AI X. Cobre a criação de projetos, estrutura de comandos, integração com Telegram e OpenRouter, e boas práticas de código.

## Fluxo de desenvolvimento

### 1. Inicializar projeto

```bash
# Criar estrutura do projeto
mkdir -p skills/{nome-skill}/templates
mkdir -p skills/{nome-skill}/references
mkdir -p skills/{nome-skill}/scripts

# Criar manifest.json
cat > skills/{nome-skill}/manifest.json << EOF
{
    "nome": "Nome do skill",
    "versao": "1.0.0",
    "descricao": "Descrição do que o skill faz",
    "categoria": "Programação"
}
EOF
```

### 2. Criar skill.js

```javascript
function executar(msg, ctx, cb) {
    // Lógica do skill
    cb({ mensagem: "Resultado", corpo: "Detalhes", tipo: "success" });
}
module.exports = { executar };
```

## Integridade do código

### Regras de qualidade

- **Sempre testar com `node --check`** antes de commitar `.js` — evita quebrar o skill.
- **Usar `require()` consistentemente** — o projeto usa CommonJS, não ESM.
- **Sempre lidar com erros** — envolver operações assíncronas em try/catch ou callbacks.
- **Sempre verificar `fs.existsSync()` antes de `fs.readFileSync()`** — evita erros de arquivo não existente.
- **Sempre usar `path.join()` para caminhos** — evita problemas de separadores de diretório.

### Verificação pós-edit

```bash
# Verificar sintaxe
node --check ia/comandos.js

# Verificar módulo carrega
node -e "const mod = require('./ia/comandos.js'); console.log('OK');"
```

## Comandos do bot

### Registro de comandos

```javascript
bot.onText(/^\/comando (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const parametro = match[1].trim();
    // Lógica do comando
});
```

### Detecção de intenção

```javascript
function detectarIntencao(texto) {
    // Retorna { tipo: '...', ... } ou null
    return null;
}
```

## Integração com Telegram

### Configuração

```javascript
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
```

### Envio de mensagens

```javascript
// Mensagem curta
await bot.sendMessage(chatId, "Texto");

// Envio de documento
await bot.sendDocument(chatId, buffer, {
    filename: "arquivo.apk",
    caption: "Caption"
});
```

## Integração com OpenRouter

### Configuração

```javascript
const apiKey = process.env.OPENROUTER_API_KEY;
const url = "https://openrouter.ai/api/v1/chat/completions";
```

### Chamada de IA

```javascript
async function chamarOpenRouter(messages, eFoto = false) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://bobmeuagente.onrender.com',
            'X-Title': 'Bob AI X',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: model, messages })
    });
    // Processar resposta
}
```

## Boas práticas de código

1. **Sempre usar `async/await`** — não misturar com callbacks antigos.
2. **Sempre validar entrada do usuário** — evitar erro de formatação.
3. **Sempre limitar tamanho de mensagem** — Telegram limita a 4096 caracteres.
4. **Sempre usar `try/catch`** — evitar erros não tratados.
5. **Sempre usar `require('../helpers')` consistentemente** — caminhos relativos.

## Atualizações recentes

- Adicionado `/apk` para geração de APKs prontos (skill `apkcriador`)
- Adicionado `/selfcheck` para diagnóstico do sistema
- Removido dependência morta `grammy` (não usada em produção)

## Referências

- [Node.js Documentation](https://nodejs.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenRouter API](https://openrouter.ai/docs)
