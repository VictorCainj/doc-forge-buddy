import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initMonitoring } from './lib/monitoring';
import { initSentry } from './lib/sentry';
import {
  registerServiceWorker,
  setupPWAInstallPrompt,
  onConnectivityChange,
} from './utils/pwaHelpers';
import { log } from './utils/logger';

// Configurar Trusted Types para mitigar DOM-based XSS
if (typeof window !== 'undefined' && 'trustedTypes' in window) {
  try {
    // @ts-expect-error - trustedTypes não está disponível em todos os navegadores e não está nos tipos do TypeScript
    if (window.trustedTypes?.createPolicy) {
      // @ts-expect-error - trustedTypes não está disponível em todos os navegadores e não está nos tipos do TypeScript
      window.trustedTypes.createPolicy('default', {
        createHTML: (string: string) => string,
        createScriptURL: (string: string) => string,
        createScript: (string: string) => string,
      });
    }
  } catch (error) {
    log.warn('Trusted Types não pôde ser configurado:', error);
  }
}

// Inicializar Sentry para error tracking (apenas em produção)
initSentry();

// Inicializar sistema de monitoramento
initMonitoring();

// Configurar axe-core em desenvolvimento
if (import.meta.env.DEV) {
  import('@axe-core/react')
    .then((axe) => {
      axe.default(React, ReactDOM, 1000, {});
    })
    .catch(() => {
      log.warn('axe-core não pôde ser carregado');
    });
}

// Registrar Service Worker para PWA com gerenciamento avançado
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    // Registrar Service Worker
    await registerServiceWorker();

    // Configurar prompt de instalação
    setupPWAInstallPrompt(() => {
      log.info('✅ PWA pronto para instalação');
      // Aqui você pode mostrar um banner ou botão de instalação
    });

    // Monitorar conectividade
    onConnectivityChange(
      () => {
        log.info('🌐 Conexão restaurada');
        // Opcional: Sincronizar dados pendentes
      },
      () => {
        log.info('📡 Modo offline');
        // Opcional: Mostrar aviso de offline
      }
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(<App />);
