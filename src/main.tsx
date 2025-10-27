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
      console.warn('axe-core não pôde ser carregado');
    });
}

// Registrar Service Worker para PWA com gerenciamento avançado
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    // Registrar Service Worker
    await registerServiceWorker();

    // Configurar prompt de instalação
    setupPWAInstallPrompt(() => {
      console.log('✅ PWA pronto para instalação');
      // Aqui você pode mostrar um banner ou botão de instalação
    });

    // Monitorar conectividade
    onConnectivityChange(
      () => {
        console.log('🌐 Conexão restaurada');
        // Opcional: Sincronizar dados pendentes
      },
      () => {
        console.log('📡 Modo offline');
        // Opcional: Mostrar aviso de offline
      }
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(<App />);
