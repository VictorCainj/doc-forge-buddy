# PWA Advanced Optimizations

## 1. OFFLINE STRATEGY AVANÇADA

// Service Worker com estratégias inteligentes
const CACHE_NAME = 'doc-forge-buddy-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Estratégias de cache por tipo
const cacheStrategies = {
  // APIs dinâmicas: sempre buscar rede primeiro
  '/api/': 'networkFirst',
  
  // Assets estáticos: cache primeiro
  '/static/': 'cacheFirst',
  
  // Imagens: cache com atualização em background
  '/images/': 'staleWhileRevalidate',
  
  // Documentos: sempre rede (dados críticos)
  '/documents/': 'networkOnly'
};

// Cache inteligente com background sync
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Background sync para requisições POST
  if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response.ok) {
            // Salvar no IndexedDB para retry posterior
            return saveToIndexedDB(request);
          }
          return response;
        })
        .catch(error => {
          // Salvar para retry quando online
          return saveToIndexedDB(request);
        })
    );
  }
});

// 2. PUSH NOTIFICATIONS
const VAPID_PUBLIC_KEY = 'your-vapid-public-key';

const subscribeToPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  
  // Salvar subscription no backend
  await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
};

// 3. INSTALLATION PROMPT
const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const install = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
  return { install, isInstallable };
};

// 4. SHORTCUTS (App Shortcuts)
{
  "name": "Doc Forge Buddy",
  "shortcuts": [
    {
      "name": "Novo Contrato",
      "short_name": "Contrato",
      "description": "Criar novo contrato de locação",
      "url": "/contratos/novo",
      "icons": [{ "src": "icons/shortcut-contract.png", "sizes": "192x192" }]
    },
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Acessar dashboard principal",
      "url": "/dashboard",
      "icons": [{ "src": "icons/shortcut-dashboard.png", "sizes": "192x192" }]
    }
  ]
}

// 5. APPLE TOUCH ICONS
<head>
  <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png">
  <link rel="apple-touch-startup-image" href="/icons/splash-2048-2732.png">
</head>

// 6. SPLASH SCREENS
{
  "icons": [
    {
      "src": "splash-1125-2436.png",
      "sizes": "1125x2436",
      "type": "image/png",
      "media": "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
    }
  ]
}

// 7. SHARING API
const shareContent = async (title, text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch (err) {
      console.log('Error sharing:', err);
    }
  } else {
    // Fallback para redes sociais
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
  }
};
