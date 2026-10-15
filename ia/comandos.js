cat > ia/comandos.js << 'FIM'
// ia/comandos.js
// Funções estilo JARVIS do Bob AI X

const inicioBot = Date.now();

function tempoOnline() {
    const min = Math.floor((Date.now() - inicioBot) / 60000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60} min`;
}

function saudacaoPorHorario() {
    const h = new Date().getHours();
    if (h < 6) return 'Boa madrugada, Senhor.';
    if (h < 12) return 'Bom dia, Senhor.';
    if (h < 18) return 'Boa tarde, Senhor.';
    return 'Boa noite, Senhor.';
}

function registrar(bot, enviarMensagemLonga, chamarIA) {

    // 📋 AJUDA
    bot.onText(/\/ajuda/, async (msg) => {
        await enviarMensagemLonga(msg.chat.id,
            `🤖 *BOB AI X — COMANDOS DISPONÍVEIS*\n\n` +
            `/status — Relatório do sistema\n` +
            `/ping — Teste de latência\n` +
            `/clima — Clima da sua cidade\n` +
            `/clima Cidade — Clima de outra cidade\n` +
            `/hora — Hora exata\n` +
            `/data — Data de hoje\n` +
            `/calcular 2+2*10 — Cálculos\n` +
            `/traduzir en Bom dia — Traduzir texto\n` +
            `/noticias — Manchetes de agora\n` +
            `/lembrete 10min Tomar café — Lembretes\n` +
            `/lembretes — Ver lembretes ativos\n` +
            `/app calculadora — Criar um app web\n\n` +
            `Envie texto, foto ou documento (PDF, TXT, Word...) para análise.\n\n` +
            `A suas ordens, Senhor.`);
    });

    // 📊 STATUS
    bot.onText(/\/status/, async (msg) => {
        const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        await enviarMensagemLonga(msg.chat.id,
            `🤖 *RELATÓRIO DO SISTEMA — Bob AI X*\n\n` +
            `⏱ Online há: ${tempoOnline()}\n` +
            `🧠 Memória: ${mem} MB\n` +
            `⚙️ Node: ${process.version}\n` +
            `📡 Provedor: OpenRouter (gratuito)\n` +
            `🛡 Status: Todos os sistemas operacionais, Senhor.`);
    });

    // ⚡ PING
    bot.onText(/\/ping/, async (msg) => {
        const inicio = Date.now();
        const m = await bot.sendMessage(msg.chat.id, '⚡ Medindo...');
        const lat = Date.now() - inicio;
        await bot.editMessageText(`⚡ Latência: ${lat} ms — Resposta imediata, Senhor.`, {
            chat_id: msg.chat.id, message_id: m.message_id
        });
    });

    // 🌤 CLIMA
    bot.onText(/\/clima(?: (.+))?/, async (msg, match) => {
        const cidade = (match[1] || process.env.CIDADE_PADRAO || 'Sao Paulo').trim();
        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(cidade)}?format=3&lang=pt`);
            const dados = await res.text();
            await enviarMensagemLonga(msg.chat.id, `🌤 ${dados}`);
        } catch {
            await enviarMensagemLonga(msg.chat.id, '⚠️ Não consegui obter o clima agora, Senhor.');
        }
    });

    // 🕐 HORA E DATA
    bot.onText(/\/hora/, async (msg) => {
        const agora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        await enviarMensagemLonga(msg.chat.id, `🕐 São ${agora}, Senhor.`);
    });

    bot.onText(/\/data/, async (msg) => {
        const hoje = new Date().toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        await enviarMensagemLonga(msg.chat.id, `📅 Hoje é ${hoje}, Senhor.`);
    });

    // 🧮 CALCULAR
    bot.onText(/\/calcular (.+)/, async (msg, match) => {
        const expr = match[1].trim();
        if (!/^[0-9+\-*/().,%\s]+$/.test(expr)) {
            return enviarMensagemLonga(msg.chat.id, '⚠️ Só calculo números e operadores (+ - * /), Senhor.');
        }
        try {
            const resultado = Function(`"use strict"; return (${expr.replace(/,/g, '.')})`)();
            await enviarMensagemLonga(msg.chat.id, `🧮 ${expr} = *${resultado}*`);
        } catch {
            await enviarMensagemLonga(msg.chat.id, '⚠️ Expressão inválida, Senhor.');
        }
    });

    // 🌐 TRADUZIR
    bot.onText(/\/traduzir ([a-z]{2}) ([\s\S]+)/i, async (msg, match) => {
        const idioma = match[1];
        const texto = match[2].trim();
        if (typeof chamarIA !== 'function') {
            return enviarMensagemLonga(msg.chat.id, '⚠️ Tradução indisponível, Senhor.');
        }
        try {
            bot.sendChatAction(msg.chat.id, 'typing');
            const resposta = await chamarIA([
                { role: 'system', content: `Você é um tradutor profissional. Traduza o texto do usuário para o idioma "${idioma}". Responda APENAS com a tradução, sem comentários.` },
                { role: 'user', content: texto }
            ], false);
            await enviarMensagemLonga(msg.chat.id, `🌐 ${resposta}`);
        } catch (e) {
            await enviarMensagemLonga(msg.chat.id, `⚠️ Erro na tradução: ${e.message}`);
        }
    });

    // 📰 NOTÍCIAS
    bot.onText(/\/noticias/, async (msg) => {
        try {
            await enviarMensagemLonga(msg.chat.id, '📰 Buscando as manchetes, Senhor...');
            const res = await fetch('https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419');
            const xml = await res.text();
            const titulos = [...xml.matchAll(/<title>(.*?)<\/title>/g)]
                .map(m => m[1])
                .slice(1, 9);
            const lista = titulos.map((t, i) => `${i + 1}. ${t}`).join('\n');
            await enviarMensagemLonga(msg.chat.id, `📰 *Manchetes de agora, Senhor:*\n\n${lista}`);
        } catch {
            await enviarMensagemLonga(msg.chat.id, '⚠️ Não consegui obter as notícias agora, Senhor.');
        }
    });

    // ⏰ LEMBRETES
    const lembretes = new Map();

    bot.onText(/\/lembrete (\d+)(min|h|s) (.+)/, async (msg, match) => {
        const qtd = parseInt(match[1]);
        const unidade = match[2] === 'min' ? 60000 : match[2] === 'h' ? 3600000 : 1000;
        const texto = match[3];
        const chatId = msg.chat.id;

        const id = Date.now();
        lembretes.set(id, texto);
        await enviarMensagemLonga(chatId,
            `⏰ Anotado, Senhor. Avisarei em ${qtd}${match[2]}: "${texto}"`);

        setTimeout(async () => {
            lembretes.delete(id);
            try {
                await enviarMensagemLonga(chatId, `⏰ *LEMBRETE, Senhor:* ${texto}`);
            } catch { /* silencioso */ }
        }, qtd * unidade);
    });

    bot.onText(/\/lembretes/, async (msg) => {
        if (!lembretes.size) {
            return enviarMensagemLonga(msg.chat.id, '📭 Nenhum lembrete ativo, Senhor.');
        }
        const lista = [...lembretes.values()].map((t, i) => `${i + 1}. ${t}`).join('\n');
        await enviarMensagemLonga(msg.chat.id, `⏰ *Lembretes ativos:*\n${lista}`);
    });

    // 📱 GERAR APP — web app pronto pra usar no celular
    bot.onText(/\/app (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const pedido = match[1].trim();
        try {
            await enviarMensagemLonga(chatId, `📱 Criando o app "${pedido}", Senhor...`);
            bot.sendChatAction(chatId, 'typing');

            const resposta = await chamarIA([
                { role: 'system', content: 'Você gera aplicativos web completos em UM único arquivo HTML (HTML + CSS + JavaScript embutidos). Responda APENAS com o código, sem explicações. O app deve ser bonito, responsivo e funcionar offline no celular.' },
                { role: 'user', content: pedido }
            ], false);

            const buffer = Buffer.from(resposta, 'utf-8');
            await bot.sendDocument(chatId, buffer, {
                filename: `${pedido.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
                caption: '📱 *App pronto, Senhor.*\n\nBaixe o arquivo e abra no navegador do celular. Para virar "app": abra no Chrome → menu → **Adicionar à tela inicial**.'
            });
        } catch (e) {
            await enviarMensagemLonga(chatId, `⚠️ Erro ao criar o app: ${e.message}`);
        }
    });
}

// 🧠 DETECÇÃO DE INTENÇÃO — entende sem precisar de "/"
function detectarIntencao(texto) {
    const t = texto.toLowerCase();

    if (/^(que horas|hora agora|me diga as horas)/.test(t)) return { tipo: 'hora' };
    if (/^(que dia|data de hoje|qual a data)/.test(t)) return { tipo: 'data' };
    if (/^(clima|tempo|previsão)/.test(t)) {
        const cidade = texto.replace(/^(clima|tempo|previsão)( em| de| para| do| da)?/i, '').trim();
        return { tipo: 'clima', cidade: cidade || null };
    }
    if (/^(calcule|calcular|quanto é|resolva)/.test(t)) {
        const expr = texto.replace(/^(calcule|calcular|quanto é|resolva)/i, '').replace(/[?]/g, '').trim();
        return { tipo: 'calcular', expr };
    }
    if (/^(me lembre|lembre-me|me lembra|lembrete)/.test(t)) {
        const m = t.match(/(\d+)\s*(minutos?|min|horas?|h|segundos?|s)\b/);
        if (m) {
            const qtd = parseInt(m[1]);
            const un = m[2].startsWith('h') ? 'h' : m[2].startsWith('s') ? 's' : 'min';
            const textoLembrete = texto.replace(/^(me lembre|lembre-me|me lembra|lembrete)( de| do| da| para| pra|:)?/i, '')
                .replace(new RegExp(`\\d+\\s*${un === 'h' ? 'horas?|h' : un === 's' ? 'segundos?|s' : 'minutos?|min'}`, 'i'), '')
                .trim();
            return { tipo: 'lembrete', qtd, unidade: un, texto: textoLembrete };
        }
    }
    if (/^(traduz|traduzir)/.test(t)) {
        const m = texto.match(/para (inglês|português|espanhol|francês|alemão|italiano|japonês)/i);
        const mapa = { 'inglês': 'en', 'português': 'pt', 'espanhol': 'es', 'francês': 'fr', 'alemão': 'de', 'italiano': 'it', 'japonês': 'ja' };
        if (m) {
            const idioma = mapa[m[1].toLowerCase()];
            const conteudo = texto.replace(/^traduz(a|ir)?( para \w+)?( o texto| isso| isto)?:?/i, '')
                .replace(new RegExp(`para ${m[1]}`, 'i'), '').trim();
            return { tipo: 'traduzir', idioma, texto: conteudo };
        }
    }
    if (/^(notícias|noticias|manchetes|o que está acontecendo)/.test(t)) return { tipo: 'noticias' };

    return null;
}

// Executa a intenção detectada
async function executarIntencao(bot, chatId, intencao, enviarMensagemLonga, chamarIA) {
    switch (intencao.tipo) {
        case 'hora': {
            const agora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            await enviarMensagemLonga(chatId, `🕐 São ${agora}, Senhor.`);
            return true;
        }
        case 'data': {
            const hoje = new Date().toLocaleDateString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            await enviarMensagemLonga(chatId, `📅 Hoje é ${hoje}, Senhor.`);
            return true;
        }
        case 'clima': {
            const cidade = intencao.cidade || process.env.CIDADE_PADRAO || 'Sao Paulo';
            try {
                const res = await fetch(`https://wttr.in/${encodeURIComponent(cidade)}?format=3&lang=pt`);
                await enviarMensagemLonga(chatId, `🌤 ${await res.text()}`);
            } catch {
                await enviarMensagemLonga(chatId, '⚠️ Não consegui obter o clima agora, Senhor.');
            }
            return true;
        }
        case 'calcular': {
            if (!/^[0-9+\-*/().,%\s]+$/.test(intencao.expr)) return false;
            try {
                const r = Function(`"use strict"; return (${intencao.expr.replace(/,/g, '.')})`)();
                await enviarMensagemLonga(chatId, `🧮 ${intencao.expr} = *${r}*`);
                return true;
            } catch { return false; }
        }
        case 'traduzir': {
            try {
                bot.sendChatAction(chatId, 'typing');
                const r = await chamarIA([
                    { role: 'system', content: `Traduza para "${intencao.idioma}". Responda APENAS com a tradução.` },
                    { role: 'user', content: intencao.texto }
                ], false);
                await enviarMensagemLonga(chatId, `🌐 ${r}`);
            } catch {
                await enviarMensagemLonga(chatId, '⚠️ Erro na tradução, Senhor.');
            }
            return true;
        }
        case 'noticias': {
            try {
                const res = await fetch('https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419');
                const xml = await res.text();
                const titulos = [...xml.matchAll(/<title>(.*?)<\/title>/g)].map(m => m[1]).slice(1, 9);
                await enviarMensagemLonga(chatId,
                    `📰 *Manchetes, Senhor:*\n\n${titulos.map((t, i) => `${i + 1}. ${t}`).join('\n')}`);
            } catch {
                await enviarMensagemLonga(chatId, '⚠️ Não consegui as notícias agora, Senhor.');
            }
            return true;
        }
        case 'lembrete': {
            const ms = intencao.qtd * (intencao.unidade === 'h' ? 3600000 : intencao.unidade === 's' ? 1000 : 60000);
            await enviarMensagemLonga(chatId, `⏰ Anotado, Senhor. Avisarei em ${intencao.qtd}${intencao.unidade}: "${intencao.texto}"`);
            setTimeout(() => enviarMensagemLonga(chatId, `⏰ *LEMBRETE, Senhor:* ${intencao.texto}`).catch(() => {}), ms);
            return true;
        }
    }
    return false;
}

module.exports = { registrar, tempoOnline, saudacaoPorHorario, detectarIntencao, executarIntencao };
FIM
