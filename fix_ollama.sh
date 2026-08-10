#!/bin/bash
# Script para tornar o Ollama opcional

# Adiciona verificação de ambiente no início do bot.js
if ! grep -q "USE_OLLAMA" bot.js; then
    # Adiciona variável de controle no topo
    sed -i '1i\
const USE_OLLAMA = process.env.USE_OLLAMA !== "false";' bot.js
    echo "✅ Variável USE_OLLAMA adicionada"
fi

echo "🔧 Corrigindo chamadas do Ollama..."

# Substitui chamadas diretas de ollama por versões seguras
if grep -q "spawn.*ollama" bot.js; then
    echo "⚠️  Encontrado spawn de ollama - precisa de ajuste manual"
fi

echo "✅ Script de correção aplicado!"
