import { useEffect } from 'react';
import { useImageOptimization } from '@/utils/imageOptimization';

/**
 * Hook para otimização automática de imagens
 * - Adiciona loading="lazy" para todas as imagens não-críticas
 * - Adiciona dimensions para evitar CLS
 * - Configura preload para imagens críticas
 */
export const useImageOptimizationGlobal = () => {
  const { setupLazyLoading } = useImageOptimization();

  useEffect(() => {
    // Configurar lazy loading para todas as imagens
    setupLazyLoading();

    // Otimizar imagens existentes no DOM
    const optimizeExistingImages = () => {
      const images = document.querySelectorAll('img:not([data-optimized])');

      images.forEach((img) => {
        const imageEl = img as HTMLImageElement;

        // Marcar como otimizada para não processar novamente
        imageEl.setAttribute('data-optimized', 'true');

        // Adicionar loading="lazy" se não for uma imagem crítica
        if (!imageEl.hasAttribute('priority') && !imageEl.closest('[data-critical]')) {
          if (!imageEl.hasAttribute('loading')) {
            imageEl.setAttribute('loading', 'lazy');
          }
        }

        // Adicionar dimensions se não tiver
        if (!imageEl.width || !imageEl.height) {
          // Adicionar style para manter aspect ratio
          if (!imageEl.style.aspectRatio && !imageEl.style.height) {
            imageEl.style.aspectRatio = '16/9';
          }
        }

        // Adicionar decoding async para não-críticas
        if (!imageEl.hasAttribute('decoding')) {
          imageEl.setAttribute('decoding', 'async');
        }

        // Configurar fetch priority
        if (!imageEl.hasAttribute('fetchpriority')) {
          const isCritical = imageEl.hasAttribute('priority') || 
                           imageEl.closest('[data-critical]') ||
                           imageEl.classList.contains('hero-image') ||
                           imageEl.classList.contains('logo');
          
          imageEl.setAttribute('fetchpriority', isCritical ? 'high' : 'low');
        }
      });
    };

    // Executar otimização inicial
    optimizeExistingImages();

    // Configurar MutationObserver para novos elementos
    const observer = new MutationObserver((mutations) => {
      let shouldOptimize = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Verificar se há novas imagens
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IMG' || element.querySelector('img')) {
                shouldOptimize = true;
              }
            }
          });
        }
      });

      if (shouldOptimize) {
        // Pequeno delay para garantir que o DOM foi atualizado
        setTimeout(optimizeExistingImages, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [setupLazyLoading]);
};

export default useImageOptimizationGlobal;