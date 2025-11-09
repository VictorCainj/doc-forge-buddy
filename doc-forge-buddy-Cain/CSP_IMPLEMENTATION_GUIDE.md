# 🛡️ Content Security Policy (CSP) - Implementação Completa

## Visão Geral

Este documento descreve a implementação robusta de Content Security Policy (CSP) para proteção contra XSS e outros ataques de segurança no projeto Doc Forge Buddy.

## 🎯 Objetivos

- **Prevenção de XSS**: Bloquear scripts maliciosos e injeções de código
- **Controle de recursos**: Definir quais recursos podem ser carregados
- **Monitoramento**: Detectar e reportar violações de segurança
- **Conformidade**: Atender às melhores práticas de segurança web

## 📋 Implementações

### 1. Configuração CSP Principal

**Arquivo**: `src/lib/csp-config.ts`

- ✅ Geração de nonces dinâmicos
- ✅ Configurações para desenvolvimento e produção
- ✅ Validação de políticas CSP
- ✅ Extração de domínios permitidos
- ✅ Aplicação de nonces a elementos

```typescript
// Configuração para produção
const prodConfig = getProdCSPConfig(nonce);

// Gerar nonce único
const nonce = generateNonce();

// Validar configuração
const validation = validateCSP(cspString);
```

### 2. Middleware Express.js

**Arquivo**: `src/lib/csp-middleware.ts`

- ✅ Headers de segurança com Helmet
- ✅ CSP headers automáticos
- ✅ Sistema de relatórios de violação
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ Proteção contra clickjacking

```typescript
// Aplicar middleware
app.use(createCSPMiddleware({
  enabled: process.env.NODE_ENV === 'production',
  useNonce: true,
  reportUri: '/csp-report'
}));
```

### 3. Configuração Vite

**Arquivo**: `vite.config.ts`

- ✅ Meta tag CSP para desenvolvimento
- ✅ Headers CSP no servidor de desenvolvimento
- ✅ Plugins personalizados para CSP
- ✅ Headers de segurança para assets

```typescript
// Plugin CSP para desenvolvimento
const cspPlugin = () => ({
  name: 'csp-plugin',
  transformIndexHtml: {
    enforce: 'pre',
    transform: (html: string) => {
      // Adicionar meta tag CSP
    }
  }
});
```

### 4. Hook React

**Arquivo**: `src/hooks/useCSP.ts`

- ✅ Gerenciamento de nonces no frontend
- ✅ Monitoramento de violações em tempo real
- ✅ Coleta automática de relatórios
- ✅ Validação de configuração atual

```typescript
const { nonce, violations, startMonitoring } = useCSP();
```

### 5. Componente Monitor

**Arquivo**: `src/components/CSPMonitor.tsx`

- ✅ Interface de monitoramento em desenvolvimento
- ✅ Exibição de violações em tempo real
- ✅ Dashboard de configuração CSP
- ✅ Ferramentas de diagnóstico

```typescript
// Integração na aplicação
<CSPMonitor position="bottom-right" />
```

### 6. Servidor Express

**Arquivo**: `server.ts`

- ✅ Servidor de demonstração com CSP
- ✅ Endpoints de teste
- ✅ Sistema de relatórios
- ✅ Headers de segurança completos

```typescript
// Headers de segurança
app.use(helmet({
  contentSecurityPolicy: { /* configuração */ },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' }
}));
```

### 7. Validador Automatizado

**Arquivo**: `scripts/csp-validator.ts`

- ✅ Testes automatizados com Playwright
- ✅ Validação de configuração
- ✅ Relatórios detalhados
- ✅ Integração com CI/CD

```bash
# Executar validação
npm run csp:validate
```

## 🔧 Configurações por Ambiente

### Desenvolvimento
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
">
```

### Produção
```javascript
// Headers HTTP (mais restritivo)
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'nonce-{nonce}';
  style-src 'self' 'nonce-{nonce}';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

## 🧪 Testes e Validação

### Testes Manuais
1. **Portal de Teste**: `http://localhost:3000`
2. **Testes de Violação**: `http://localhost:3000/test-csp`
3. **Headers de Segurança**: `http://localhost:3000/security-headers`

### Testes Automatizados
```bash
# Executar validação completa
npm run csp:validate

# Testar ambiente específico
npm run csp:validate -- http://production-domain.com
```

### Monitoramento
- **Componente Visual**: CSPMonitor em desenvolvimento
- **Logs do Servidor**: Violações em tempo real
- **Relatórios**: Arquivo `csp-validation-report.json`

## 📊 Diretivas CSP

| Diretiva | Desenvolvimento | Produção | Descrição |
|----------|----------------|----------|-----------|
| `default-src` | `'self'` | `'self'` | Fallback para todos os recursos |
| `script-src` | `'self' 'unsafe-inline'` | `'self' 'nonce-{nonce}'` | Fontes permitidas para scripts |
| `style-src` | `'self' 'unsafe-inline'` | `'self' 'nonce-{nonce}'` | Fontes permitidas para estilos |
| `img-src` | `'self' data: https:` | `'self' data: https:` | Fontes permitidas para imagens |
| `connect-src` | `'self' *.supabase.co` | `'self' *.supabase.co` | Endpoints para conexões |
| `frame-src` | `'none'` | `'none'` | Bloqueia iframes |
| `object-src` | `'none'` | `'none'` | Bloqueia objetos Flash/PDF |
| `base-uri` | `'self'` | `'self'` | URI base para URLs relativas |
| `form-action` | `'self'` | `'self'` | Endpoints para formulários |

## ⚠️ Avisos de Segurança

### Críticos
- ❌ **NUNCA** use `'unsafe-inline'` em produção
- ❌ **NUNCA** use `'unsafe-eval'` sem necessidade
- ❌ **SEMPRE** use nonces ou hashes

### Recomendações
- ✅ Use nonces para scripts/stylos inline necessários
- ✅ Configure `report-uri` para monitoramento
- ✅ Implemente `upgrade-insecure-requests`
- ✅ Monitore violações regularmente

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Scripts não funcionam
```javascript
// Adicionar nonce ao script
const script = document.createElement('script');
script.setAttribute('nonce', nonce);
script.textContent = '/* seu código */';
document.head.appendChild(script);
```

#### 2. Estilos não carregam
```css
/* Aplicar nonce no CSS */
style[nonce="{nonce}"] {
  /* seus estilos */
}
```

#### 3. Imagens bloqueadas
```html
<!-- Permitir data: URIs para imagens -->
<img src="data:image/svg+xml,..." alt="SVG" />
```

#### 4. Conectividade Supabase
```javascript
// Verificar connect-src
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

### Debugging

1. **Console do Navegador**: Violações aparecem em vermelho
2. **CSPMonitor**: Interface visual em desenvolvimento
3. **Network Tab**: Verificar recursos bloqueados
4. **Security Report**: Endpoint `/csp-report`

## 📈 Métricas e Monitoramento

### KPIs de Segurança
- **Violações por dia**: Meta < 5
- **Scripts inline bloqueados**: Meta 100%
- **Coverage CSP**: Meta > 90%
- **Tempo de resposta**: Meta < 100ms

### Relatórios
- **Tempo real**: CSPMonitor component
- **Diários**: Logs do servidor
- **Semanais**: Arquivo csp-report.json
- **Mensais**: Dashboard de segurança

## 🚀 Próximos Passos

### Melhorias Futuras
1. **Hash-based CSP**: Usar SHA-256 para scripts
2. **Dynamic CSP**: Atualização automática
3. **AI-powered Detection**: Detecção inteligente
4. **Integration Sentry**: Monitoramento com Sentry

### Compliance
1. **OWASP Guidelines**: Conformidade com OWASP
2. **W3C Standard**: Implementação padrão W3C
3. **Browser Support**: Compatibilidade cross-browser
4. **Performance Impact**: Otimização contínua

## 📚 Referências

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP XSS Prevention](https://owasp.org/www-community/attacks/xss/)
- [W3C Content Security Policy](https://www.w3.org/TR/CSP/)
- [CSP Report-Only Mode](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only)

---

**Implementação concluída em**: $(date)
**Versão**: 1.0.0
**Status**: ✅ Produzão Ready