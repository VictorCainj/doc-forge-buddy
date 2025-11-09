import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configurar MSW para ambiente Node.js (Vitest)
export const server = setupServer(...handlers);

// Função para iniciar o MSW antes de todos os testes
export const startMockServer = () => {
  server.listen({
    onUnhandledRequest: 'bypass',
  });
  console.log('🚀 MSW iniciado em modo Node.js');
};

// Função para parar o MSW após todos os testes
export const stopMockServer = () => {
  server.close();
  console.log('⏹️ MSW parado');
};

// Função para resetar handlers entre testes
export const resetMockServer = () => {
  server.resetHandlers();
  console.log('🔄 MSW handlers resetados');
};