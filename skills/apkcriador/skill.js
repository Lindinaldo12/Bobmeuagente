/**
 * ApkCriador — Gerador de APKs prontos
 *
 * Responsabilidade:
 *   Recebe a solicitação do usuário ("criar apk", "gerar apk", etc.)
 *   e entrega:
 *     1. Estrutura completa de um projeto Android (AndroidManifest.xml,
 *        build.gradle, código-fonte, layouts, assets)
 *     2. Um .apk pronto para download (ZIP compactado)
 *     3. Instruções passo a passo para compilar e assinar
 *
 * Como funciona:
 *   - Gera os arquivos do APK em memória/tmp
 *   - Empacota em um ZIP com extensão .apk
 *   - Retorna para o usuário com instruções de uso
 *
 * Dependências externas (não no Node.js):
 *   - Android SDK build-tools (aapt, dx, apksigner, zipalign)
 *   - Java/Kotlin compiler (javac, kotlinc)
 *   - Keystore de assinatura (debug.keystore ou .jks)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const ZipArchive = require("archiver").ZipArchive;

// ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────

const SKILL_DIR = path.join(__dirname, "templates");

// ─── GERA TODOS OS ARQUIVOS DO APK ─────────────────────────────────────────

function gerarArquivoApk(pacote, nomeApp) {
    const templateDir = path.resolve(SKILL_DIR);

    const arquivos = [];

    // { caminhoRelativo: { conteudo: string, nome: string } }
    const blob = {

        // RAIZ
        "README.md": `\
# ${nomeApp}

Aplicativo Android gerado pelo **Bob AI X**.

## Estrutura

\`\`\`
${nomeApp}/
├── AndroidManifest.xml
├── build.gradle
├── proguard-rules.pro
├── res/
│   ├── layout/
│   │   └── activity_main.xml
│   └── values/
│       └── strings.xml
└── assets/
\`\`\`

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
| MODEL_NAME | Modelo da IA (\"qwen/qwen-2.5-72b-instruct\") |
| TELEGRAM_BOT_TOKEN | Token do bot Telegram (se aplicável) |

## Licença
© 2026 Lindinaldo. Todos os direitos reservados.
`,

        // MANIFESTO
        "AndroidManifest.xml": `\
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pacote}"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="Bob AI X"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:label="Bob AI X"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,

        // BUILD GRADLE
        "build.gradle": `\
apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "${pacote}"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`,

        // ATIVIDADE PRINCIPAL
        "src/main/java/com/exemplo/app/MainActivity.java": `\
package com.exemplo.app;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class MainActivity extends AppCompatActivity {

    private TextView textView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        textView = findViewById(R.id.textView);

        chamarBob();
    }

    private void chamarBob() {
        String apiKey = "";
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            apiKey = getString(R.string.openrouter_api_key);
        }
        String url = "https://openrouter.ai/api/v1/chat/completions";

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + apiKey)
            .header("HTTP-Referer", "https://bobmeuagente.onrender.com")
            .header("X-Title", "Android App")
            .post(null)
            .build();

        // TODO: Implementar chamada assíncrona e atualizar UI
    }
}
`,

        // LAYOUT
        "res/layout/activity_main.xml": `\
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/textView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello, Bob AI X!"
        android:textSize="20sp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`,

        // STRINGS
        "res/values/strings.xml": `\
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Bob AI X</string>
    <string name="hello">Olá, Mundo!</string>
    <string name="openrouter_api_key">SUA_CHAVE_AQUI</string>
</resources>
`,

        // PROGUARD
        "proguard-rules.pro": `\
# Add project specific ProGuard rules here.
-keep class com.exemplo.app.MainActivity { *; }
-keepattributes *Annotation*
-keep class com.exemplo.app.** { *; }
`
    };

    for (const [relPath, conteudo] of Object.entries(blob)) {
        const absPath = path.join(templateDir, relPath);
        const dir = path.dirname(absPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(absPath, conteudo);
        arquivos.push(relPath);
    }

    return {
        arquivos: arquivos,
        templateDir: templateDir,
        pacote: pacote,
        nomeApp: nomeApp
    };
}

// ─── JA FAZ O ZIP DO APK ────────────────────────────────────────────────────

function gerarZipApk(nomeApp, pacote, callback) {
    const tmpDir = path.join(path.dirname(__dirname), "gerados", "apks", nomeApp);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Gera os arquivos
    const result = gerarArquivoApk(pacote, nomeApp);

    // Caminho do ZIP
    const zipPath = path.join(tmpDir, `${nomeApp}.apk`);

    // Cria o ZIP
    const output = fs.createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
        callback(null, zipPath, result.arquivos.length);
    });

    archive.on("error", (err) => {
        callback(err, null, 0);
    });

    archive.directory(result.templateDir, false);
    archive.pipe(output);
    archive.finalize();
}

// ─── SCRIPT PRINCIPAL ───────────────────────────────────────────────────────

function executar(msg, ctx, cb) {
    const texto = msg.text || msg || "";

    const match = texto.match(/^!?apk\s+(.+)$/i);
    if (!match) {
        return cb({
            mensagem: "🎯 *Gerador de APKs — Bob AI X*",
            corpo: `⚠️ *Para criar um APK:*\n\n` +
                   `!apk <nome do app>\n` +
                   `/criar-apk <nome do app>\n` +
                   `/apk <descrição do app>\n\n` +
                   `*Exemplos:*\n` +
                   `!apk Meu App\n` +
                   `/apk app de telegram\n` +
                   `/apk app de clima\n\n` +
                   `Será gerado: APK structure + instruções de build.`,
            tipo: "info"
        });
    }

    const nomeApp = match[1].trim();

    gerarZipApk(nomeApp, "com.exemplo.app", (err, zipPath, qtde) => {
        if (err) {
            return cb({
                mensagem: "❌ Erro ao gerar o APK",
                corpo: `⚠️ Ocorreu um erro: ${err.message}`,
                tipo: "error",
                erro: err
            });
        }

        cb({
            mensagem: `🎯 *Apk gerado com sucesso — ${nomeApp}*`,
            corpo: `✅ *APK gerado com sucesso!*

📦 *Arquivo:* ${nomeApp}.apk
📦 *Estrutura:* ${qtde} arquivos
📦 *Pacote:* com.exemplo.app
📅 *Criado em:* ${new Date().toLocaleString('pt-BR')}

📋 *Instruções:*
1. Baixe o arquivo ${nomeApp}.apk
2. Descompacte os arquivos
3. Abra no Android Studio (File → New → Import Project)
4. Conecte seu dispositivo ou use um emulador
5. Clique em Run (▶️)

⚠️ *Nota:* O APK ainda precisa ser compilado no Android Studio.
Ah, e não se esqueça de colocar sua chave OpenRouter em strings.xml.`,
            tipo: "success",
            arquivo: zipPath,
            tamanho: qtde,
            timestamp: new Date().toISOString()
        });
    });
}

module.exports = {
    executar,
    gerarArquivoApk,
    gerarZipApk,
    SKILL_DIR
};
