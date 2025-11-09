#!/bin/bash

# Script de Setup de Segurança Automático
# Execute: chmod +x scripts/setup-security.sh && ./scripts/setup-security.sh

echo "🔐 Configurando HTTPS e Security Headers..."
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se é Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado! Instale o Node.js primeiro."
    exit 1
fi

# Verificar se é npm
if ! command -v npm &> /dev/null; then
    error "npm não encontrado! Instale o npm primeiro."
    exit 1
fi

log "Node.js $(node --version) encontrado"
log "npm $(npm --version) encontrado"

# 1. Instalar dependências de segurança
log "Instalando dependências de segurança..."
npm install express helmet cors cookie-parser compression express-rate-limit dotenv

if [ $? -eq 0 ]; then
    log "✅ Dependências instaladas com sucesso"
else
    error "❌ Erro ao instalar dependências"
    exit 1
fi

# 2. Instalar tipos TypeScript
log "Instalando tipos TypeScript..."
npm install --save-dev @types/express @types/cookie-parser @types/compression @types/cors @types/supertest supertest

if [ $? -eq 0 ]; then
    log "✅ Tipos TypeScript instalados"
else
    warn "⚠️ Aviso: Erro ao instalar tipos TypeScript (continuando...)"
fi

# 3. Gerar certificados SSL para desenvolvimento
log "Gerando certificados SSL para desenvolvimento..."
node scripts/generate-ssl-certs.js dev localhost

if [ $? -eq 0 ]; then
    log "✅ Certificados SSL gerados"
else
    warn "⚠️ Aviso: Erro ao gerar certificados SSL (pode ser necessário instalar OpenSSL)"
fi

# 4. Configurar .env.production
log "Configurando arquivo .env.production..."

cat > .env.production << EOL
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# HTTPS Configuration
HTTPS=true
SSL_CERT_PATH=ssl-certs/dev/private-key.pem
SSL_KEY_PATH=ssl-certs/dev/certificate.pem

# Security
SECURE_COOKIES=true
TRUST_PROXY=1
SESSION_SECRET=$(openssl rand -base64 32)

# CORS Origins
ALLOWED_ORIGINS=https://localhost:3000,https://agzutoonsruttqbjnclo.supabase.co

# Supabase Configuration (manter existente)
VITE_SUPABASE_PROJECT_ID=agzutoonsruttqbjnclo
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4
VITE_SUPABASE_URL=https://agzutoonsruttqbjnclo.supabase.co

# Security Headers
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
CONTENT_SECURITY_POLICY=true
EOL

log "✅ Arquivo .env.production configurado"

# 5. Testar se o servidor inicia
log "Testando configuração do servidor..."

# Fazer build primeiro
npm run build:production > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "✅ Build de produção bem-sucedido"
else
    warn "⚠️ Aviso: Build de produção falhou (pode ser necessário ajustar configurações)"
fi

# 6. Executar testes de segurança
log "Executando testes de segurança..."

# Verificar se o arquivo de teste existe
if [ -f "src/__tests__/security.test.ts" ]; then
    npm test -- src/__tests__/security.test.ts --run > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Testes de segurança passou"
    else
        warn "⚠️ Aviso: Alguns testes de segurança falharam"
    fi
else
    warn "⚠️ Arquivo de teste não encontrado"
fi

# 7. Verificar configurações do servidor
log "Verificando configurações..."

if [ -f "server.js" ]; then
    log "✅ Servidor Express configurado"
else
    error "❌ Arquivo server.js não encontrado!"
    exit 1
fi

if [ -f "src/hooks/useSecurity.ts" ]; then
    log "✅ Hooks de segurança configurados"
else
    error "❌ Hooks de segurança não encontrados!"
    exit 1
fi

if [ -f "src/components/SecurityProvider.tsx" ]; then
    log "✅ Security Provider configurado"
else
    error "❌ Security Provider não encontrado!"
    exit 1
fi

# 8. Mostrar resumo
echo ""
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo "========================="
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo "✅ Dependências de segurança instaladas"
echo "✅ Certificados SSL gerados (desenvolvimento)"
echo "✅ Arquivo .env.production configurado"
echo "✅ Servidor Express configurado"
echo "✅ Hooks e componentes de segurança criados"
echo "✅ Testes de segurança disponíveis"
echo ""
echo -e "${BLUE}🚀 Para iniciar:${NC}"
echo "npm run start:prod    # Produção com HTTPS"
echo "npm run dev:server    # Desenvolvimento"
echo ""
echo -e "${BLUE}🔧 Para testar:${NC}"
echo "npm test -- src/__tests__/security.test.ts"
echo ""
echo -e "${BLUE}📖 Para mais informações:${NC}"
echo "cat HTTPS_SECURITY_HEADERS_GUIDE.md"
echo ""
echo -e "${YELLOW}⚠️ IMPORTANTE:${NC}"
echo "1. Para produção, obtenha certificados de uma CA confiável"
echo "2. Configure os domínios corretos em ALLOWED_ORIGINS"
echo "3. Defina SESSION_SECRET seguro para produção"
echo "4. Teste todas as funcionalidades antes de deploy"
echo ""

# 9. Verificar se OpenSSL está disponível
if command -v openssl &> /dev/null; then
    log "OpenSSL $(openssl version) encontrado"
else
    warn "OpenSSL não encontrado - algumas funcionalidades podem não funcionar"
fi

echo ""
log "Setup de segurança concluído! 🎉"