import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Configure MSW worker
export const worker = setupWorker(...handlers);

// Public methods for tests
export const msw = {
  // Start the worker
  start: () => worker.start(),
  
  // Stop the worker
  stop: () => worker.stop(),
  
  // Reset handlers
  resetHandlers: (...newHandlers: any[]) => worker.resetHandlers(...newHandlers),
  
  // Use custom handlers
  use: (...newHandlers: any[]) => worker.use(...newHandlers),
  
  // Restore default handlers
  restoreHandlers: () => worker.restoreHandlers(),
  
  // Check if worker is running
  isRunning: () => {
    // MSW doesn't provide a direct way to check if it's running
    // This is a helper to check if the service worker is active
    return 'serviceWorker' in navigator;
  },
};