/**
 * Service Worker Cache Inteligente - Doc Forge Buddy
 * Implementa estratégias de cache otimizadas para performance e offline-first
 */

// =============================================================================
// CONFIGURAÇÕES GERAIS
// =============================================================================

const CACHE_VERSION = 'v2.1.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const FONTS_CACHE = `fonts-${CACHE_VERSION}`;
const DOCS_CACHE = `documents-${CACHE_VERSION}`;
const PENDING_REQUESTS = 'pending-requests';

// URLs críticas para precache
const CRITICAL_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/contratos',
  '/favicon.ico',
  '/manifest.json'
];

// Configurações de timeout por tipo de recurso
const TIMEOUT_CONFIG = {
  api: 5000,      // 5 segundos para APIs
  documents: 8000, // 8 segundos para documentos
  images: 3000,   // 3 segundos para imagens
  pages: 4000,    // 4 segundos para páginas
};

// =============================================================================
// INSTALAÇÃO E ATIVAÇÃO
// =============================================================================

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Precache assets críticos
      cacheCriticalAssets(),
      // Limpeza de caches antigos
      cleanupOldCaches(),
    ]).then(() => {
      console.log(`[SW] Installation complete - version ${CACHE_VERSION}`);
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Limpa caches obsoletos
      cleanupOldCaches(),
      // Claim de todos os clientes
      self.clients.claim(),
      // Inicializa análise de cache
      analyzeCacheUsage(),
    ]).then(() => {
      console.log(`[SW] Activation complete - version ${CACHE_VERSION}`);
    })
  );
});

// =============================================================================
// ESTRATÉGIAS DE CACHE
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip para requests não-GET
  if (request.method !== 'GET') return;
  
  // Skip para requests de extensões do browser
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(
    handleRequest(request, url)
  );
});

async function handleRequest(request, url) {
  try {
    // 1. NETWORK FIRST - APIs e dados dinâmicos
    if (isApiRequest(url)) {
      return await networkFirst(request, API_CACHE, TIMEOUT_CONFIG.api);
    }
    
    // 2. CACHE FIRST - Assets estáticos
    if (isStaticAsset(url)) {
      return await cacheFirst(request, getCacheNameForAsset(url));
    }
    
    // 3. STALE WHILE REVALIDATE - Assets de aplicação
    if (isAppAsset(request)) {
      return await staleWhileRevalidate(request, STATIC_CACHE);
    }
    
    // 4. NETWORK FIRST - Páginas e navegação
    if (request.mode === 'navigate') {
      return await networkFirst(request, DYNAMIC_CACHE, TIMEOUT_CONFIG.pages);
    }
    
    // 5. FALLBACK - Tenta cache para outros recursos
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 6. NETWORK FALLBACK - Busca na rede como último recurso
    return await fetch(request);
    
  } catch (error) {
    console.error(`[SW] Request failed: ${request.url}`, error);
    return await getOfflineFallback(request);
  }
}

// =============================================================================
// IMPLEMENTAÇÃO DAS ESTRATÉGIAS DE CACHE
// =============================================================================

// Network First: Busca na rede primeiro, fallback para cache
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    // Cria um timeout para a requisição de rede
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Cache da resposta se for bem-sucedida
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      applyCacheExpiration(cacheName, request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log(`[SW] Network failed for ${request.url}, trying cache`);
    
    // Fallback para cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First: Usa cache primeiro, sem atualização em background
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Atualiza em background se não expirado
    updateInBackground(request, cache, cacheName);
    return cachedResponse;
  }
  
  // Busca na rede se não há cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Stale While Revalidate: Serve do cache imediatamente e atualiza em background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Busca na rede em background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Retorna cache se disponível, senão espera rede
  return cachedResponse || await networkPromise;
}

// =============================================================================
// FUNÇÕES DE CLASSIFICAÇÃO
// =============================================================================

function isApiRequest(url) {
  return (
    url.origin.includes('supabase.co') ||
    url.origin.includes('api.openai.com') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/') ||
    url.pathname.includes('/api/')
  );
}

function isStaticAsset(url) {
  return (
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname) || // Imagens
    /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname) || // Fontes
    /\.(pdf|doc|docx|xls|xlsx)$/i.test(url.pathname) // Documentos
  );
}

function isAppAsset(request) {
  return (
    request.destination === 'script' ||
    request.destination === 'style'
  );
}

function getCacheNameForAsset(url) {
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)) {
    return IMAGES_CACHE;
  }
  if (/\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
    return FONTS_CACHE;
  }
  if (/\.(pdf|doc|docx|xls|xlsx)$/i.test(url.pathname)) {
    return DOCS_CACHE;
  }
  return STATIC_CACHE;
}

// =============================================================================
// GERENCIAMENTO DE CACHE
// =============================================================================

// Cache de assets críticos
async function cacheCriticalAssets() {
  const cache = await caches.open(STATIC_CACHE);
  const urlsToCache = CRITICAL_ASSETS.filter(url => 
    !url.includes('.js') && !url.includes('.css')
  );
  
  return Promise.all(
    urlsToCache.map(url => 
      cache.add(url).catch(err => 
        console.log(`[SW] Failed to cache critical asset: ${url}`, err)
      )
    )
  );
}

// Limpeza de caches obsoletos
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCacheNames = [
    STATIC_CACHE, DYNAMIC_CACHE, IMAGES_CACHE, 
    API_CACHE, FONTS_CACHE, DOCS_CACHE, PENDING_REQUESTS
  ];
  
  return Promise.all(
    cacheNames
      .filter(name => !validCacheNames.includes(name))
      .map(name => {
        console.log(`[SW] Deleting old cache: ${name}`);
        return caches.delete(name);
      })
  );
}

// Análise de uso de cache
async function analyzeCacheUsage() {
  try {
    const cacheNames = await caches.keys();
    const usage = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      usage[cacheName] = requests.length;
    }
    
    console.log('[SW] Cache usage:', usage);
  } catch (error) {
    console.log('[SW] Cache analysis failed:', error);
  }
}

// Atualização em background
async function updateInBackground(request, cache, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - atualização em background não deve quebrar UX
  }
}

// Aplicação de expiração de cache
function applyCacheExpiration(cacheName, url) {
  // Implementar lógica de expiração específica se necessário
}

// =============================================================================
// CACHE INVALIDATION
// =============================================================================

// Sistema de invalidação automática baseado em tempo
const CACHE_EXPIRATION_RULES = {
  [API_CACHE]: 10 * 60 * 1000, // 10 minutos
  [DYNAMIC_CACHE]: 60 * 60 * 1000, // 1 hora
  [STATIC_CACHE]: 24 * 60 * 60 * 1000, // 24 horas
  [IMAGES_CACHE]: 7 * 24 * 60 * 60 * 1000, // 7 dias
  [FONTS_CACHE]: 30 * 24 * 60 * 60 * 1000, // 30 dias
  [DOCS_CACHE]: 24 * 60 * 60 * 1000, // 1 dia
};

// Invalidação automática baseada em padrão
const PATTERN_EXPIRATION = {
  '/api/': 5 * 60 * 1000, // 5 minutos
  '/contratos': 2 * 60 * 1000, // 2 minutos
  '/dashboard': 30 * 1000, // 30 segundos
};

// =============================================================================
// OFFLINE FALLBACKS
// =============================================================================

async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Fallback para navegação
  if (request.mode === 'navigate') {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedHome = await cache.match('/');
    if (cachedHome) {
      return cachedHome;
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Doc Forge Buddy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #f8fafc;
              color: #334155;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 400px;
            }
            .icon {
              width: 64px; 
              height: 64px; 
              margin: 0 auto 1rem;
              opacity: 0.5;
            }
            h1 { font-size: 1.5rem; margin-bottom: 1rem; }
            p { margin-bottom: 2rem; line-height: 1.6; }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-size: 1rem;
              cursor: pointer;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>Você está offline</h1>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button onclick="window.location.reload()">
              Tentar novamente
            </button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  // Fallback para imagens
  if (request.destination === 'image') {
    return new Response('', { status: 200 });
  }
  
  // Fallback para APIs
  if (url.pathname.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Esta funcionalidade não está disponível offline',
      timestamp: Date.now(),
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Fallback genérico
  return new Response('Recurso não disponível offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// =============================================================================
// MESSAGING E COMUNICAÇÃO
// =============================================================================

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      const status = await getCacheStatus();
      event.ports[0].postMessage({ type: 'CACHE_STATUS', data: status });
      break;
      
    case 'CLEAR_CACHE':
      const success = await clearAllCaches();
      event.ports[0].postMessage({ type: 'CACHE_CLEARED', success });
      break;
      
    case 'INVALIDATE_CACHE':
      if (payload?.pattern) {
        await invalidateCachePattern(payload.pattern);
        event.ports[0].postMessage({ 
          type: 'CACHE_INVALIDATED', 
          pattern: payload.pattern 
        });
      }
      break;
      
    case 'PRECACHE_URL':
      if (payload?.url) {
        await precacheUrl(payload.url);
        event.ports[0].postMessage({ 
          type: 'URL_PRECACHED', 
          url: payload.url 
        });
      }
      break;
  }
});

// Obter status dos caches
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      status[cacheName] = {
        count: requests.length,
        lastUpdate: Date.now(),
      };
    }
    
    return status;
  } catch (error) {
    return {};
  }
}

// Limpar todos os caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch (error) {
    return false;
  }
}

// Invalidar cache por padrão
async function invalidateCachePattern(pattern) {
  try {
    const cacheNames = await caches.keys();
    const regex = new RegExp(pattern);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        if (regex.test(request.url)) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache invalidation failed:', error);
  }
}

// Precache de URL
async function precacheUrl(url) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.add(url);
    return true;
  } catch (error) {
    console.error('[SW] Precache failed:', error);
    return false;
  }
}

// =============================================================================
// BACKGROUND SYNC
// =============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Implementar sincronização de dados pendentes
    console.log('[SW] Background sync triggered');
    
    // Exemplo: sincronizar mudanças de contratos
    const pendingRequests = await getPendingRequests();
    for (const request of pendingRequests) {
      try {
        await fetch(request);
        await removePendingRequest(request);
      } catch (error) {
        console.log('[SW] Sync failed for request:', request.url);
      }
    }
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function getPendingRequests() {
  const cache = await caches.open(PENDING_REQUESTS);
  return await cache.keys();
}

async function removePendingRequest(request) {
  const cache = await caches.open(PENDING_REQUESTS);
  await cache.delete(request);
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
        url: data.url || '/',
      },
      actions: [
        {
          action: 'view',
          title: 'Ver detalhes',
          icon: '/icon-72x72.png',
        },
        {
          action: 'dismiss',
          title: 'Ignorar',
          icon: '/icon-72x72.png',
        },
      ],
      requireInteraction: data.priority === 'high',
      silent: data.silent || false,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    // Fallback para notification simples
    event.waitUntil(
      self.registration.showNotification('Doc Forge Buddy', {
        body: 'Nova notificação disponível',
        icon: '/icon-192x192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action } = event;
  const { url, primaryKey } = event.notification.data || {};
  
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      
      if (action === 'view' || !action) {
        for (const client of allClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (url) {
              client.postMessage({
                type: 'NAVIGATE',
                url: url,
                data: { primaryKey },
              });
            }
            return;
          }
        }
        
        await self.clients.openWindow(url || '/');
      }
    })()
  );
});

console.log(`[SW] Cache Inteligente v${CACHE_VERSION} loaded`);