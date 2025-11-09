/**
 * Utilitários para gerenciamento de PWA e Service Worker
 */

/**
 * Registra o Service Worker e gerencia atualizações
 */
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      // Service Worker não suportado
      return null;
    }

    if (!import.meta.env.PROD) {
      // Service Worker desabilitado em desenvolvimento
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
        }
      );

      // Service Worker registrado com sucesso

      // Verificar atualizações a cada hora
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      );

      // Detectar quando há uma nova versão disponível
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // Nova versão disponível
            // Log removido para produção (Lighthouse)

            // Notificar o usuário
            // eslint-disable-next-line no-alert
            if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // Recarregar quando o SW assume controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Log removido para produção (Lighthouse)
        window.location.reload();
      });

      return registration;
    } catch {
      // Log removido para produção (Lighthouse)
      return null;
    }
  };

/**
 * Verifica se o app está rodando como PWA instalado
 */
export const isRunningAsPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Verifica se o Service Worker está ativo
 */
export const isServiceWorkerActive = (): boolean => {
  return navigator.serviceWorker?.controller !== null;
};

/**
 * Limpa cache do Service Worker
 */
export const clearServiceWorkerCache = async (): Promise<void> => {
  if (!navigator.serviceWorker?.controller) {
    throw new Error('Service Worker não está ativo');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_CLEARED') {
        // Log removido para produção (Lighthouse)
        resolve();
      } else {
        reject(new Error('Falha ao limpar cache'));
      }
    };

    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' }, [
      messageChannel.port2,
    ]);
  });
};

/**
 * Obtém status do cache
 */
export const getCacheStatus = async (): Promise<{
  cacheNames: string[];
}> => {
  if (!navigator.serviceWorker?.controller) {
    throw new Error('Service Worker não está ativo');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_STATUS') {
        resolve(event.data);
      } else {
        reject(new Error('Falha ao obter status do cache'));
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [messageChannel.port2]
    );
  });
};

/**
 * Verifica se o navegador suporta notificações push
 */
export const supportsPushNotifications = (): boolean => {
  return 'PushManager' in window && 'Notification' in window;
};

/**
 * Solicita permissão para notificações
 */
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!supportsPushNotifications()) {
      throw new Error('Notificações não são suportadas neste navegador');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  };

/**
 * Envia notificação local
 */
export const showLocalNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options,
    });
  }
};

/**
 * Verifica conectividade online/offline
 */
export const isOnline = (): boolean => navigator.onLine;

/**
 * Adiciona listeners para mudanças de conectividade
 */
export const onConnectivityChange = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Retorna função para remover listeners
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Hook para detectar se o app pode ser instalado
 */
export const canInstallPWA = (): boolean => {
  // Verifica se já está instalado
  if (isRunningAsPWA()) {
    return false;
  }

  // Verifica se o evento beforeinstallprompt foi disparado
  return Object.prototype.hasOwnProperty.call(window, 'deferredPrompt');
};

/**
 * Mostra prompt de instalação do PWA
 */
export const promptPWAInstall = async (): Promise<boolean> => {
  const deferredPrompt = (
    window as Window & { deferredPrompt?: BeforeInstallPromptEvent }
  ).deferredPrompt;

  if (!deferredPrompt) {
    // Log removido para produção (Lighthouse)
    return false;
  }

  // Mostra o prompt
  deferredPrompt.prompt();

  // Aguarda escolha do usuário
  const { outcome } = await deferredPrompt.userChoice;

  // Log removido para produção (Lighthouse)

  // Limpa o prompt
  delete (window as Window & { deferredPrompt?: BeforeInstallPromptEvent })
    .deferredPrompt;

  return outcome === 'accepted';
};

/**
 * Configura listener para evento beforeinstallprompt
 */
export const setupPWAInstallPrompt = (onCanInstall?: () => void): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o prompt automático
    e.preventDefault();

    // Salva o evento para usar depois
    (
      window as Window & { deferredPrompt?: BeforeInstallPromptEvent }
    ).deferredPrompt = e as BeforeInstallPromptEvent;

    // Log removido para produção (Lighthouse)

    if (onCanInstall) {
      onCanInstall();
    }
  });

  // Detecta quando o app foi instalado
  window.addEventListener('appinstalled', () => {
    // Log removido para produção (Lighthouse)
    delete (window as Window & { deferredPrompt?: BeforeInstallPromptEvent })
      .deferredPrompt;
  });
};

// Tipos para TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}
