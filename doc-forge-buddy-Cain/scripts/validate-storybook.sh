#!/bin/bash

# Script de validação da Component Library
# Verifica se tudo está configurado corretamente

set -e

echo "🔍 Validando Component Library e Storybook..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_check() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Verificar arquivos essenciais
echo "Verificando arquivos de configuração..."

# .storybook/
if [ -f ".storybook/main.ts" ]; then
    print_check "main.ts existe"
else
    print_error "main.ts não encontrado"
fi

if [ -f ".storybook/preview.ts" ]; then
    print_check "preview.ts existe"
else
    print_error "preview.ts não encontrado"
fi

if [ -f ".storybook/manager.ts" ]; then
    print_check "manager.ts existe"
else
    print_error "manager.ts não encontrado"
fi

if [ -f ".storybook/types.ts" ]; then
    print_check "types.ts existe"
else
    print_error "types.ts não encontrado"
fi

if [ -f ".storybook/styles/globals.css" ]; then
    print_check "globals.css existe"
else
    print_error "globals.css não encontrado"
fi

# src/
if [ -d "src/stories" ]; then
    print_check "src/stories existe"
else
    print_error "src/stories não encontrado"
fi

if [ -d "src/components/ui" ]; then
    print_check "src/components/ui existe"
else
    print_error "src/components/ui não encontrado"
fi

# Stories
STORY_COUNT=$(find src/ -name "*.stories.tsx" | wc -l)
if [ "$STORY_COUNT" -gt 0 ]; then
    print_check "$STORY_COUNT stories encontrados"
else
    print_warning "Nenhuma story encontrada"
fi

# Scripts
if [ -f "scripts/setup-storybook.sh" ]; then
    print_check "setup-storybook.sh existe"
else
    print_error "setup-storybook.sh não encontrado"
fi

# GitHub Actions
if [ -f ".github/workflows/storybook.yml" ]; then
    print_check "GitHub Actions workflow existe"
else
    print_error "GitHub Actions workflow não encontrado"
fi

# Configurações
if [ -f "chromatic.config.json" ]; then
    print_check "Chromatic config existe"
else
    print_warning "Chromatic config não encontrado"
fi

echo ""
echo "Verificando dependências no package.json..."

# Scripts do Storybook
if grep -q '"storybook"' package.json; then
    print_check "Script 'storybook' encontrado"
else
    print_error "Script 'storybook' não encontrado"
fi

if grep -q '"storybook:build"' package.json; then
    print_check "Script 'storybook:build' encontrado"
else
    print_error "Script 'storybook:build' não encontrado"
fi

echo ""
echo "📊 Estatísticas da Component Library:"
echo "  • Stories criadas: $(find src/ -name "*.stories.tsx" | wc -l)"
echo "  • Componentes UI: $(find src/components/ui -name "*.tsx" | grep -v "\.stories" | wc -l)"
echo "  • Arquivos de configuração: $(find .storybook -type f | wc -l)"
echo "  • Scripts disponíveis: $(grep -c '"storybook' package.json)"

echo ""
echo "🎯 Próximos passos:"
echo "  1. Execute: npm run storybook"
echo "  2. Acesse: http://localhost:6006"
echo "  3. Para build: npm run storybook:build"
echo "  4. Para deploy: npm run deploy:storybook"

echo ""
if [ "$STORY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}🎉 Component Library configurada com sucesso!${NC}"
else
    echo -e "${YELLOW}⚠️ Component Library parcialmente configurada${NC}"
fi