#  Bob AI X - Status do Projeto

**Última atualização:** 10 de agosto de 2026

## ✅ O que está funcionando:
- Bot Telegram conectado e respondendo
- Sistema de busca na Wikipedia (com limpeza de HTML)
- Agente Professor com contexto de conversa
- Modelo: qwen/qwen-2.5-7b-instruct via OpenRouter
- Sistema de retentativa para falhas de conexão
- Memória de usuários (JSON)

## 🔧 Problemas conhecidos e correções aplicadas:
1. **Erro gramatical** ("pelo Argentina") → Adicionado prompt para português correto
2. **Perda de contexto** em perguntas curtas → Histórico agora é passado para busca
3. **Modelos gratuitos indisponíveis** → Usando qwen-2.5-7b-instruct (estável)

## 📁 Estrutura de arquivos principais:
- `bot.js` - Arquivo principal
- `ia/apiExterna.js` - Conexão com OpenRouter
- `ia/buscaWeb.js` - Busca na Wikipedia
- `agentes/professor/plugin.js` - Agente Professor
- `.env` - Configurações (NÃO commitar)

##  Próximos passos:
- [ ] Testar conversas multi-turno (contexto mantido)
- [ ] Implementar agente aprendiz (salvar fatos importantes)
- [ ] Deploy na nuvem (Railway/Koyeb) para 24/7
- [ ] Adicionar mais fontes de busca (além da Wikipedia)

## 🔑 Configurações atuais (.env):
- TELEGRAM_BOT_TOKEN: 8923485135:AAEttvhM40780VGtS3DHepK-rhZYH1gRO08
- API_KEY: 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
- API_URL: https://openrouter.ai/api/v1
- MODEL_NAME: qwen/qwen-2.5-7b-instruct

## 📝 Notas importantes:
- O modelo de 7B é limitado, pode alucinar em perguntas complexas
- Wikipedia retorna apenas resumos, não artigos completos
- Para melhorar respostas, considerar modelo maior (32B+) no futuro
