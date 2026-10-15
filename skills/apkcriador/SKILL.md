---
name: apkcriador
description: Gerador de APKs prontos para o Bob AI X. Gera estrutura completa de aplicativos Android, código-fonte, assets e instruções de build e assinatura.
category: Programação
author: Bob AI X
version: 1.0.0
---

# Skill: Gerador de APK

## Propósito

Gerar APKs prontos para o Bob AI X. Este skill cobre a criação de estrutura Android, código-fonte, build e instruções de deployment para o projeto Bob (Telegram multi-agent bot).

## Estrutura de um APK

Um APK é um arquivo ZIP estruturado com os seguintes componentes obrigatórios:

```
app.apk/
├── AndroidManifest.xml          # Manifesto — package, permissions, activities
├── res/
│   ├── layout/activity_main.xml # Layout da UI
│   └── values/strings.xml       # Strings e strings de configuração
├── src/main/java/
│   └── com/exemplo/app/
│       └── MainActivity.java    # Código-fonte principal
├── build.gradle                 # Configuração de build (Gradle)
└── proguard-rules.pro           # Regras de minificação
```

## Como usar

### Comando básico

```bash
# Gerar APK simples
node -e "
const skill = require('./skills/apkcriador/skill.js');
skill.gerarZipApk('MeuApp', 'com.exemplo.app', (err, zipPath, qtde) => {
    if (err) { console.error(err); return; }
    console.log('APK:', zipPath);
});
"
```

### Com Bob (Telegram bot)

```text
/apk MeuApp
```

Bob responderá com o arquivo APK gerado e instruções de uso.

## Variáveis de ambiente necessárias

| Variável | Descrição |
|----------|-----------|
| OPENROUTER_API_KEY | Chave da API do OpenRouter (para o app consumir a IA) |
| MODEL_NAME | Modelo da IA (`qwen/qwen-2.5-72b-instruct`) |
| TELEGRAM_BOT_TOKEN | Token do bot Telegram (se aplicável) |

## Build requirements (requisitos de build)

- Android Studio (KitKat ou superior)
- Android SDK (API 24+)
- JDK 17
- Keystore de assinatura (debug.keystore ou .jks)

## Regras de boas práticas

1. **Sempre gerar o APK antes de enviar ao usuário** — verificar se o arquivo existe com `fs.existsSync(zipPath)` antes de tentar ler.
2. **Nome do pacote deve ser instável** — `com.exemplo.app` é um placeholder; o usuário deve substituir.
3. **Chave OpenRouter deve ser substituída** — o template inclui `SUA_CHAVE_AQUI` no `strings.xml`.
4. **Sempre enviar o APK como documento** — não embutir em mensagem de texto.
5. **Sempre incluir instruções de build** — o APK precisa de compilação; não é auto-empacotável.

## Pitfalls

- **Sempre usar `fs.existsSync()` antes de `fs.readFileSync()`** — evita erro de arquivo não existente.
- **O `archiver` 8.x exige `ZipArchive`, não `Archiver` diretamente** — use `require('archiver').ZipArchive` e `new ZipArchive({ zlib: { level: 9 } })`.
- **Nunca deixar quebrado o arquivo `.gitignore`** — `skills/gerados/` deve ser ignorado (gerado dinamicamente).
- **Depuração de build: `aapt`, `dx`, `apksigner` não estão instalados no servidor** — o APK precisa ser compilado localmente no PC do usuário.
- **Sempre testar com `node --check`** antes de commitar `.js` — evita quebrar o skill.

## Referências

- [APK Structure](https://developer.android.com/guide/topics/manifest/manifest-intro) — documentação oficial do manifesto Android
- [Gradle Build System](https://docs.gradle.org/current/userguide/userguide.html) — sistema de build do Android
- [Android SDK Tools](https://developer.android.com/studio/releases/platform-tools) — ferramentas de build
