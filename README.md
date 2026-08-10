# 🤖 Bob AI X

**Sistema Operacional de Inteligência Artificial Pessoal**

Versão: 2.0.0 | Autor: Lindinaldo

---

## 📋 O que é?

Bob AI X é um assistente pessoal de IA multiagente que roda no Telegram. Ele:

- ✅ Responde perguntas com busca na web (Wikipedia)
- ✅ Lê e analisa PDFs
- ✅ Tem memória de curto e longo prazo por usuário
- ✅ Sistema de plugins (loja de apps)
- ✅ Plugins de concurso (SESGRANRIO, CESPE, FGV, FCC)
- ✅ Biblioteca Espírita (obras de Kardec)
- ✅ Flashcards, cronogramas e redação discursiva
- ✅ Multiusuário com autenticação e convites
- ✅ Master controla tudo (bloquear, senhas, acessos)

## 🚀 Instalação

```bash
git clone https://github.com/Lindinaldo12/Bobmeuagente.git
cd Bobmeuagente
npm install
cp .env.example .env  # Edite com suas chaves
node bot.js
```

## 🏗️ Arquitetura
## 🔐 Comandos do Master

- `/convite` - Gerar link de convite
- `/lista_usuarios` - Ver todos os usuários
- `/bloquear ID` - Bloquear usuário
- `/desbloquear ID` - Desbloquear
- `/senha ID nova_senha` - Resetar senha
- `/minha_senha nova` - Mudar própria senha

## 📲 Comandos do Usuário

- `/loja` - Ver plugins disponíveis
- `/instalar nome` - Instalar plugin
- `/desinstalar nome` - Remover plugin
- `/meus_plugins` - Ver instalados
- `/minhas_config` - Ver preferências
- `/configurar estilo=formal` - Personalizar

## 🧠 Modelo de IA

- OpenRouter (nuvem)
- Modelo padrão: `qwen/qwen-2.5-7b-instruct`

## 📄 Licença

Projeto pessoal. Todos os direitos reservados.
