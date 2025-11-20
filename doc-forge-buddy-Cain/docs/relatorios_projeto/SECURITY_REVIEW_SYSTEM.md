# Sistema de Revisão de Segurança de Dependências

## 📋 Visão Geral

Este sistema implementa um review completo de segurança de dependências com múltiplas camadas de proteção e monitoramento.

## 🛠️ Componentes Implementados

### 1. Scripts de Segurança (package.json)

```bash
# Comandos principais
npm run security:audit      # Audit NPM com nível moderado
npm run security:fix        # Tenta corrigir vulnerabilidades automaticamente
npm run security:full-audit # Audit com nível alto
npm run security:check-snyk # Executa Snyk scan
npm run security:snyk-monitor # Monitora projeto com Snyk
npm run security:update     # Verifica e atualiza pacotes desatualizados
npm run security:scan       # Scan completo (NPM + Snyk)
npm run security:report     # Gera relatório detalhado
```

### 2. Configuração do Snyk (.snyk)

- **ID do Projeto**: doc-forge-buddy
- **Organização**: doc-forge-team
- **Limite de Severidade**: medium
- **Configuração de linguagem**: Node.js com package.json

### 3. Scanner Customizado

**Arquivos:**
- `scripts/security-scanner.ts` - Versão TypeScript
- `scripts/security-scanner.js` - Versão JavaScript

**Funcionalidades:**
- Scan de vulnerabilidades via npm audit
- Verificação de pacotes desatualizados
- Análise de licenças
- Geração de relatórios JSON
- Mapeamento de severidades

### 4. Automação GitHub Actions

**Workflow**: `.github/workflows/security.yml`

**Gatilhos:**
- Push para branches main/develop
- Pull requests para main
- Schedule diário (meia-noite)
- Manual (workflow_dispatch)

**Jobs:**
1. **security-audit**: Scan principal de vulnerabilidades
2. **license-check**: Verificação de conformidade de licenças

**Funcionalidades:**
- Fails builds com vulnerabilidades críticas
- Gera relatórios de artefatos
- Comenta PRs com resultados
- Verifica gates de segurança

### 5. Dependabot (.github/dependabot.yml)

**Configurações:**
- **NPM**: Updates semanais (segunda, 09:00)
- **GitHub Actions**: Updates semanais (segunda, 10:00)
- **Limite PRs**: 10 para NPM, 5 para Actions
- **Revisores**: security-team, devops-team
- **Ignora major updates** para React, TypeScript, Vite

### 6. Dashboard de Segurança

**Componente**: `src/components/SecurityDashboard.tsx`

**Funcionalidades:**
- Métricas de vulnerabilidades em tempo real
- Visualização por severidade (Critical, High, Medium, Low)
- Lista de pacotes desatualizados
- Issues de licenças
- Ações rápidas (link para documentação)
- Tab navigation (Overview, Vulnerabilities, Outdated)

## 🚀 Como Usar

### Instalação Inicial

1. **Instalar dependências de segurança:**
```bash
npm install snyk @snyk/protect license-checker
```

2. **Validar setup:**
```bash
node scripts/validate-security-setup.js
```

3. **Configurar Snyk:**
   - Criar conta em [snyk.io](https://snyk.io)
   - Obter token API
   - Configurar como secret `SNYK_TOKEN` no repositório

### Uso Diário

1. **Scan manual:**
```bash
npm run security:scan
```

2. **Verificar e corrigir:**
```bash
npm run security:audit
npm run security:fix
```

3. **Gerar relatório:**
```bash
npm run security:report
```

4. **Atualizar dependências:**
```bash
npm run security:update
```

### Configuração de Gates de Segurança

O sistema implementa os seguintes gates:

- **Critical**: 0 tolerância (fails build)
- **High**: Máximo 5 vulnerabilidades
- **Medium**: Report apenas
- **License**: Alerta para GPL/AGPL/LGPL/BSL/CPOL

## 📊 Relatórios e Métricas

### Formato do Relatório JSON

```json
{
  "timestamp": "2025-11-09T08:08:32.000Z",
  "vulnerabilities": [
    {
      "name": "package-name",
      "severity": "high",
      "version": "1.0.0",
      "fixAvailable": true,
      "description": "Vulnerability description",
      "cve": "CVE-2024-XXXX"
    }
  ],
  "outdated": [
    {
      "name": "package-name",
      "current": "1.0.0",
      "wanted": "1.0.1",
      "latest": "1.2.0"
    }
  ],
  "licenseIssues": []
}
```

### Artefatos do GitHub Actions

- `security-report.md` - Relatório em markdown
- `security-report.json` - Dados estruturados
- `npm-audit.json` - Resultado do npm audit
- `outdated.json` - Lista de pacotes desatualizados
- `licenses.json` - Informações de licenças

## 🔧 Configurações Avançadas

### Personalizar Limites de Severidade

Editar `.snyk`:
```json
{
  "severity-threshold": "high"
}
```

### Configurar Ignorados

Editar `.snyk`:
```json
{
  "ignore": {
    "npm": {
      "package-name": {
        "reason": "False positive",
        "expires": "2025-12-31T23:59:59.000Z"
      }
    }
  }
}
```

### Adicionar Monitores Customizados

```bash
# Monitor específico
snyk monitor --file=package.json --project-name="custom-project"

# Monitor com tags
snyk monitor --tags=env=production,team=backend
```

## 🛡️ Boas Práticas

### 1. Review de PRs

- Sempre verificar comentários do Security Audit
- Não fazer merge com vulnerabilidades críticas
- Revisar atualizações automáticas do Dependabot

### 2. Manutenção Regular

- Executar scan semanal manual
- Revisar relatórios de artefatos
- Atualizar políticas conforme necessário

### 3. Configuração de Equipe

- Definir responsáveis por security reviews
- Configurar notificações do Snyk
- Estabelecer processo de escalação

## 🐛 Troubleshooting

### Problemas Comuns

**1. Snyk não funciona:**
```bash
# Verificar autenticação
snyk auth

# Testar token
snyk test --dry-run
```

**2. Falsos positivos:**
```bash
# Ignorar vulnerabilidade específica
snyk ignore <vulnerability-id>
```

**3. Build falha por vulnerabilidades:**
- Verificar logs do GitHub Actions
- Revisar gates configurados
- Considerar ignorados temporários

### Logs e Debugging

```bash
# NPM audit detalhado
npm audit --json

# Snyk com debug
SNYK_DEBUG=true snyk test

# Scanner customizado com logs
node scripts/security-scanner.js --verbose
```

## 📈 Métricas e Monitoramento

### KPIs de Segurança

- **Tempo de resolução** de vulnerabilidades críticas
- **Taxa de cobertura** de scanning (100% ideal)
- **Número de ignorados** (deve ser mínimo)
- **Tempo de detecção** de novas vulnerabilidades

### Alertas Recomendados

- Vulnerabilidade crítica detectada
- Build falhou por security gates
- Dependabot PRs pendentes > 5
- Pacotes não scaneados > 0

## 🔗 Recursos Úteis

- [Snyk Documentation](https://docs.snyk.io/)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Security Advisories](https://github.com/advisories)
- [Common Vulnerabilities Database](https://cve.mitre.org/)

## 📝 Changelog

### v1.0.0 - 2025-11-09
- Implementação inicial do sistema de segurança
- Configuração de Snyk e NPM audit
- Automação GitHub Actions
- Dashboard React
- Configuração Dependabot
- Scanner customizado
