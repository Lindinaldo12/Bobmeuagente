# 🤖 Bob AI X

**Versão:** 2.0.0  
**Criador:** José Lindinaldo do Nascimento Luiz  
**Status:** 🟢 Sistema Operacional de Inteligência Artificial

---

## 📖 O que é o Bob AI X?

O Bob AI X é um assistente pessoal inteligente projetado para atuar como uma equipe inteira de especialistas. Ele ajuda a automatizar tarefas, organizar informações, programar, pesquisar e aprender, tudo em um único lugar. 

Pense nele como um "cérebro digital" que trabalha 24 horas por dia para tornar sua vida mais produtiva e organizada.

---

## 🚀 Principais Funcionalidades

O Bob é composto por uma equipe de **Agentes Especialistas**:

- 👨‍💻 **Programador:** Cria, corrige e explica códigos em várias linguagens.
- 👨‍🏫 **Professor:** Ensina qualquer assunto passo a passo, com exemplos e analogias.
- 🔍 **Pesquisador:** Busca informações, valida fontes e cria resumos.
- 🛡️ **Segurança:** Analisa vulnerabilidades e aplica boas práticas.
- 📊 **Analista:** Interpreta dados, cria relatórios e detecta padrões.
- ✍️ **Escritor:** Produz textos, artigos, e-mails e revisa gramática.
- 📁 **Administrador:** Organiza tarefas, gerencia a memória e monitora o sistema.

---

## 🛠️ Como Instalar e Rodar

Siga estes passos simples para ter o Bob rodando no seu computador ou servidor:

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) instalado.
- [Ollama](https://ollama.com/) instalado e rodando (recomendado: modelo `qwen2.5-coder:3b`).
- Uma conta no Telegram para criar o seu Bot (via @BotFather).

### 2. Clonar o Projeto
```bash
git clone https://github.com/SEU_USUARIO/bob-ai-x.git
cd bob-ai-x
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto e adicione suas chaves:
```env
TELEGRAM_BOT_TOKEN=seu_token_do_telegram_aqui
MASTER_ID=seu_id_do_telegram_aqui
ADMIN_IDS=["id_admin_1", "id_admin_2"]
ACCESS_PASSWORD=sua_senha_super_secreta_aqui
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:3b
```
*(⚠️ **Atenção:** Nunca compartilhe este arquivo `.env` publicamente! O arquivo `.gitignore` já protege ele.)*

### 5. Iniciar o Bob
```bash
npm start
# ou
node bot.js
```

---

## 🔒 Segurança

O Bob AI X possui um **Portão de Segurança** de 3 níveis:
1. **Master:** Acesso total (configurado pelo `MASTER_ID`).
2. **Admin:** Acesso gerencial (configurado pelos `ADMIN_IDS`).
3. **Usuário:** Acesso limitado, requer autorização prévia no sistema.

---

## 📝 Próximos Passos (Roadmap)

- [x] Limpeza de código e organização de pastas.
- [x] Sistema de segurança com níveis de acesso.
- [x] Base de conhecimento local funcional.
- [ ] Integração com Pesquisa na Web (Agente Pesquisador).
- [ ] Memória de longo prazo e aprendizado contínuo.
- [ ] Deploy na nuvem (Render/VPS) para funcionamento 24/7.

---

## 🤝 Contribuições e Contato

Este é um projeto em constante evolução. Se tiver ideias ou quiser ajudar, sinta-se à vontade!

**Desenvolvido com ❤️ por José Lindinaldo do Nascimento Luiz.**
