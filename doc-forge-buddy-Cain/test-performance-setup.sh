#!/bin/bash

# Script de teste para performance monitoring e bundle analysis
echo "🚀 Testando configuração de Performance Monitoring e Bundle Analysis"
echo "==============================================="

# Verificar se web-vitals está no package.json
if grep -q "web-vitals" package.json; then
    echo "✅ web-vitals encontrado no package.json"
else
    echo "❌ web-vitals NÃO encontrado no package.json"
fi

# Verificar se os scripts de analysis estão no package.json
if grep -q '"analyze"' package.json; then
    echo "✅ Script 'analyze' encontrado no package.json"
else
    echo "❌ Script 'analyze' NÃO encontrado no package.json"
fi

if grep -q '"bundle-report"' package.json; then
    echo "✅ Script 'bundle-report' encontrado no package.json"
else
    echo "❌ Script 'bundle-report' NÃO encontrado no package.json"
fi

# Verificar se o arquivo de performance foi criado
if [ -f "src/utils/performance.ts" ]; then
    echo "✅ Arquivo src/utils/performance.ts criado"
else
    echo "❌ Arquivo src/utils/performance.ts NÃO encontrado"
fi

# Verificar se o componente PerformanceMonitor foi criado
if [ -f "src/components/PerformanceMonitor.tsx" ]; then
    echo "✅ Componente PerformanceMonitor.tsx criado"
else
    echo "❌ Componente PerformanceMonitor.tsx NÃO encontrado"
fi

# Verificar se o vite.config.ts tem o visualizer
if grep -q "rollup-plugin-visualizer" vite.config.ts; then
    echo "✅ rollup-plugin-visualizer configurado no vite.config.ts"
else
    echo "❌ rollup-plugin-visualizer NÃO configurado no vite.config.ts"
fi

# Verificar se o main.tsx tem a inicialização
if grep -q "initPerformanceMonitoring" src/main.tsx; then
    echo "✅ Inicialização de performance no main.tsx"
else
    echo "❌ Inicialização de performance NÃO encontrada no main.tsx"
fi

# Verificar se o App.tsx tem o PerformanceMonitor
if grep -q "PerformanceMonitor" src/App.tsx; then
    echo "✅ PerformanceMonitor integrado no App.tsx"
else
    echo "❌ PerformanceMonitor NÃO integrado no App.tsx"
fi

echo ""
echo "📊 Scripts de bundle analysis disponíveis:"
echo "==============================================="
echo "• npm run analyze          - Análise básica de bundle"
echo "• npm run analyze:dist     - Análise após build"
echo "• npm run bundle-report    - Relatório em treemap"
echo "• npm run build -- --mode analyze - Análise detalhada"
echo ""
echo "📈 Para testar em desenvolvimento:"
echo "• npm run dev              - Executar em modo desenvolvimento"
echo "• O PerformanceMonitor aparecerá automaticamente"
echo ""
echo "📝 Documentação completa em:"
echo "• docs/PERFORMANCE_MONITORING_SETUP.md"