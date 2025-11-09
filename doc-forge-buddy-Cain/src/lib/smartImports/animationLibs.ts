// Smart imports para bibliotecas de animação
export const animationLibs = {
  // Carregamento assíncrono de bibliotecas de animação
  loadFramerMotion: async () => {
    const { motion, AnimatePresence, useAnimation } = await import('framer-motion');
    return { motion, AnimatePresence, useAnimation };
  },

  loadScrollAnimations: async () => {
    const { useScroll, useTransform } = await import('framer-motion');
    return { useScroll, useTransform };
  },

  loadGestureAnimations: async () => {
    const { useGesture } = await import('@use-gesture/react');
    return { useGesture };
  },

  loadPageTransitions: async () => {
    const pageTransitions = await import('@/components/common/PageTransitions');
    return pageTransitions;
  },

  // Função principal de carregamento
  default: async function() {
    const animationLibs = {
      framerMotion: null,
      scrollAnimations: null,
      gestureAnimations: null,
      pageTransitions: null,
    };

    // Carregar bibliotecas de animação otimizadas
    const loadPromises = [
      // Framer Motion - animações principais
      import('framer-motion')
        .then((module) => {
          animationLibs.framerMotion = {
            motion: module.motion,
            AnimatePresence: module.AnimatePresence,
            useAnimation: module.useAnimation,
          };
        })
        .catch(() => console.warn('framer-motion library failed to load')),

      // Animações de scroll
      import('framer-motion')
        .then(async (module) => {
          // Reusar o import de framer-motion para recursos de scroll
          animationLibs.scrollAnimations = {
            useScroll: module.useScroll,
            useTransform: module.useTransform,
          };
        })
        .catch(() => console.warn('scroll animations failed to load')),

      // Gestos e interações
      import('@use-gesture/react')
        .then((module) => {
          animationLibs.gestureAnimations = {
            useGesture: module.useGesture,
          };
        })
        .catch(() => console.warn('@use-gesture/react library failed to load')),

      // Transições de página customizadas
      import('@/components/common/PageTransitions')
        .then((module) => {
          animationLibs.pageTransitions = module;
        })
        .catch(() => console.warn('PageTransitions component failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return animationLibs;
  }
};