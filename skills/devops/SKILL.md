---
name: hermes-doctor
description: Analisador e reparador do sistema Bob AI X — diagnóstico, reparo automático e relatório de saúde do bot.
version: 1.0.0
author: Lindinaldo
license: MIT
metadata:
  hermes:
    tags:
      - diagnostic
      - maintenance
      - telegram
      - bot
    related_skills:
      - telegram-platform
      - github-deploy
---

# Hermes Doctor

Diagnóstico e reparo do sistema Bob AI X.

## When to Use

Use Hermes Doctor quando:
- O usuário pedir "hermes doctor" ou verificar o sistema.
- O bot da Telegram não conecta ou está dando erros.
- O deploy no Render/GitHub não está atualizando.
- O usuário relata falhas no bot (erros de token, API key, conexão).

## Fluxo de execução

### Fase 1 — Diagnóstico
- Verificar `git status` (branch, commits, sincronia com origin).
- Verificar `.env` (ou variáveis de ambiente): token do bot, API keys, IDs.
- Verificar conexão com Telegram: bot token válido?
- Verificar conexão com IA (OpenRouter/Groq): chave válida?

### Fase 2 — Reparo
- Corrigir variáveis de ambiente faltantes no `.env` ou no Render.
- Verificar e reparar autenticação SSH/GitHub.
- Verificar configurações do `telegram.js` e `kernel.js`.
- Verificar dependências npm instaladas (`npm install`).

### Fase 3 — Relatório
- Listar o que foi corrigido.
- Listar o que precisa de intervenção humana.
- Sugerir próximos passos.

## Comandos de verificação

```bash
git status
git log --oneline -5
cat .env 2>/dev/null | grep -v "^#"
node bot.js 2>&1 | head -20
```

## Seção 1 — Troubleshooting da instalação Windows (Hermes Agent Desktop)

O instalador `Hermes-Setup.exe` é um **self-extracting archive** baseado em 7-Zip, não um instalador tradicional.

- O conteúdo binário gigante visto no terminal é **normal** — é o conteúdo bruto do arquivo `.exe`, não um erro.
- Não rodar o `.exe` no terminal (CMD/PowerShell) — aparece `This program cannot be run in DOS mode`.
- Clique duas vezes no arquivo no Explorer para executá-lo.
- Se o Windows bloquear com "marca d'água" ou Defender, usar **Mais opções → Executar** ou **Ainda mais informações → Executar**.

> Veredito: o instalador é válido. O problema era a forma de execução.

## Seção 2 — Autenticação no GitHub

Se `git push` falhar com `Permission denied (publickey)`:

### Opção A: Personal Access Token (mais rápido)
```bash
# 1. Gerar token em GitHub: Settings → Developer settings → Personal access tokens
# 2. Usar auth inline no push:
git push https://USERNAME:ghp_TOKEN@github.com/USERNAME/REPO.git main
```
⚠️ Nunca imprimir ou memorizar tokens divididos em partes.

### Opção B: SSH key
- O nome do arquivo `id_ed255lo` (com "lo" no final) era um erro de digitação — o correto é `id_ed25519`.
- Registrar a chave pública em GitHub Settings → SSH and GPG keys → New SSH key.

### Opção C: HTTPS via Credential Manager
```bash
# Configurar Git para usar o Windows Credential Manager
git config --global credential.helper manager
```

## Seção 3 — Configuração do Bob AI X (Telegram Bot)

O projeto Bob AI X (Lindinaldo) roda no Telegram via OpenRouter. Estrutura:

- **Root**: `bot.js` (servidor Express + init do telegram.js)
- **Core**: `telegram.js` (manuseio de mensagens, comandos /apk, etc.)
- **IA/Context**: `ia/` (kernel.js, comandos.js, personalidade.js, etc.)
- **Env vars** necessárias (via Render env vars ou `.env`):
  - `TELEGRAM_BOT_TOKEN` — token do bot (@BotFather)
  - `OPENROUTER_API_KEY` / `API_KEY` — chave do OpenRouter
  - `MASTER_ID` — ID do dono
  - `ADMIN_IDS` — array de IDs admins
  - `ACCESS_PASSWORD` — senha de acesso
  - `GROQ_API_KEY` — (opcional, para transcrição de áudio)

### Render Config
O `render.yaml` define o serviço web. Para add env vars:
1. Render Dashboard → Bob AI X → Settings → Environment
2. Adicionar as variáveis acima

### Verificação rápida
```bash
# Verificar se o bot está conectado
curl -s https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getMe

# Verificar se a API de IA está acessível
curl -s https://openrouter.ai/api/v1/models
```

---

# Status do Projeto Bob AI X

**Repositório**: https://github.com/Lindinaldo12/Bobmeuagente
**Branch atual**: `user/commits` (sincronizado com `origin/main`)
**Último commit do repo**: `8f9cf37` (Refactor Telegram bot initialization and message handling)
**Commits do usuário incluídos**: `f49d818` (feat: adiciona comando /apk para gerar APKs prontos) e `8d16fea` (chore: adiciona dependência archiver...)

## Estrutura do Repositório

```
├── bot.js                 ← Servidor Express + init do telegram.js
├── telegram.js            ← Gerenciamento de mensagens, comandos, conexão com IA
├── orquestrador.js        ← Lógica de orquestração de agentes
├── kernel/
│   └── kernel.js          ← Motor de decisão e execução
├── ia/
│   ├── kernel.js          ← Motor de decisão
│   ├── comandos.js        ← Registro de comandos do bot
│   └── personalidade.js   ← Personalidade JARVIS
├── config/                ← Configurações (env vars, etc.)
├── skills/                ← Skills do bot
├── deploy/                ← Scripts de deploy
└── render.yaml            ← Configuração do Render
```

## Processo de Deploy

1. **Push** para o GitHub (main branch)
2. **Render** detecta o push e faz build automático
3. O bot inicia com as variáveis de ambiente configuradas no Render

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Bot não conecta | Verificar `TELEGRAM_BOT_TOKEN` no Render |
| Erro de IA | Verificar `OPENROUTER_API_KEY` |
| JSON parse error | Verificar se `.env` está no formato correto |
| 401 Unauthorized | Verificar `ACCESS_PASSWORD` |
| Ollama não disponível | Verificar `USE_OLLAMA=false` (já configurado) |

## Contato e Referências

- **GitHub**: https://github.com/Lindinaldo12/Bobmeuagente
- **Telegram**: @lindinaldo12
- **Render**: https://bobmeuagente.onrender.com

## Referências

- Bob AI X configurações: `config/`
- Skills do bot: `skills/`
- Deploy: `deploy/`
- Documentação: `docs/`
