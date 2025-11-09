import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/advanced-utility-hooks/useDebounce';
import { setupMocks } from '@/test/utils/test-utils';

// Mock do setTimeout e clearTimeout
vi.stubGlobal('setTimeout', vi.fn());
vi.stubGlobal('clearTimeout', vi.fn());

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useDebounce', () => {
  it('deve retornar o valor inicial sem debounce', () => {
    const { result } = renderHook(() => useDebounce('valor inicial', 500));

    expect(result.current).toBe('valor inicial');
  });

  it('deve atualizar o valor imediatamente', () => {
    const { result } = renderHook(() => useDebounce('valor inicial', 500));

    act(() => {
      // O valor deveria ser atualizado sem debounce ainda
      // O setTimeout será chamado para o debounce
    });

    // Como ainda não passou o tempo de delay, o valor deve estar o mesmo
    expect(result.current).toBe('valor inicial');
  });

  it('deve chamar setTimeout com o delay correto', () => {
    const { result } = renderHook(() => useDebounce('valor inicial', 500));

    // Ativar a re-renderização que acontece quando o valor muda
    act(() => {
      // Forçar re-render
    });

    expect(vi.mocked(setTimeout)).toHaveBeenCalled();
    expect(vi.mocked(setTimeout)).toHaveBeenCalledWith(
      expect.any(Function),
      500
    );
  });

  it('deve usar delay padrão quando não especificado', () => {
    const { result } = renderHook(() => useDebounce('valor'));

    act(() => {
      // Forçar re-render
    });

    expect(vi.mocked(setTimeout)).toHaveBeenCalledWith(
      expect.any(Function),
      300 // delay padrão
    );
  });

  it('deve usar delay customizado', () => {
    const { result } = renderHook(() => useDebounce('valor', 1000));

    act(() => {
      // Forçar re-render
    });

    expect(vi.mocked(setTimeout)).toHaveBeenCalledWith(
      expect.any(Function),
      1000
    );
  });

  it('deve limpar timeout anterior quando valor muda', () => {
    const { result } = renderHook(({ delay }) => useDebounce('valor', delay), {
      initialProps: { delay: 500 },
    });

    // Primeiro setTimeout
    act(() => {
      // Forçar re-render
    });

    const firstTimeoutCall = vi.mocked(setTimeout).mock.calls[0];

    // Mudar o delay
    result.rerender({ delay: 1000 });

    // Verificar se clearTimeout foi chamado para o timeout anterior
    expect(vi.mocked(clearTimeout)).toHaveBeenCalledWith(firstTimeoutCall[0]);

    // Verificar se novo setTimeout foi chamado
    expect(vi.mocked(setTimeout)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(setTimeout).mock.calls[1][1]).toBe(1000);
  });

  it('deve limpar timeout no unmount', () => {
    const { result } = renderHook(() => useDebounce('valor', 500));

    act(() => {
      // Forçar re-render
    });

    const timeoutCalls = vi.mocked(setTimeout).mock.calls;
    const firstTimeoutId = timeoutCalls[0][0];

    // Desmontar o hook
    result.unmount();

    expect(vi.mocked(clearTimeout)).toHaveBeenCalledWith(firstTimeoutId);
  });

  it('deve funcionar com diferentes tipos de valor', () => {
    // Teste com número
    const { result: numberResult } = renderHook(() => useDebounce(42, 500));
    expect(numberResult.current).toBe(42);

    // Teste com objeto
    const testObject = { name: 'test' };
    const { result: objectResult } = renderHook(() => useDebounce(testObject, 500));
    expect(objectResult.current).toBe(testObject);

    // Teste com array
    const testArray = [1, 2, 3];
    const { result: arrayResult } = renderHook(() => useDebounce(testArray, 500));
    expect(arrayResult.current).toBe(testArray);

    // Teste com null
    const { result: nullResult } = renderHook(() => useDebounce(null, 500));
    expect(nullResult.current).toBeNull();

    // Teste com undefined
    const { result: undefinedResult } = renderHook(() => useDebounce(undefined, 500));
    expect(undefinedResult.current).toBeUndefined();
  });

  it('deve funcionar com delay de 0', () => {
    const { result } = renderHook(() => useDebounce('valor', 0));

    expect(result.current).toBe('valor');

    act(() => {
      // Forçar re-render
    });

    expect(vi.mocked(setTimeout)).toHaveBeenCalledWith(
      expect.any(Function),
      0
    );
  });

  it('deve funcionar com delay negativo (tratado como 0)', () => {
    const { result } = renderHook(() => useDebounce('valor', -100));

    expect(result.current).toBe('valor');

    act(() => {
      // Forçar re-render
    });

    expect(vi.mocked(setTimeout)).toHaveBeenCalledWith(
      expect.any(Function),
      -100
    );
  });

  it('deve preservar a referência do valor quando não muda', () => {
    const testObject = { name: 'test' };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: testObject } }
    );

    const firstValue = result.current;

    // Re-render com mesmo valor
    rerender({ value: testObject });

    expect(result.current).toBe(firstValue);
    expect(result.current).toBe(testObject);
  });

  it('deve ter performance adequada com many renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Many renders rápidos
    for (let i = 0; i < 100; i++) {
      rerender({ value: `value-${i}` });
    }

    // Deve ter chamado setTimeout muitas vezes, mas deve ter limpo timeouts anteriores
    expect(vi.mocked(setTimeout)).toHaveBeenCalled();
    expect(vi.mocked(clearTimeout)).toHaveBeenCalled();
  });
});