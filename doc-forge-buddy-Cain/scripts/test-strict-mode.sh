#!/bin/bash

# Script para testar TypeScript strict mode
cd "$(dirname "$0")"
echo "🔍 Testando TypeScript strict mode no diretório: $(pwd)"

# Teste 1: Compilação normal
echo "📝 Teste 1: Compilação normal (sem strict mode)..."
if npx tsc --noEmit; then
    echo "✅ Compilação normal: OK"
else
    echo "❌ Compilação normal: FALHOU"
fi

# Teste 2: Compilação com strict mode
echo "🔒 Teste 2: Compilação com strict mode..."
if npx tsc --project tsconfig.strict.json --noEmit; then
    echo "✅ Compilação strict mode: OK"
else
    echo "❌ Compilação strict mode: FALHOU"
fi

# Teste 3: Verificar configurações
echo "⚙️  Teste 3: Verificando configurações..."
if [ -f "tsconfig.json" ]; then
    echo "📄 tsconfig.json encontrado"
else
    echo "⚠️  tsconfig.json não encontrado"
fi

if [ -f "tsconfig.strict.json" ]; then
    echo "📄 tsconfig.strict.json encontrado"
else
    echo "⚠️  tsconfig.strict.json não encontrado"
fi

echo "🎯 Status do strict mode configurado:"
echo "   - strict: true"
echo "   - noImplicitAny: true"
echo "   - noImplicitReturns: true"
echo "   - noImplicitThis: true"
echo "   - noUnusedLocals: false (temporário)"
echo "   - noUnusedParameters: false (temporário)"
echo "   - exactOptionalPropertyTypes: true"
echo "   - noImplicitOverride: true"