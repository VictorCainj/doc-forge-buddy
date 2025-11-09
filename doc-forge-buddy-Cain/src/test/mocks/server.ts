import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW for Node.js environment (server-side rendering or Node tests)
export const server = setupServer(...handlers);

// Start the server before all tests
export const setupMSW = () => {
  server.listen({
    onUnhandledRequest: 'error',
  });
};

// Clean up after each test
export const cleanupMSW = () => {
  server.restoreHandlers();
  server.close();
};

// Reset handlers after each test
export const resetMSWHandlers = () => {
  server.resetHandlers();
};

// Helper to mock a specific request
export const mockRequest = {
  // Mock GET request
  get: (url: string, response: any, status: number = 200) => {
    server.use(
      // This is a simplified way to create custom handlers
      // In a real scenario, you'd want to be more specific
      (req, res, ctx) => {
        if (req.url.toString().includes(url)) {
          return res(ctx.status(status), ctx.json(response));
        }
      }
    );
  },

  // Mock POST request
  post: (url: string, response: any, status: number = 200) => {
    server.use(
      (req, res, ctx) => {
        if (req.url.toString().includes(url)) {
          return res(ctx.status(status), ctx.json(response));
        }
      }
    );
  },

  // Mock PUT request
  put: (url: string, response: any, status: number = 200) => {
    server.use(
      (req, res, ctx) => {
        if (req.url.toString().includes(url)) {
          return res(ctx.status(status), ctx.json(response));
        }
      }
    );
  },

  // Mock DELETE request
  delete: (url: string, response: any, status: number = 200) => {
    server.use(
      (req, res, ctx) => {
        if (req.url.toString().includes(url)) {
          return res(ctx.status(status), ctx.json(response));
        }
      }
    );
  },
};

// Environment-specific MSW setup
export const setupEnvironmentMSW = () => {
  if (typeof window === 'undefined') {
    // Node.js environment
    setupMSW();
    return {
      start: setupMSW,
      stop: cleanupMSW,
      reset: resetMSWHandlers,
    };
  } else {
    // Browser environment
    // This would be used with the browser setup
    return {
      start: () => msw.start(),
      stop: () => msw.stop(),
      reset: () => msw.resetHandlers(),
    };
  }
};