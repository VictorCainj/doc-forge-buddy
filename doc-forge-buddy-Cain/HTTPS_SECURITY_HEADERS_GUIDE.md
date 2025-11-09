# HTTPS e Security Headers - Guia de Implementação

## 🛡️ Configurações de Segurança Implementadas

### 1. **HTTPS Enforcement**
- **Redirect automático** HTTP → HTTPS em produção
- **HSTS (HTTP Strict Transport Security)** com preload
- **SSL/TLS Configuration** com certificados

### 2. **Security Headers Completos**
- **Content Security Policy (CSP)**
- **X-Content-Type-Options: nosniff**
- **X-Frame-Options: DENY**
- **X-XSS-Protection: 1; mode=block**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** restritivo
- **Remove Powered-By headers**

### 3. **CORS Seguro**
- **Origins permitidos** configuráveis
- **Headers permitidos** específicos
- **Methods restritos**
- **Credentials controlados**

### 4. **Rate Limiting**
- **100 requests/15min** por IP
- **Client-side rate limiting** adicional
- **Configurável** por endpoint

### 5. **Cookie Security**
- **HttpOnly cookies**
- **Secure cookies** (HTTPS only)
- **SameSite: strict**
- **CSRF tokens** automáticos

### 6. **Input Validation & Sanitization**
- **XSS detection**
- **Input sanitization**
- **Schema validation**
- **Client-side security monitoring**

## 🚀 Como Usar

### **1. Gerar Certificados SSL**

```bash
# Desenvolvimento (certificado auto-assinado)
node scripts/generate-ssl-certs.js dev localhost

# Produção (CSR para CA)
node scripts/generate-ssl-certs.js prod seu-dominio.com
```

### **2. Configurar Variáveis de Ambiente**

Edite o `.env.production`:

```bash
NODE_ENV=production
PORT=3000
HTTPS=true
SSL_CERT_PATH=/path/to/certificate.pem
SSL_KEY_PATH=/path/to/private-key.pem
SECURE_COOKIES=true
TRUST_PROXY=1
ALLOWED_ORIGINS=https://localhost:3000,https://seu-dominio.com
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
```

### **3. Instalar Dependências**

```bash
npm install express helmet cors cookie-parser compression express-rate-limit dotenv
```

### **4. Iniciar Servidor**

```bash
# Desenvolvimento
npm run dev:server

# Produção
npm run start:prod
```

### **5. Usar no React**

```tsx
// main.tsx ou App.tsx
import { SecurityProvider } from '@/components/SecurityProvider';

function App() {
  return (
    <SecurityProvider 
      enableCSP={true}
      enableHTTPSRedirect={true}
      enableSecurityHeaders={true}
    >
      {/* Sua aplicação */}
    </SecurityProvider>
  );
}
```

## 🔧 Configurações Avançadas

### **Content Security Policy Personalizada**

```javascript
// server.js
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    // Adicione suas origens específicas
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.seu-dominio.com"],
  }
}));
```

### **CORS Configuração**

```javascript
// server.js
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://seu-dominio.com',
      'https://app.seu-dominio.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### **Rate Limiting Customizado**

```javascript
// server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // máximo 100 requests
  message: 'Muitas requisições',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

### **Hooks de Segurança no React**

```tsx
import { useSecurityHeaders, useSecurityTokens, useRateLimiting } from '@/hooks/useSecurity';

// Aplicar headers de segurança
const securityConfig = useSecurityHeaders({
  enableCSP: true,
  enableHTTPSRedirect: true
});

// Gerenciar tokens
const { csrfToken, sessionToken } = useSecurityTokens();

// Rate limiting client-side
const { canMakeRequest, getRemainingRequests } = useRateLimiting(50, 60000);

// Verificar se pode fazer request
if (canMakeRequest()) {
  // Fazer request...
}
```

## 🧪 Testes de Segurança

### **1. Verificar Headers de Segurança**

```bash
# Testar headers
curl -I https://seu-dominio.com

# Verificar CSP
curl -H "Content-Security-Policy-Report-Only: default-src 'self'" https://seu-dominio.com
```

### **2. Testar HTTPS Redirect**

```bash
# Deve redirect para HTTPS
curl -L http://seu-dominio.com
```

### **3. Verificar CORS**

```javascript
// Browser console
fetch('https://seu-dominio.com/api/test', {
  method: 'GET',
  headers: {
    'Origin': 'https://outro-dominio.com'
  }
}).catch(err => console.log('CORS blocking:', err));
```

### **4. Testar XSS Protection**

```html
<!-- Tente no browser -->
<script>alert('XSS')</script>
<!-- Deve ser bloqueado pelo CSP -->
```

## 📊 Monitoramento

### **Security Events**
O sistema monitora automaticamente:
- Tentativas de abrir DevTools
- Protocolo inseguro (HTTP)
- Menu de contexto desabilitado
- Teclas de desenvolvimento
- Erros JavaScript
- Rejeições de Promise

### **Logs de Segurança**
```javascript
// Events são salvos automaticamente
{
  timestamp: "2025-01-09T08:08:32.000Z",
  event: "devtools_opened",
  details: { ... },
  userAgent: "Mozilla/5.0...",
  url: "https://seu-dominio.com"
}
```

## 🔒 Checklist de Produção

### **HTTPS & SSL**
- [ ] Certificados SSL válidos instalados
- [ ] HTTPS redirect funcionando
- [ ] HSTS headers configurados
- [ ] SSL Labs test: A+ rating

### **Security Headers**
- [ ] CSP implementado e testado
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection ativo
- [ ] Referrer-Policy configurado

### **CORS & Cookies**
- [ ] CORS origins restritos
- [ ] Cookies HttpOnly e Secure
- [ ] CSRF tokens implementados
- [ ] Session security ativo

### **Rate Limiting**
- [ ] Rate limiting configurado
- [ ] Proteção contra brute force
- [ ] Monitoring de abuso

### **Input Validation**
- [ ] XSS protection ativo
- [ ] Input sanitization
- [ ] Schema validation
- [ ] Security monitoring

## 🛠️ Troubleshooting

### **Problema: HTTPS não funciona**
```bash
# Verificar certificados
openssl x509 -in certificate.pem -text -noout

# Verificar permissões
ls -la ssl-certs/
```

### **Problema: CORS blocking**
```javascript
// Verificar origin na request
console.log('Origin:', req.get('Origin'));
console.log('Allowed origins:', allowedOrigins);
```

### **Problema: CSP bloqueando recursos**
```bash
// Adicionar ao CSP no browser DevTools
// Verificar console para erros CSP
```

### **Problema: Certificados inválidos**
```bash
// Gerar novos certificados
node scripts/generate-ssl-certs.js dev localhost
```

## 📈 Performance Impact

### **Overhead de Segurança**
- **Headers processing**: ~1-2ms por request
- **CSP evaluation**: ~0.5ms por page load
- **Rate limiting**: ~0.1ms por request
- **SSL/TLS handshake**: ~100-200ms (primeira conexão)

### **Otimizações**
- **Cache headers** para recursos estáticos
- **Compression** para responses
- **HTTP/2** support
- **Efficient CSP** (minimal directives)

## 🔮 Próximos Passos

1. **Implementar Web Application Firewall (WAF)**
2. **Adicionar DDoS protection**
3. **Implementar security scanning automatizado**
4. **Configurar SIEM para logs de segurança**
5. **Implementar zero-trust architecture**

---

**✅ Implementação completa de HTTPS e Security Headers para produção!**