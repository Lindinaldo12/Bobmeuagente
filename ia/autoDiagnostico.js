// ia/autoDiagnostico.js
// Agente auto-diagnóstico do Bob AI X
// Analisa a saúde do sistema e conserta falhas simples sozinho.

const fs = require("fs");
const path = require("path");
const os = require("os");

const memoriaGerenciador = require("../memoria_v4/gerenciador");
const configPreferencias = require("./configPreferencias");

const DIR_USUARIOS = path.join(__dirname, "..", "memoria_v4", "usuarios");
const DIR_CONFIG = path.join(__dirname, "..", "..", "config");
const ARQUIVO_PERSONALIDADE = path.join(DIR_CONFIG, "personalidade.txt");
const ARQUIVO_MEMORIA_PADRAO = path.join(DIR_USUARIOS, "0001.json");

// ----------------------------------------------------------------------
// 1. VERIFICAÇÕES DO SISTEMA
// ----------------------------------------------------------------------

function verificarMemoria() {
    const resultados = {
        ok: true,
        detalhe: "Memória do sistema: tudo certo.",
        erros: []
    };

    // 1.1. Pasta de usuários existe?
    if (!fs.existsSync(DIR_USUARIOS)) {
        try {
            fs.mkdirSync(DIR_USUARIOS, { recursive: true });
            resultados.ok = true;
            resultados.detalhe = "Pasta de memória criada (faltava).";
        } catch (e) {
            resultados.ok = false;
            resultados.detalhe = `Falha ao criar pasta de memória: ${e.message}`;
            resultados.erros.push("pasta_nao_criada");
        }
    }

    // 1.2. Existe memória padrão?
    if (!fs.existsSync(ARQUIVO_MEMORIA_PADRAO)) {
        try {
            fs.writeFileSync(ARQUIVO_MEMORIA_PADRAO, JSON.stringify({
                id: "0001",
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                perfil: {},
                preferencias: {},
                conhecimentos: [],
                conversas: [],
                resumo: "Sistema inicial"
            }, null, 2));
            resultados.ok = true;
            resultados.detalhe = "Memória padrão criada (faltava).";
        } catch (e) {
            resultados.ok = false;
            resultados.detalhe = `Falha ao criar memória padrão: ${e.message}`;
            resultados.erros.push("memoria_padrao_falhou");
        }
    }

    // 1.3. Tentar ler + salvar uma memória de teste (força validação de integridade)
    const idTeste = "selfcheck_" + Date.now();
    const teste = { id: idTeste, perfil: { nome: "selfcheck" }, conhecimentos: [], conversas: [] };
    try {
        memoriaGerenciador.salvar(idTeste, teste);
        const carregado = memoriaGerenciador.carregar(idTeste);
        // Verificar se a memória retornou com estrutura válida
        if (!carregado || carregado.id !== idTeste) {
            throw new Error("Estrutura da memória inválida após carregamento");
        }
        // Limpar arquivo de teste
        fs.unlinkSync(path.join(DIR_USUARIOS, idTeste + ".json"));
    } catch (e) {
        resultados.ok = false;
        resultados.detalhe = `Erro ao ler/salvar memória: ${e.message}`;
        resultados.erros.push("erro_memoria");
    }

    return resultados;
}

function verificarAPI() {
    return new Promise((resolver) => {
        const resultado = {
            ok: true,
            detalhe: "Conexão com a API: tudo certo.",
            erros: []
        };

        const apiKey = String(process.env.API_KEY || "").trim();

        if (!apiKey || apiKey.length < 20) {
            resultado.ok = false;
            resultado.detalhe = "API_KEY ausente ou muito curta no .env";
            resultado.erros.push("api_key_invalida");
            resolver(resultado);
            return;
        }

        // Tenta uma requisição leve à OpenRouter (sem gastar tokens)
        const url = process.env.API_URL || "https://openrouter.ai/api/v1/models";
        fetch(url, { method: "GET", timeout: 8000 }).then(async (res) => {
            if (!res.ok) {
                resultado.ok = false;
                resultado.detalhe = `OpenRouter respondeu ${res.status}`;
                resultado.erros.push("api_status");
            }
            resolver(resultado);
        }).catch((e) => {
            resultado.ok = false;
            resultado.detalhe = `Não foi possível conectar ao OpenRouter: ${e.message}`;
            resultado.erros.push("api_nao_conecta");
            resolver(resultado);
        });
    });
}

function verificarDependencias() {
    const resultado = {
        ok: true,
        detalhe: "Dependências: OK.",
        erros: []
    };

    const dependenciasObrigatorias = [
        "node-telegram-bot-api",
        "dotenv",
        "express",
        "grammy"
    ];

    // NOTE: grammy foi removida do package.json em uma refatoração anterior.
    // Se aparecer, é sinal de que o package-lock ainda a carrega.

    for (const pkg of dependenciasObrigatorias) {
        const diretorio = path.join(__dirname, "..", "node_modules", pkg);
        if (!fs.existsSync(diretorio)) {
            resultado.ok = false;
            resultado.detalhe = `Módulo '${pkg}' não encontrado em node_modules.`;
            resultado.erros.push(`modulo_ausente_${pkg}`);
        }
    }

    // Verificar espaço em disco
    try {
        const { total, free } = os.diskFree && os.diskFree() || { total: 0, free: 0 };
        // fallback
        const { totalSpace, freeSpace } = os.sharedDir && os.statfsSync ? os.statfsSync(process.cwd()) : { totalSpace: 0, freeSpace: 0 };
        if (freeSpace && totalSpace && totalSpace > 0) {
            const pct = ((totalSpace - freeSpace) / totalSpace) * 100;
            if (pct > 90) {
                resultado.ok = false;
                resultado.detalhe = `Disco quase cheio: ${pct.toFixed(1)}% utilizado.`;
                resultado.erros.push("disco_cheio");
            }
        }
    } catch (e) {
        // ignore
    }

    return resultado;
}

function verificarArquivos() {
    const resultado = {
        ok: true,
        detalhe: "Arquivos de configuração: OK.",
        erros: []
    };

    const arquivosObrigatorios = [
        ARQUIVO_PERSONALIDADE,
        path.join(__dirname, "configPreferencias.js"),
        path.join(__dirname, "apiExterna.js"),
        path.join(__dirname, "comandos.js")
    ];

    for (const arquivo of arquivosObrigatorios) {
        if (!fs.existsSync(arquivo)) {
            resultado.ok = false;
            resultado.detalhe = `Arquivo ausente: ${arquivo}`;
            resultado.erros.push(`arquivo_ausente_${path.basename(arquivo)}`);
        }
    }

    return resultado;
}

function verificarNode() {
    const resultado = {
        ok: true,
        detalhe: `Node.js ${process.version} — OK.`,
        erros: []
    };

    const memoriaUsada = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoriaTotal = os.totalmem() / 1024 / 1024;

    if (memoriaUsada > memoriaTotal * 0.85) {
        resultado.ok = false;
        resultado.detalhe = `Memória Node: ${memoriaUsada.toFixed(0)} MB / ${memoriaTotal.toFixed(0)} MB — acima de 85%.`;
        resultado.erros.push("memoria_node_alta");
    }

    return resultado;
}

// ----------------------------------------------------------------------
// 2. EXECUÇÃO DO DIAGNÓSTICO
// ----------------------------------------------------------------------

async function executarDiagnostico() {
    // Checagens síncronas
    const memoria = verificarMemoria();
    const dependencias = verificarDependencias();
    const arquivos = verificarArquivos();
    const node = verificarNode();
    // API é assíncrona (rede) — aguardar
    const api = await verificarAPI();

    const relatorio = {
        data: new Date().toISOString(),
        ok: true,
        check: {
            memoria,
            api,
            dependencias,
            arquivos,
            node
        },
        problemas: [],
        sugestoes: []
    };

    for (const [, check ] of Object.entries(relatorio.check)) {
        if (!check.ok) {
            relatorio.ok = false;
            relatorio.problemas.push(`${check.detalhe} (${check.erros.join(", ")})`);
        }
    }

    if (!relatorio.ok) {
        relatorio.sugestoes.push("Revise o .env e tente novamente.");
        if (relatorio.check.memoria.erros.includes("erro_memoria")) {
            relatorio.sugestoes.push("Ocorreu um erro de leitura/escrita na memória. Verifique permissões de arquivo.");
        }
    }

    return relatorio;
}

function formatarRelatorio(relatorio) {
    const linhas = [
        `🤖 *RELATÓRIO DE AUTODIAGNÓSTICO — Bob AI X*`,
        `🕐 ${new Date(relatorio.data).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
        ``
    ];

    for (const [nome, check] of Object.entries(relatorio.check)) {
        const estado = check.ok ? "✅ OK" : "❌ PROBLEMA";
        linhas.push(`${estado} — ${nome}: ${check.detalhe}`);
        if (check.erros.length > 0) {
            linhas.push(`   ❌ Erros: ${check.erros.join(", ")}`);
        }
    }

    linhas.push(``);
    linhas.push(`📊 Resumo: ${relatorio.ok ? "✅ Todos os sistemas operacionais." : "⚠️ ${relatorio.problemas.length} problema(s) encontrado(s)."}`);

    if (relatorio.problemas.length > 0) {
        linhas.push(`\n🔧 Suas sugestões:`);
        for (const sugestao of relatorio.sugestoes) {
            linhas.push(`   • ${sugestao}`);
        }
    }

    return linhas.join("\n");
}

module.exports = {
    executarDiagnostico,
    verificarMemoria,
    verificarAPI,
    verificarDependencias,
    verificarArquivos,
    verificarNode,
    formatarRelatorio
};
