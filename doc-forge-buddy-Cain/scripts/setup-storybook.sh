#!/bin/bash

# Script para inicializar a component library e Storybook
# Usage: ./scripts/setup-storybook.sh

set -e

echo "🚀 Configurando Component Library e Storybook..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_warning "Node.js versão $NODE_VERSION detectada. Recomenda-se Node.js 16+ para melhor compatibilidade."
fi

print_status "Node.js $(node --version) detectado."

# Verificar se estamos usando npm, yarn ou pnpm
PACKAGE_MANAGER="npm"
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
fi

print_status "Usando $PACKAGE_MANAGER como package manager."

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependências..."
    $PACKAGE_MANAGER install
    print_success "Dependências instaladas."
else
    print_status "Dependências já estão instaladas."
fi

# Verificar se o Storybook CLI está disponível
if ! command -v storybook &> /dev/null; then
    print_status "Instalando Storybook CLI..."
    $PACKAGE_MANAGER install --save-dev @storybook/cli
    print_success "Storybook CLI instalado."
else
    print_status "Storybook CLI já está disponível."
fi

# Verificar estrutura de diretórios
print_status "Verificando estrutura de diretórios..."

# Criar diretórios se não existirem
mkdir -p .storybook/styles
mkdir -p src/stories
mkdir -p src/components/ui

# Verificar arquivos essenciais
if [ ! -f ".storybook/main.ts" ]; then
    print_error "Arquivo .storybook/main.ts não encontrado. Execute este script com o projeto já configurado."
    exit 1
fi

print_success "Estrutura de diretórios verificada."

# Verificar se há algum erro de TypeScript
print_status "Verificando tipos TypeScript..."
if ! npm run type-check --silent 2>/dev/null; then
    print_warning "Alguns erros de TypeScript foram encontrados. Verifique o projeto."
else
    print_success "Tipos TypeScript verificados."
fi

# Verificar lint
print_status "Verificando lint..."
if ! npm run lint --silent 2>/dev/null; then
    print_warning "Alguns problemas de lint foram encontrados. Execute 'npm run lint:fix' para corrigir."
else
    print_success "Lint verificado."
fi

# Build de teste
print_status "Executando build de teste..."
if npm run build --silent 2>/dev/null; then
    print_success "Build executado com sucesso."
else
    print_warning "Build falhou. Verifique as dependências."
fi

echo ""
echo "✅ Configuração da Component Library concluída!"
echo ""
echo "📖 Para usar o Storybook:"
echo "   npm run storybook"
echo ""
echo "🔧 Para buildar a documentação:"
echo "   npm run storybook:build"
echo ""
echo "📚 Para testar os componentes:"
echo "   npm run storybook:test"
echo ""
echo "📝 Para mais informações, consulte:"
echo "   - README.md (documentação geral)"
echo "   - STORYBOOK_README.md (documentação específica do Storybook)"
echo ""
echo "🎉 Component Library pronta para uso!"

# Abrir Storybook automaticamente (opcional)
if [ "$1" = "--open" ]; then
    print_status "Abrindo Storybook no navegador..."
    open http://localhost:6006 || start http://localhost:6006 || echo "Acesse http://localhost:6006 manualmente"
fi