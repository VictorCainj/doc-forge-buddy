import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Fix global object configuration for webidl-conversions
if (typeof global === 'undefined') {
  var global = global || window;
}

// Cleanup after all tests
afterAll(() => {
  vi.clearAllTimers();
});

// Reset after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Global test utilities
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserverEntry
(global as any).ResizeObserverEntry = class ResizeObserverEntry {
  target: any;
  contentRect: any;
  constructor(target: any) {
    this.target = target;
    this.contentRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
  }
};

// Mock window.requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => 0);
global.cancelAnimationFrame = vi.fn();

// Mock scrollTo
global.scrollTo = vi.fn();

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    getPropertyValueInPixels: () => '0px',
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.querySelector
const mockQuerySelector = vi.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
});

// Mock window.innerWidth and innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 768,
});

// Mock performance.now
Object.defineProperty(performance, 'now', {
  writable: true,
  value: () => Date.now(),
});

// Mock custom matchers for better assertions
expect.extend({
  toHaveBeenCalledWithNumber(received: any, expected: number) {
    const calls = received.mock.calls;
    const pass = calls.some((call: any[]) => call[0] === expected);
    if (pass) {
      return {
        message: () => `expected ${received} not to have been called with ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have been called with ${expected}`,
        pass: false,
      };
    }
  },
});

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Global test configuration
Object.defineProperty(global, 'IS_TESTING', {
  value: true,
  writable: false,
});

// Mock console.warn and console.error in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render is no longer supported') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
  
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}
