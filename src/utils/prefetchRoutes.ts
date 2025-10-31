type Prefetcher = () => Promise<unknown>;

let hasPrefetched = false;

const PREFETCH_DELAY = 800;
const PREFETCH_STEP = 260;

const prefetchQueue: Prefetcher[] = [
  () => import('@/pages/Index'),
  () => import('@/pages/Login'),
  () => import('@/pages/ForgotPassword'),
  () => import('@/pages/Contratos'),
  () => import('@/pages/CadastrarContrato'),
  () => import('@/pages/EditarContrato'),
  () => import('@/pages/ProcessoRescisao'),
  () => import('@/pages/GerarDocumento'),
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

export const prefetchRouteModules = () => {
  if (typeof window === 'undefined' || hasPrefetched) {
    return;
  }

  hasPrefetched = true;

  prefetchQueue.reduce((delay, prefetch) => {
    window.setTimeout(() => safelyPrefetch(prefetch), delay);
    return delay + PREFETCH_STEP;
  }, PREFETCH_DELAY);
};
