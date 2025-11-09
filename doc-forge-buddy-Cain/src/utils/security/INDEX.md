# 🗂️ Índice do Sistema de Segurança

## 📁 Estrutura de Arquivos

```
/src/utils/security/
├── index.ts                          # ⭐ EXPORT PRINCIPAL - Entry point
├── README.md                         # 📖 Documentação completa
├── IMPLEMENTATION_SUMMARY.md         # ✅ Resumo da implementação
├── DEPENDENCIES.md                   # 📦 Dependências necessárias
│
├── 📂 sanitization/
│   └── inputSanitizer.ts            # 🧹 Sanitização de inputs (225 linhas)
│
├── 📂 validators/
│   └── dataValidators.ts            # ✅ Validações (394 linhas)
│
├── 📂 rate-limiting/
│   └── rateLimiter.ts               # ⚡ Rate limiting (368 linhas)
│
├── 📂 middleware/
│   └── sanitizationMiddleware.ts    # 🛡️ Middlewares (339 linhas)
│
├── 📂 query-builder/
│   └── secureQueryBuilder.ts        # 🔒 Query builder (550 linhas)
│
├── 📂 examples/
│   └── usageExamples.ts             # 💡 Exemplos práticos (463 linhas)
│
└── 📂 __tests__/
    └── security.test.ts             # 🧪 Testes (540 linhas)

TOTAL: 11 arquivos | 3.630+ linhas de código
```

## 🚀 Guia de Início Rápido

### 1. **Importação Principal**
```typescript
// Importe tudo do índice principal
import { 
  sanitizeInput, 
  validateEmail, 
  authRateLimiter,
  sanitizeAll,
  SecureQueryBuilder,
  configureSecurity
} from './utils/security';
```

### 2. **Configuração Inicial**
```typescript
// Configure o sistema
const security = configureSecurity({
  redisUrl: process.env.REDIS_URL,
  enableRateLimit: true,
  enableSanitization: true
});
```

### 3. **Aplicar Middleware**
```typescript
// Express middleware
app.use(sanitizeAll);
app.use('/api/auth', security.rateLimiters.auth);
```

## 📚 Documentação por Arquivo

### ⭐ **index.ts** - Entry Point
- Exports centralizados
- Configuração global
- Decorators de segurança
- Utilitários de desenvolvimento
- Health checks

### 🧹 **sanitization/inputSanitizer.ts**
- `sanitizeInput()` - Sanitização básica de strings
- `sanitizeRichText()` - Sanitização de HTML
- `sanitizeUrl()` - Validação e limpeza de URLs
- `sanitizeObject()` - Sanitização recursiva de objetos
- `sanitizeNumber()` - Extração de números
- `sanitizeBoolean()` - Conversão para boolean
- `sanitizeFilename()` - Limpeza de nomes de arquivo

### ✅ **validators/dataValidators.ts**
- `validateEmail()` - Validação completa de email
- `validatePhone()` - Validação de telefone brasileiro
- `validateCPF()` - Validação de CPF com dígitos verificadores
- `validateCNPJ()` - Validação de CNPJ com dígitos verificadores
- `validatePassword()` - Requisitos de segurança de senha
- `validateId()` - Validação de UUID e ID numérico
- `validateDate()` - Validação de datas

### ⚡ **rate-limiting/rateLimiter.ts**
- `authRateLimiter` - 5 tentativas/15min
- `apiRateLimiter` - 100 requests/min
- `uploadRateLimiter` - 10 uploads/hora
- `searchRateLimiter` - 30 pesquisas/min
- `strictRateLimiter` - 60 requests/min
- `createRateLimitMiddleware()` - Factory de middleware
- `getRateLimitStatus()` - Status do rate limiting

### 🛡️ **middleware/sanitizationMiddleware.ts**
- `sanitizeAll()` - Sanitização completa
- `sanitizeBody()` - Sanitização de body
- `sanitizeQuery()` - Sanitização de query
- `sanitizeParams()` - Sanitização de params
- `createSanitizeMiddleware()` - Middleware customizado
- `validateContent()` - Validação de conteúdo
- `preventCSVInjection()` - Prevenção de CSV injection

### 🔒 **query-builder/secureQueryBuilder.ts**
- `SecureQueryBuilder` - Classe principal
- `QueryBuilderFactory` - Factory patterns
- `validateQueryId()` - Validação de IDs
- `validatePagination()` - Paginação segura
- Prevenção de SQL injection
- Validação de colunas e operadores
- Suporte a JOIN, ORDER BY, LIMIT

### 💡 **examples/usageExamples.ts**
- 10 exemplos práticos completos
- Implementação em Express
- Integração com middlewares
- Casos de uso reais
- Padrões de segurança

### 🧪 **__tests__/security.test.ts**
- Testes de sanitização
- Testes de validação
- Testes de query builder
- Cobertura completa
- Mocks de dependências

## 🎯 Casos de Uso Principais

### 1. **API REST com Segurança Completa**
```typescript
app.post('/api/users', 
  security.rateLimiters.api,
  sanitizeAll,
  validateUserData,
  createUser
);
```

### 2. **Upload de Arquivo Seguro**
```typescript
app.post('/api/upload',
  security.rateLimiters.upload,
  upload.single('file'),
  sanitizeFileFields(['filename']),
  processUpload
);
```

### 3. **Autenticação Protegida**
```typescript
app.post('/api/auth/login',
  security.rateLimiters.auth,
  sanitizeBody,
  validateCredentials,
  authenticate
);
```

### 4. **Busca com Rate Limiting**
```typescript
app.get('/api/search',
  security.rateLimiters.search,
  sanitizeQuery,
  performSearch
);
```

### 5. **Queries Seguras**
```typescript
const query = new SecureQueryBuilder()
  .select(['id', 'name'])
  .from('users')
  .where('status', '=', 'active')
  .limit(10)
  .build();
```

## 📊 Estatísticas

| Componente | Linhas | Funcionalidades |
|------------|--------|-----------------|
| **Sanitização** | 225 | 8 funções |
| **Validação** | 394 | 8 validadores |
| **Rate Limiting** | 368 | 5 limiters + utils |
| **Middleware** | 339 | 12 middlewares |
| **Query Builder** | 550 | Classe completa |
| **Exemplos** | 463 | 10 casos práticos |
| **Testes** | 540 | 50+ testes |
| **Documentação** | 3 arquivos | Completa |

**TOTAL: 3.630+ linhas de código TypeScript**

## 🔗 Navegação Rápida

- **📖 Documentação**: `README.md`
- **✅ Resumo**: `IMPLEMENTATION_SUMMARY.md`
- **📦 Dependências**: `DEPENDENCIES.md`
- **💡 Exemplos**: `examples/usageExamples.ts`
- **🧪 Testes**: `__tests__/security.test.ts`
- **⭐ Import**: `index.ts`

## 🎯 Próximos Passos

1. ✅ Instalar dependências (`npm install`)
2. ✅ Configurar Redis (opcional)
3. ✅ Aplicar middlewares na aplicação
4. ✅ Testar funcionalidades
5. ✅ Monitorar logs de segurança
6. ✅ Ajustar configurações conforme necessário

---

**Sistema de segurança completo e pronto para uso!** 🛡️
