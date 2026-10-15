# AppTeste

Aplicativo Android gerado pelo **Bob AI X**.

## Estrutura

```
AppTeste/
├── AndroidManifest.xml
├── build.gradle
├── proguard-rules.pro
├── res/
│   ├── layout/
│   │   └── activity_main.xml
│   └── values/
│       └── strings.xml
└── assets/
```

## Como compilar

### Pré-requisitos
- Android Studio (KitKat ou superior)
- Android SDK (API 24 ou superior)
- JDK 17

### Passo a passo
1. Abra o Android Studio
2. File → New → Import Project
3. Selecione o diretório do projeto
4. Aguarde a sincronização das dependências
5. Conecte um dispositivo Android ou emulador
6. Clique em Run (▶️)

### Variáveis de ambiente
| Variável | Descrição |
|----------|-----------|
| OPENROUTER_API_KEY | Chave da API do OpenRouter |
| MODEL_NAME | Modelo da IA ("qwen/qwen-2.5-72b-instruct") |
| TELEGRAM_BOT_TOKEN | Token do bot Telegram (se aplicável) |

## Licença
© 2026 Lindinaldo. Todos os direitos reservados.
