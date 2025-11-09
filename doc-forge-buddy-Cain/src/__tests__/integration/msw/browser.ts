import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Configurar MSW para ambiente de navegador (testes)
export const worker = setupWorker(...handlers);

// Função para iniciar o MSW em ambiente de desenvolvimento
export const startMockServer = async () => {
  if (typeof window !== 'undefined') {
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      onUnhandledRequest: 'bypass',
    });
    console.log('🚀 MSW iniciado - mock server rodando');
  }
};

// Função para parar o MSW
export const stopMockServer = async () => {
  if (typeof window !== 'undefined') {
    await worker.stop();
    console.log('⏹️ MSW parado');
  }
};