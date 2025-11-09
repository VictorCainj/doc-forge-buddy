# E2E Tests com Playwright

Este projeto utiliza Playwright para testes End-to-End automatizados dos fluxos críticos de negócio.

## 🏗️ Configuração

### Dependências Instaladas
```json
{
  "@playwright/test": "^1.56.1"
}
```

### Estrutura de Diretórios
```
e2e/
├── setup/
│   ├── global-setup.ts      # Configuração inicial
│   └── global-teardown.ts   # Limpeza final
├── utils/
│   ├── test-data-manager.ts # Gerenciamento de dados de teste
│   └── test-helpers.ts      # Utilitários comuns
├── auth.spec.ts            # Testes de autenticação
├── contratos.spec.ts       # Testes de gestão de contratos
├── documents.spec.ts       # Testes de documentos
└── vistoria.spec.ts        # Testes de vistoria
```

## 🚀 Executar Testes

### Comandos Disponíveis
```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface gráfica
npm run test:e2e:ui

# Executar com browser visível
npm run test:e2e:headed

# Executar apenas um arquivo específico
npx playwright test auth.spec.ts

# Executar com report detalhado
npx playwright test --reporter=html

# Debug de teste específico
npx playwright test --debug auth.spec.ts
```

### Configuração de Ambiente
```bash
# Variáveis de ambiente opcionais
export CI=true                    # Habilita modo CI
export SUPABASE_TEST_URL=...      # URL do Supabase de teste
export SUPABASE_TEST_KEY=...      # Chave do Supabase de teste
```

## 📊 Fluxos Testados

### 1. Autenticação
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas
- ✅ Logout
- ✅ Persistência de sessão
- ✅ Recuperação de senha
- ✅ Validação de campos obrigatórios
- ✅ Navegação entre login/registro
- ✅ Tratamento de erros de rede

### 2. Gestão de Contratos
- ✅ Navegação para lista de contratos
- ✅ Criação de novo contrato
- ✅ Edição de contrato existente
- ✅ Exclusão de contrato
- ✅ Validação de campos obrigatórios
- ✅ Filtros por status
- ✅ Busca por nome
- ✅ Visualização de detalhes
- ✅ Geração de PDF
- ✅ Paginação

### 3. Geração de Documentos
- ✅ Navegação para geração de documentos
- ✅ Seleção de template
- ✅ Preenchimento de dados
- ✅ Geração de PDF
- ✅ Download de documento
- ✅ Validação de campos
- ✅ Preview de documento
- ✅ Salvar como rascunho
- ✅ Lista de documentos salvos

### 4. Análise de Vistoria
- ✅ Navegação para página de vistorias
- ✅ Criação de nova vistoria
- ✅ Preenchimento de dados básicos
- ✅ Adição de ambientes
- ✅ Upload de imagens
- ✅ Salvamento de vistoria
- ✅ Edição de vistoria existente
- ✅ Lista de vistorias
- ✅ Validação de campos
- ✅ Análise de imagem
- ✅ Geração de laudo
- ✅ Filtros por status

## 🔧 Configuração Avançada

### Playwright Config (`playwright.config.ts`)
```typescript
// Configurações principais:
- Timeout: 30s
- Retries: 2 (CI) / 0 (local)
- Parallel execution: habilitado
- Screenshot: apenas em falhas
- Video: apenas em falhas
- Trace: apenas em falhas
- Browsers: Chrome, Firefox, Safari
- Mobile: Pixel 5, iPad Pro
```

### Data TestIDs
Os testes utilizam `data-testid` para seleção robusta de elementos:
```html
<input data-testid="email-input" />
<button data-testid="login-button" />
<div data-testid="error-message" />
```

## 📈 Relatórios

### Tipos de Relatório
1. **HTML Report**: `playwright-report/index.html`
2. **JSON**: `test-results/results.json`
3. **JUnit XML**: `test-results/results.xml`
4. **Console**: Lista resumida

### Artefatos Salvos
- 📸 Screenshots (apenas em falhas)
- 🎥 Vídeos de execução (apenas em falhas)
- 🔍 Traces de execução
- 📊 Resultados detalhados

## 🛠️ Desenvolvimento

### Adicionando Novos Testes
1. Criar arquivo `*.spec.ts` em `e2e/`
2. Importar utilitários:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { testDataManager } from '../utils/test-data-manager';
   import { createTestHelpers } from '../utils/test-helpers';
   ```
3. Usar `test.describe` para agrupar testes relacionados
4. Implementar `test.beforeEach` para setup
5. Usar data-testids para seletores

### Padrões de Código
```typescript
test.describe('Nova Funcionalidade', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    await testDataManager.loginAsValidUser(page);
  });

  test('deve fazer algo específico', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Arrange
    await helpers.goto('/rota');
    await helpers.waitForLoadState();

    // Act
    await helpers.clickTestButton('action-button');

    // Assert
    await helpers.expectSuccessMessage();
  });
});
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Timeout de elementos
```typescript
// Aumentar timeout específico
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
```

#### 2. Elemento não encontrado
- Verificar se data-testid está correto
- Aguardar carregamento da página
- Verificar se elemento está visível

#### 3. Falhas intermitentes
- Aumentar retries no playwright.config.ts
- Adicionar waits explícitos
- Verificar se dados de teste são consistentes

#### 4. Falhas de rede
- Verificar se aplicação está rodando
- Verificar URLs no playwright.config.ts
- Verificar permissões de rede

## 🔄 Integração Contínua

### GitHub Actions
O workflow está configurado em `.github/workflows/e2e-tests.yml`:
- Executa em push e pull request
- Instala dependências e browsers
- Executa testes E2E
- Executa Lighthouse
- Upload de artefatos

### Failures Críticas
- Build deve passar
- Testes E2E devem passar
- Lighthouse deve ter score mínimo configurado

## 📝 Scripts Adicionais

```bash
# Limpar resultados antigos
rm -rf test-results/* playwright-report/*

# Gerar report standalone
npx playwright show-report

# Instalar browsers apenas
npx playwright install

# Update browsers
npx playwright install --with-deps

# Codegen (gerador de testes)
npx playwright codegen http://localhost:5173
```

## 🎯 Melhores Práticas

1. **Usar data-testids**: Evitar seletores frágeis
2. **Aguardar carregamento**: Sempre usar `waitForLoadState()`
3. **Dados consistentes**: Usar `TestDataManager`
4. **Testes independentes**: Não dependem de estado de outros testes
5. **Assertions claras**: Verificar estados específicos
6. **Cleanup**: Limpar estado após cada teste
7. **Screenshots**: Capturar em falhas para debugging