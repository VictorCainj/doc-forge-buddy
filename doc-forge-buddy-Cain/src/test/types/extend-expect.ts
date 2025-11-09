import '@testing-library/jest-dom/matchers';

declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        TestingLibraryMatchers<T, void> {}
  }
}

interface TestingLibraryMatchers<R, T> {
  toBeInTheDocument(): R;
  toHaveTextContent(text: string | RegExp): R;
  toHaveAttribute(attr: string, value?: string): R;
  toHaveClass(className: string): R;
  toBeVisible(): R;
  toBeDisabled(): R;
  toBeEnabled(): R;
  toBeChecked(): R;
  toHaveValue(value: string | number): R;
  toBeRequired(): R;
  toBeInvalid(): R;
  toBeValid(): R;
  toHaveFocus(): R;
  toBeEmptyDOMElement(): R;
  toContainElement(element: HTMLElement | null): R;
  toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
  toBeRequired(): R;
  toBeInvalid(): R;
  toBeValid(): R;
  toHaveDescription(text: string | RegExp): R;
}

// Extend expect with custom matchers
expect.extend({
  toBeInTheDocument(received: any) {
    if (received === null || received === undefined) {
      return {
        message: () => `expected ${received} to be in the document`,
        pass: false,
      };
    }
    
    if (typeof received !== 'object') {
      return {
        message: () => `expected ${received} to be an HTMLElement`,
        pass: false,
      };
    }

    const pass = received.nodeType === Node.ELEMENT_NODE && 
                 received.ownerDocument?.body.contains(received);
    
    return {
      message: () => `expected ${received} to be in the document`,
      pass,
    };
  },

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

  toBeCloseTo(received: number, expected: number, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision) / 2;
    
    return {
      message: () => `expected ${received} to be close to ${expected} with precision ${precision}`,
      pass,
    };
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});