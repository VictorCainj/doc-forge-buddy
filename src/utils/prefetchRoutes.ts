type Prefetcher = () => Promise<unknown>;

let hasPrefetched = false;

// Delay inicial maior para não competir com recursos críticos
const PREFETCH_DELAY = 2000; // 2 segundos após carga inicial
const PREFETCH_STEP = 400; // Espaçamento maior entre requisições

// Priorizar rotas mais comuns
const criticalRoutes: Prefetcher[] = [
  () => import('@/pages/Index'),
  () => import('@/pages/Login'),
  () => import('@/pages/Contratos'),
];

// Rotas secundárias - carregar apenas após idle time
const secondaryRoutes: Prefetcher[] = [
  () => import('@/pages/CadastrarContrato'),
  () => import('@/pages/EditarContrato'),
  () => import('@/pages/ProcessoRescisao'),
  () => import('@/pages/GerarDocumento'),
  () => import('@/pages/ForgotPassword'),
];

// Rotas terciárias - carregar apenas após interação do usuário
const tertiaryRoutes: Prefetcher[] = [
  () => import('@/pages/TermoLocador'),
  () => import('@/pages/TermoLocatario'),
  () => import('@/pages/TermoRecusaAssinaturaEmail'),
  () => import('@/pages/AnaliseVistoria'),
  () => import('@/pages/Prestadores'),
  () => import('@/pages/Tarefas'),
  () => import('@/pages/DashboardDesocupacao'),
  () => import('@/pages/Admin'),
  () => import('@/pages/DocumentoPublico'),
  () => import('@/pages/NotFound'),
];

const safelyPrefetch = (prefetch: Prefetcher) => {
  prefetch().catch(() => {
    // Ignorar falhas silenciosamente para não interromper a experiência do usuário
  });
};

// Prefetch apenas rotas críticas inicialmente
const prefetchCriticalRoutes = () => {
  criticalRoutes.forEach((prefetch, index) => {
    window.setTimeout(() => safelyPrefetch(prefetch), index * PREFETCH_STEP);
  });
};

// Prefetch rotas secundárias após idle time
const prefetchSecondaryRoutes = () => {
  secondaryRoutes.forEach((prefetch, index) => {
    window.setTimeout(
      () => safelyPrefetch(prefetch),
      PREFETCH_DELAY + index * PREFETCH_STEP
    );
  });
};

// Prefetch rotas terciárias apenas após interação do usuário
const prefetchTertiaryRoutes = () => {
  if (hasPrefetched) return;
  hasPrefetched = true;

  tertiaryRoutes.forEach((prefetch, index) => {
    window.setTimeout(() => safelyPrefetch(prefetch), index * PREFETCH_STEP);
  });
};

export const prefetchRouteModules = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Prefetch rotas críticas imediatamente após carga inicial
  prefetchCriticalRoutes();

  // Prefetch rotas secundárias após idle time ou interação
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        prefetchSecondaryRoutes();
      },
      { timeout: 3000 }
    );
  } else {
    // Fallback para navegadores sem requestIdleCallback
    window.setTimeout(prefetchSecondaryRoutes, PREFETCH_DELAY);
  }

  // Prefetch rotas terciárias apenas após primeira interação do usuário
  const handleFirstInteraction = () => {
    prefetchTertiaryRoutes();
    // Remover listeners após primeira interação
    window.removeEventListener('mousedown', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };

  window.addEventListener('mousedown', handleFirstInteraction, { once: true });
  window.addEventListener('touchstart', handleFirstInteraction, { once: true });
  window.addEventListener('keydown', handleFirstInteraction, { once: true });
};
