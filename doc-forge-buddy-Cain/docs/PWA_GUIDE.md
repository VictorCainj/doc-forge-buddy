# Guia Completo de PWA - Doc Forge Buddy

## 📱 Visão Geral

O Doc Forge Buddy é um Progressive Web App (PWA) completo que oferece experiência nativa em dispositivos móveis e desktop, com suporte offline e instalação direta.

## 🚀 Recursos Implementados

### 1. Manifesto do Aplicativo (`manifest.json`)

O manifesto define todas as propriedades do PWA:

```json
{
  "name": "Doc Forge Buddy",
  "short_name": "DocForge",
  "description": "Sistema de gerenciamento de contratos e documentos imobiliários com IA",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait-primary"
}
```

**Recursos:**
- Nome completo e abreviado
- Ícones em múltiplos tamanhos (72x72 até 512x512)
- Cor de tema personalizada
- Atalhos para funcionalidades principais
- Suporte a tela inicial personalizada

### 2. Service Worker com Workbox

Implementação automática via `vite-plugin-pwa` com estratégias de cache otimizadas:

#### Estratégias de Cache

**Network First** (API Supabase):
```javascript
{
  handler: 'NetworkFirst',
  cacheName: 'supabase-api-cache',
  expiration: {
    maxEntries: 200,
    maxAgeSeconds: 600 // 10 minutos
  }
}
```

**Cache First** (Imagens):
```javascript
{
  handler: 'CacheFirst',
  cacheName: 'images-cache',
  expiration: {
    maxEntries: 100,
    maxAgeSeconds: 5184000 // 60 dias
  }
}
```

**Cache First** (Fontes):
```javascript
{
  handler: 'CacheFirst',
  cacheName: 'fonts-cache',
  expiration: {
    maxEntries: 30,
    maxAgeSeconds: 31536000 // 1 ano
  }
}
```

### 3. Funcionalidades Offline

O PWA funciona offline com:
- Cache de recursos estáticos (HTML, CSS, JS)
- Cache de imagens e fontes
- Cache de dados da API (quando online)
- Sincronização em background (quando conexão restaurada)

### 4. Página de Instalação

Página dedicada em `/instalar-pwa` com:
- Status do PWA (instalado/não instalado)
- Botão de instalação (quando disponível)
- Instruções passo a passo por plataforma
- Lista de benefícios e recursos
- FAQ completo
- Status de conectividade
- Informações de cache

### 5. Utilitários PWA (`pwaHelpers.ts`)

Funções auxiliares para gerenciamento do PWA:

```typescript
// Registrar Service Worker
await registerServiceWorker();

// Verificar se está rodando como PWA
const isPWA = isRunningAsPWA();

// Solicitar instalação
const installed = await promptPWAInstall();

// Verificar conectividade
const online = isOnline();

// Limpar cache
await clearServiceWorkerCache();

// Notificações push
await requestNotificationPermission();
await showLocalNotification('Título', options);
```

## 📦 Instalação do PWA

### Android (Chrome/Edge)

1. Abra o site no navegador
2. Toque no menu (⋮) no canto superior direito
3. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

### iOS (Safari)

1. Abra o site no Safari
2. Toque no ícone de compartilhar (⬆️) na parte inferior
3. Role para baixo e selecione "Adicionar à Tela de Início"
4. Nomeie o app e toque em "Adicionar"
5. O ícone aparecerá na tela inicial

### Desktop (Chrome/Edge/Firefox)

1. Abra o site no navegador
2. Clique no ícone de instalação (⊕) na barra de endereço
3. Ou acesse Menu → Instalar Doc Forge Buddy
4. Confirme a instalação
5. O app abrirá em uma janela dedicada

## 🔧 Configuração Técnica

### Vite Plugin PWA

Configuração no `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'placeholder.svg'],
  manifest: { /* configuração do manifesto */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [ /* estratégias de cache */ ],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true
  },
  devOptions: {
    enabled: false // Desabilitar em desenvolvimento
  }
})
```

### Meta Tags HTML

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1e40af" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="DocForge" />
```

### Inicialização do Service Worker

Em `main.tsx`:

```typescript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    await registerServiceWorker();
    setupPWAInstallPrompt(() => {
      // App pronto para instalação
    });
    onConnectivityChange(
      () => { /* online */ },
      () => { /* offline */ }
    );
  });
}
```

## 🎨 Ícones PWA

Os ícones devem estar em `/public/` nos seguintes tamanhos:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Formato: PNG com fundo transparente ou sólido
Tipo: `any maskable` (compatível com máscaras adaptativas Android)

## 📊 Performance

### Lighthouse Scores (Alvos)

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 95+
- **PWA:** 100

### Otimizações Implementadas

1. **Bundle Splitting:** Chunks separados por funcionalidade
2. **Lazy Loading:** Carregamento sob demanda de rotas
3. **Image Optimization:** Cache agressivo de imagens
4. **Code Splitting:** Separação de vendors e código da aplicação
5. **Tree Shaking:** Remoção de código não utilizado
6. **Minification:** Compressão de assets com Terser

## 🔒 Segurança

### HTTPS Obrigatório

PWAs requerem conexão HTTPS:
- Desenvolvimento: `localhost` (não precisa HTTPS)
- Produção: Certificado SSL válido necessário

### Content Security Policy

Headers de segurança configurados:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 🧪 Testes

### Testar Service Worker

```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers registrados:', registrations);
});
```

### Testar Cache

```javascript
// No console do navegador
caches.keys().then(keys => {
  console.log('Caches disponíveis:', keys);
});
```

### Testar Offline

1. Abra DevTools (F12)
2. Vá para "Network"
3. Ative "Offline"
4. Recarregue a página
5. A página deve carregar do cache

### Lighthouse Audit

```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Executar auditoria
lighthouse https://seu-site.com --view
```

## 📱 Compatibilidade

### Navegadores Suportados

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 15+
- ✅ Firefox 90+
- ✅ Samsung Internet 14+

### Sistemas Operacionais

- ✅ Android 8+
- ✅ iOS 15+
- ✅ Windows 10+
- ✅ macOS 10.15+
- ✅ Linux (todas versões recentes)

## 🐛 Troubleshooting

### Service Worker não registra

1. Verificar se está em HTTPS
2. Verificar console para erros
3. Limpar cache e recarregar
4. Verificar se `import.meta.env.PROD` é true

### App não oferece instalação

1. Verificar se já está instalado
2. Verificar se manifest.json está acessível
3. Verificar se Service Worker está ativo
4. Verificar critérios de instalação do navegador

### Cache não funciona

1. Verificar estratégias de cache no Workbox
2. Verificar se Service Worker está ativo
3. Limpar caches antigos
4. Verificar Network tab no DevTools

### Atualizações não aparecem

1. Service Worker usa `skipWaiting` e `clientsClaim`
2. Forçar atualização: Desregistrar SW e recarregar
3. Verificar se há erro na atualização do SW

## 📈 Monitoramento

### Métricas a Acompanhar

1. **Taxa de Instalação:** Quantos usuários instalam o PWA
2. **Tempo de Cache Hit:** Velocidade ao servir do cache
3. **Taxa de Offline:** Uso em modo offline
4. **Tamanho do Cache:** Espaço ocupado localmente
5. **Erros do SW:** Falhas no Service Worker

### Analytics

Rastrear eventos importantes:
- `pwa_installed`: Usuário instalou o app
- `pwa_opened`: App aberto como PWA instalado
- `offline_access`: Acesso em modo offline
- `cache_served`: Recursos servidos do cache

## 🚀 Deploy

### Checklist de Deploy

- [ ] Ícones PWA em todos os tamanhos
- [ ] Manifest.json configurado
- [ ] HTTPS habilitado
- [ ] Service Worker registrado
- [ ] Meta tags PWA no HTML
- [ ] Testes em dispositivos reais
- [ ] Lighthouse audit passou (PWA: 100)
- [ ] Cache strategies testadas
- [ ] Modo offline funcional

### Comandos

```bash
# Build de produção
npm run build

# Preview local
npm run preview

# Deploy (Vercel/Netlify)
vercel deploy --prod
# ou
netlify deploy --prod
```

## 📚 Recursos Adicionais

- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Vite Plugin PWA](https://vite-pwa-org.netlify.app/)

## 🎯 Próximos Passos

1. **Push Notifications:** Implementar notificações push
2. **Background Sync:** Sincronização em background
3. **Periodic Background Sync:** Atualizações periódicas
4. **App Shortcuts:** Atalhos dinâmicos
5. **Share Target:** Receber compartilhamentos de outros apps
6. **Web Share:** Compartilhar do app para outros apps

## ✅ Benefícios do PWA

### Para Usuários

- ✅ Instalação sem app store
- ✅ Acesso rápido pela tela inicial
- ✅ Funciona offline
- ✅ Atualizações automáticas
- ✅ Menor uso de dados
- ✅ Ocupa menos espaço
- ✅ Experiência app-like

### Para o Negócio

- ✅ Maior engajamento
- ✅ Taxas de conversão maiores
- ✅ Redução de custos (sem app store)
- ✅ Melhor SEO
- ✅ Cross-platform por padrão
- ✅ Deploy instantâneo
- ✅ Analytics integrados

---

**Última atualização:** Janeiro 2025  
**Versão do PWA:** 1.0.0  
**Status:** ✅ Produção
