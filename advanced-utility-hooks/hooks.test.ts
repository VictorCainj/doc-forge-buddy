import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useFormValidation,
  useAsyncValidation,
  useDebounce,
  useThrottle,
  useLocalStorage,
  useSessionStorage,
  useIntersectionObserver,
  useResizeObserver,
  useVirtualScrolling,
  useInfiniteScroll,
} from './index';
import { z } from 'zod';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('Advanced Utility Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  // ================================
  // useFormValidation Tests
  // ================================
  describe('useFormValidation', () => {
    const schema = z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      email: z.string().email('Email inválido'),
    });

    it('should validate form data correctly', () => {
      const { result } = renderHook(() => 
        useFormValidation(schema, { name: '', email: '' })
      );

      expect(result.current.isValid).toBe(false);
      expect(result.current.data).toEqual({ name: '', email: '' });
      expect(result.current.errors).toEqual({});
    });

    it('should update field and validate', async () => {
      const { result } = renderHook(() => 
        useFormValidation(schema, { name: 'João', email: '' })
      );

      act(() => {
        result.current.setField('email', 'joao@email.com');
      });

      expect(result.current.data.email).toBe('joao@email.com');
      expect(result.current.isValid).toBe(true);
    });

    it('should show validation errors', () => {
      const { result } = renderHook(() => 
        useFormValidation(schema, { name: 'J', email: 'invalid-email' })
      );

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.getFieldError('name')).toBeTruthy();
      expect(result.current.getFieldError('email')).toBeTruthy();
    });

    it('should reset form', () => {
      const initialData = { name: 'João', email: 'joao@email.com' };
      const { result } = renderHook(() => 
        useFormValidation(schema, initialData)
      );

      act(() => {
        result.current.setField('name', 'Maria');
        result.current.setField('email', 'maria@email.com');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toEqual(initialData);
      expect(result.current.errors).toEqual({});
    });
  });

  // ================================
  // useAsyncValidation Tests
  // ================================
  describe('useAsyncValidation', () => {
    it('should handle async validation', async () => {
      const validator = jest.fn().mockResolvedValue(true);
      const { result } = renderHook(() => 
        useAsyncValidation(validator, 300)
      );

      expect(result.current.isValid).toBeNull();
      expect(result.current.isValidating).toBe(false);

      act(() => {
        result.current.validate('test@example.com');
      });

      expect(result.current.isValidating).toBe(true);

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      expect(result.current.isValid).toBe(true);
      expect(validator).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle validation errors', async () => {
      const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      const { result } = renderHook(() => 
        useAsyncValidation(validator, 300)
      );

      act(() => {
        result.current.validate('test@example.com');
      });

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe('Validation failed');
    });

    it('should debounce validation', async () => {
      const validator = jest.fn().mockResolvedValue(true);
      const { result } = renderHook(() => 
        useAsyncValidation(validator, 500)
      );

      act(() => {
        result.current.validate('test1@example.com');
        result.current.validate('test2@example.com');
        result.current.validate('test3@example.com');
      });

      // Validator should be called only once due to debounce
      expect(validator).toHaveBeenCalledTimes(0);

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      }, { timeout: 1000 });

      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith('test3@example.com');
    });
  });

  // ================================
  // useDebounce Tests
  // ================================
  describe('useDebounce', () => {
    it('should debounce value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');

      await waitFor(() => {
        expect(result.current).toBe('updated');
      }, { timeout: 600 });
    });
  });

  // ================================
  // useThrottle Tests
  // ================================
  describe('useThrottle', () => {
    it('should throttle value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated1' });
      expect(result.current).toBe('updated1');

      rerender({ value: 'updated2' });
      expect(result.current).toBe('updated1');

      await waitFor(() => {
        expect(result.current).toBe('updated2');
      }, { timeout: 600 });
    });
  });

  // ================================
  // useLocalStorage Tests
  // ================================
  describe('useLocalStorage', () => {
    it('should get and set localStorage values', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored value'));
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial value')
      );

      expect(result.current[0]).toBe('stored value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');

      act(() => {
        result.current[1]('new value');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('new value')
      );
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'fallback value')
      );

      expect(result.current[0]).toBe('fallback value');
    });
  });

  // ================================
  // useSessionStorage Tests
  // ================================
  describe('useSessionStorage', () => {
    it('should get and set sessionStorage values', () => {
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify('session value'));
      
      const { result } = renderHook(() => 
        useSessionStorage('session-key', 'initial value')
      );

      expect(result.current[0]).toBe('session value');

      act(() => {
        result.current[1]('new session value');
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'session-key',
        JSON.stringify('new session value')
      );
    });
  });

  // ================================
  // useVirtualScrolling Tests
  // ================================
  describe('useVirtualScrolling', () => {
    it('should calculate visible items correctly', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() => 
        useVirtualScrolling(items, {
          itemHeight: 50,
          containerHeight: 400,
          overscan: 5,
        })
      );

      // Should return initial visible items
      expect(result.current.visibleItems).toHaveLength(8); // 400/50 = 8 items
      expect(result.current.startIndex).toBe(0);
      expect(result.current.totalHeight).toBe(50000); // 1000 * 50
    });

    it('should update on scroll', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() => 
        useVirtualScrolling(items, {
          itemHeight: 50,
          containerHeight: 400,
        })
      );

      // Simular scroll
      act(() => {
        result.current.containerStyle.onScroll({
          currentTarget: { scrollTop: 500 },
        } as any);
      });

      expect(result.current.startIndex).toBe(10); // 500/50 = 10
    });
  });

  // ================================
  // useInfiniteScroll Tests
  // ================================
  describe('useInfiniteScroll', () => {
    it('should load more items on demand', async () => {
      const mockFetch = jest.fn().mockResolvedValue(['item1', 'item2']);
      
      const { result } = renderHook(() => 
        useInfiniteScroll(mockFetch, {
          initialItems: [],
          enabled: true,
        })
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasMore).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual(['item1', 'item2']);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should stop loading when no more items', async () => {
      const mockFetch = jest.fn().mockResolvedValue([]); // Empty response
      
      const { result } = renderHook(() => 
        useInfiniteScroll(mockFetch, { initialItems: [] })
      );

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => 
        useInfiniteScroll(mockFetch, { initialItems: [] })
      );

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });
  });
});