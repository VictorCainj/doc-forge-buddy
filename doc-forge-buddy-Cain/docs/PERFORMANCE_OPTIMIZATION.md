// Performance optimization guide for Doc Forge Buddy

# 1. ADVANCED CODE SPLITTING & LAZY LOADING

## Implementar lazy loading para bibliotecas pesadas:

// Lazy load para bibliotecas gráficas
export const LazyChart = lazy(() => import('react-chartjs-2'));
export const LazyExcel = lazy(() => import('exceljs'));

// Lazy load para páginas raramente acessadas
export const AdminPage = lazy(() => import('@/pages/Admin'));
export const ReportsPage = lazy(() => import('@/pages/Reports'));

// Lazy load para componentes pesados
export const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

## 2. IMAGE OPTIMIZATION

// Preload para imagens críticas
<img 
  src="hero.jpg" 
  alt="Hero" 
  loading="eager"
  decoding="async"
  width="1200" 
  height="600"
/>

// Lazy load para imagens não críticas
<img 
  src="gallery-${index}.jpg" 
  alt="Gallery" 
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 33vw"
/>

// WebP com fallbacks
<picture>
  <source srcSet="image.webp" type="image/webp">
  <source srcSet="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Image">
</picture>

## 3. CACHE STRATEGY

// Service Worker cache strategy
const CACHE_STRATEGIES = {
  api: 'NetworkFirst',
  static: 'CacheFirst', 
  images: 'CacheFirst',
  documents: 'NetworkOnly'
};

// Redis cache para dados frequentes
const cacheKeys = {
  contracts: 'contracts:list',
  templates: 'templates:all',
  notifications: 'notifications:user:{id}'
};

## 4. PERFORMANCE MONITORING

// Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Enviar para Google Analytics ou Sentry
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
