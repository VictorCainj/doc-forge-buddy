import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '@/advanced-utility-hooks/useFormValidation';
import { setupMocks } from '@/test/utils/test-utils';

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useFormValidation', () => {
  it('deve inicializar com estado válido', () => {
    const { result } = renderHook(() => useFormValidation());

    expect(result.current.isValid).toBe(true);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.errors).toEqual({});
    expect(typeof result.current.validateField).toBe('function');
    expect(typeof result.current.validateAll).toBe('function');
    expect(typeof result.current.setErrors).toBe('function');
  });

  it('deve permitir definir erros manualmente', () => {
    const { result } = renderHook(() => useFormValidation());

    const newErrors = {
      email: 'Email inválido',
      password: 'Senha muito curta',
    };

    act(() => {
      result.current.setErrors(newErrors);
    });

    expect(result.current.errors).toEqual(newErrors);
    expect(result.current.isValid).toBe(false);
  });

  it('deve validar campo de email corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const emailTests = [
      { email: 'test@example.com', expected: true },
      { email: 'invalid-email', expected: false },
      { email: 'test@', expected: false },
      { email: '@example.com', expected: false },
      { email: '', expected: true }, // Campo opcional
    ];

    emailTests.forEach(({ email, expected }) => {
      const isValid = result.current.validateField('email', email);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de password corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const passwordTests = [
      { password: 'Abc123!', expected: true },
      { password: 'abc123', expected: false }, // Sem maiúscula
      { password: 'ABC123', expected: false }, // Sem minúscula
      { password: 'Abc!', expected: false }, // Muito curto
      { password: '', expected: true }, // Campo opcional
    ];

    passwordTests.forEach(({ password, expected }) => {
      const isValid = result.current.validateField('password', password);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de telefone corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const phoneTests = [
      { phone: '(11) 99999-9999', expected: true },
      { phone: '11999999999', expected: true },
      { phone: '11 99999 9999', expected: true },
      { phone: '12345', expected: false },
      { phone: '', expected: true }, // Campo opcional
    ];

    phoneTests.forEach(({ phone, expected }) => {
      const isValid = result.current.validateField('phone', phone);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de CPF corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const cpfTests = [
      { cpf: '123.456.789-09', expected: true },
      { cpf: '12345678909', expected: true },
      { cpf: '111.111.111-11', expected: false }, // CPF inválido
      { cpf: '123', expected: false },
      { cpf: '', expected: true }, // Campo opcional
    ];

    cpfTests.forEach(({ cpf, expected }) => {
      const isValid = result.current.validateField('cpf', cpf);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de CNPJ corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const cnpjTests = [
      { cnpj: '12.345.678/0001-90', expected: true },
      { cnpj: '12345678000190', expected: true },
      { cnpj: '11.111.111/1111-11', expected: false }, // CNPJ inválido
      { cnpj: '123', expected: false },
      { cnpj: '', expected: true }, // Campo opcional
    ];

    cnpjTests.forEach(({ cnpj, expected }) => {
      const isValid = result.current.validateField('cnpj', cnpj);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de required corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const requiredTests = [
      { value: 'texto', expected: true },
      { value: '   ', expected: true }, // Espaços são válidos
      { value: '0', expected: true }, // Zero é válido
      { value: '', expected: false },
      { value: null, expected: false },
      { value: undefined, expected: false },
    ];

    requiredTests.forEach(({ value, expected }) => {
      const isValid = result.current.validateField('required', value);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de número corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const numberTests = [
      { value: '123', expected: true },
      { value: '123.45', expected: true },
      { value: '-123', expected: true },
      { value: 'abc', expected: false },
      { value: '12a3', expected: false },
      { value: '', expected: true }, // Campo opcional
    ];

    numberTests.forEach(({ value, expected }) => {
      const isValid = result.current.validateField('number', value);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar campo de URL corretamente', () => {
    const { result } = renderHook(() => useFormValidation());

    const urlTests = [
      { url: 'https://example.com', expected: true },
      { url: 'http://example.com', expected: true },
      { url: 'www.example.com', expected: true },
      { url: 'example.com', expected: true },
      { url: 'invalid-url', expected: false },
      { url: '', expected: true }, // Campo opcional
    ];

    urlTests.forEach(({ url, expected }) => {
      const isValid = result.current.validateField('url', url);
      expect(isValid).toBe(expected);
    });
  });

  it('deve validar com regras customizadas', () => {
    const { result } = renderHook(() => useFormValidation());

    const customValidation = (value: string) => value.length > 5;

    act(() => {
      result.current.setErrors({});
    });

    const isValid = result.current.validateField('custom', 'texto longo', customValidation);
    expect(isValid).toBe(true);

    const isInvalid = result.current.validateField('custom', 'curto', customValidation);
    expect(isInvalid).toBe(false);
  });

  it('deve validar todos os campos', () => {
    const { result } = renderHook(() => useFormValidation());

    const testData = {
      email: 'test@example.com',
      password: 'Abc123!',
      phone: '(11) 99999-9999',
      required: 'valor',
    };

    const isValid = result.current.validateAll(testData);

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('deve detectar erros em todos os campos', () => {
    const { result } = renderHook(() => useFormValidation());

    const testData = {
      email: 'invalid-email',
      password: 'abc',
      phone: '123',
      required: '',
    };

    const isValid = result.current.validateAll(testData);

    expect(isValid).toBe(false);
    expect(result.current.errors).toEqual({
      email: 'Email inválido',
      password: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número',
      phone: 'Telefone inválido',
      required: 'Campo obrigatório',
    });
  });

  it('deve limpar erros quando dados válidos são fornecidos', () => {
    const { result } = renderHook(() => useFormValidation());

    // Primeiro definir erros
    act(() => {
      result.current.setErrors({
        email: 'Email inválido',
        password: 'Senha inválida',
      });
    });

    expect(result.current.isValid).toBe(false);

    // Depois validar com dados corretos
    const testData = {
      email: 'test@example.com',
      password: 'Abc123!',
    };

    act(() => {
      result.current.validateAll(testData);
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('deve permitir validação assíncrona', async () => {
    const { result } = renderHook(() => useFormValidation());

    act(() => {
      result.current.setErrors({});
    });

    // Mock de validação assíncrona
    const asyncValidation = async (value: string) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return value.length > 3;
    };

    const isValid = await result.current.validateField('async', 'teste', asyncValidation);
    expect(isValid).toBe(true);
  });
});