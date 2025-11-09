/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
} from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Versão do cache para invalidação automática
const CACHE_VERSION = 'v2.1.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const FONTS_CACHE = `fonts-${CACHE_VERSION}`;
const DOCS_CACHE = `documents-${CACHE_VERSION}`;
const ANALYTICS_CACHE = `analytics-${CACHE_VERSION}`;

// URLs críticas para precache (ativos essenciais)
const CRITICAL_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/contratos',
  '/favicon.ico',
  '/manifest.json'
];

// Precache dos assets gerados pelo build
precacheAndRoute(self.__WB_MANIFEST);

// Configuração de tratamento de navegação SPA
const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(self.location.origin + '/index.html')
);

// =============================================================================
// ESTRATÉGIAS DE CACHE INTELIGENTE
// =============================================================================

// 1. NETWORK FIRST - APIs e dados dinâmicos
// Busca na rede primeiro, fallback para cache
registerRoute(
  ({ url }) => 
    url.origin.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/storage/v1/'),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 5, // Timeout para fallback
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 10 * 60, // 10 minutos
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Network First para OpenAI API
registerRoute(
  ({ url }) => url.origin.includes('api.openai.com'),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 2. CACHE FIRST - Assets estáticos e mídia
// Usa cache primeiro, sem atualização em background
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGES_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 120, // Mais espaço para imagens
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache First para fontes (WOFF2, TTF, OTF)
registerRoute(
  ({ url }) => 
    request.destination === 'font' ||
    url.pathname.match(/\.(woff2?|ttf|otf)$/i),
  new CacheFirst({
    cacheName: FONTS_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache First para documentos e PDFs
registerRoute(
  ({ url }) => 
    url.pathname.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ||
    url.pathname.includes('/documentos/') ||
    url.pathname.includes('/templates/'),
  new CacheFirst({
    cacheName: DOCS_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 3. STALE WHILE REVALIDATE - Assets de aplicação
// Serve do cache imediatamente e atualiza em background
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: STATIC_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 14, // 14 dias
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 4. STRATÉGIAS ESPECÍFICAS POR CONTEXTO
// Documentos públicos com Network First
registerRoute(
  ({ url }) => 
    url.pathname.includes('/documento-publico/') ||
    url.pathname.includes('/api/public/'),
  new NetworkFirst({
    cacheName: DYNAMIC_CACHE,
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60, // 1 hora
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Páginas da aplicação com Network First
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(/\/[^/?]+\.[^/]+$/)) return false;
    if (url.pathname.includes('/api/')) return false;
    return true;
  },
  new NetworkFirst({
    cacheName: DYNAMIC_CACHE,
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 12, // 12 horas
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Analytics com Network Only (não cachear)
registerRoute(
  ({ url }) => 
    url.pathname.includes('/analytics') ||
    url.pathname.includes('/track'),
  new NetworkOnly({
    cacheName: ANALYTICS_CACHE,
  })
);

// =============================================================================
// PRECACHE PARA ASSETS CRÍTICOS
// =============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Precache assets críticos
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_ASSETS.filter(url => 
          !url.includes('.js') && !url.includes('.css')
        ));
      }),
      // Limpeza de caches antigos
      cleanupOldCaches(),
    ]).then(() => self.skipWaiting())
  );
});

// =============================================================================
// ATIVAÇÃO E LIMPEZA DE CACHES
// =============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpa caches obsoletos
      cleanupOldCaches(),
      // Claim de todos os clientes
      self.clients.claim(),
      // Inicializa análise de cache
      analyzeCacheUsage(),
    ])
  );
});

// Função para limpeza de caches antigos
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCacheNames = [
    STATIC_CACHE, DYNAMIC_CACHE, IMAGES_CACHE, 
    API_CACHE, FONTS_CACHE, DOCS_CACHE, ANALYTICS_CACHE
  ];
  
  return Promise.all(
    cacheNames
      .filter(name => !validCacheNames.includes(name))
      .map(name => caches.delete(name))
  );
}

// Função para analisar uso de cache
async function analyzeCacheUsage() {
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SW] Cache ${cacheName}: ${requests.length} entries`);
    }
  }
}

// =============================================================================
// CACHE INVALIDATION INTELIGENTE
// =============================================================================

// Invalidação baseada em versão de cache
const CACHE_INVALIDATION_PATTERNS = {
  '/api/': { maxAge: 5 * 60 }, // 5 minutos
  '/contratos': { maxAge: 2 * 60 }, // 2 minutos
  '/dashboard': { maxAge: 30 }, // 30 segundos
  '/documentos': { maxAge: 60 * 10 }, // 10 minutos
};

// Sistema de invalidação automática
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      const cacheStatus = await getCacheStatus();
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        data: cacheStatus,
      });
      break;
      
    case 'INVALIDATE_CACHE':
      if (payload?.pattern) {
        await invalidateCachePattern(payload.pattern);
        event.ports[0].postMessage({
          type: 'CACHE_INVALIDATED',
          pattern: payload.pattern,
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      const cleared = await clearAllCaches();
      event.ports[0].postMessage({
        type: 'CACHE_CLEARED',
        success: cleared,
      });
      break;
      
    case 'PRECACHE_URL':
      if (payload?.url) {
        await precacheUrl(payload.url);
        event.ports[0].postMessage({
          type: 'URL_PRECACHED',
          url: payload.url,
        });
      }
      break;
  }
});

// Função para obter status do cache
async function getCacheStatus() {
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
}

// Função para invalidar cache por padrão
async function invalidateCachePattern(pattern) {
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
}

// Função para limpar todos os caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch (error) {
    return false;
  }
}

// Função para precache de URL
async function precacheUrl(url) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.add(url);
    return true;
  } catch (error) {
    return false;
  }
}

// =============================================================================
// OFFLINE FALLBACKS MELHORADOS
// =============================================================================

// Fallback para navegação offline
setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    // Fallback para página principal se offline
    if (event.request.mode === 'navigate') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Fallback genérico para páginas
    return caches.match('/') || 
           new Response('Offline - Página não disponível', {
             status: 503,
             statusText: 'Service Unavailable',
             headers: new Headers({ 'Content-Type': 'text/html' }),
           });
  }
  
  // Fallback para imagens
  if (event.request.destination === 'image') {
    return new Response('', {
      status: 200,
      statusText: 'OK',
    });
  }
  
  // Fallback para APIs
  if (event.request.url.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Requisição não disponível offline',
      timestamp: Date.now(),
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
  }
  
  return Response.error();
});

// =============================================================================
// BACKGROUND SYNC PARA FUNCIONALIDADES OFFLINE
// =============================================================================

// Sincronização de requisições pendentes quando voltar online
const PENDING_REQUESTS = 'pending-requests';

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-contracts') {
    event.waitUntil(syncContractChanges());
  }
  
  if (event.tag === 'background-sync-documents') {
    event.waitUntil(syncDocumentChanges());
  }
  
  if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Função para sincronizar mudanças de contratos
async function syncContractChanges() {
  try {
    const cache = await caches.open(PENDING_REQUESTS);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await fetch(request.clone());
      if (response.ok) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[SW] Sync de contratos falhou:', error);
    }
  }
}

// Função para sincronizar mudanças de documentos
async function syncDocumentChanges() {
  // Implementar lógica de sincronização de documentos
  // quando a conexão for restaurada
}

// Função para sincronizar dados de analytics
async function syncAnalyticsData() {
  // Implementar sincronização de analytics
  // quando a conexão for restaurada
}

// =============================================================================
// PUSH NOTIFICATIONS (PREPARADO PARA FUTURAS IMPLEMENTAÇÕES)
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
        // Abrir ou focar na janela da aplicação
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
        
        // Abrir nova janela se nenhuma estiver aberta
        await self.clients.openWindow(url || '/');
      }
    })()
  );
});

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

// Monitoramento de performance do cache
self.addEventListener('fetch', (event) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    event.respondWith(
      (async () => {
        const response = await fetch(event.request);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log apenas requests lentos (> 1s)
        if (duration > 1000) {
          console.log(`[SW] Slow request: ${event.request.url} took ${duration.toFixed(2)}ms`);
        }
        
        return response;
      })()
    );
  }
});

// Export das estratégias para uso externo
export const cacheStrategies = {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  cleanupOldCaches,
  getCacheStatus,
  invalidateCachePattern,
  clearAllCaches,
  precacheUrl,
};