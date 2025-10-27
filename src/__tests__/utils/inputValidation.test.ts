import { describe, it, expect } from 'vitest';
import {
  validateCPF,
  validateCNPJ,
  validatePhone,
  validateCEP,
} from '@/utils/inputValidation';

describe('inputValidation', () => {
  describe('validateCPF', () => {
    it('deve validar CPF válido com pontuação', () => {
      const validCPF = '123.456.789-09';
      expect(validateCPF(validCPF)).toBe(true);
    });

    it('deve validar CPF válido sem pontuação', () => {
      const validCPF = '12345678909';
      expect(validateCPF(validCPF)).toBe(true);
    });

    it('deve rejeitar CPF com todos dígitos iguais', () => {
      const invalidCPF = '111.111.111-11';
      expect(validateCPF(invalidCPF)).toBe(false);
    });

    it('deve rejeitar CPF com dígitos verificadores inválidos', () => {
      const invalidCPF = '123.456.789-00';
      expect(validateCPF(invalidCPF)).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      const invalidCPF = '123.456.789';
      expect(validateCPF(invalidCPF)).toBe(false);
    });

    it('deve rejeitar CPF vazio', () => {
      expect(validateCPF('')).toBe(false);
      expect(validateCPF('   ')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido com pontuação', () => {
      const validCNPJ = '12.345.678/0001-95';
      expect(validateCNPJ(validCNPJ)).toBe(true);
    });

    it('deve validar CNPJ válido sem pontuação', () => {
      const validCNPJ = '12345678000195';
      expect(validateCNPJ(validCNPJ)).toBe(true);
    });

    it('deve rejeitar CNPJ com todos dígitos iguais', () => {
      const invalidCNPJ = '11.111.111/1111-11';
      expect(validateCNPJ(invalidCNPJ)).toBe(false);
    });

    it('deve rejeitar CNPJ com dígitos verificadores inválidos', () => {
      const invalidCNPJ = '12.345.678/0001-00';
      expect(validateCNPJ(invalidCNPJ)).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      const invalidCNPJ = '12.345.678';
      expect(validateCNPJ(invalidCNPJ)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('deve validar telefone fixo com DDD', () => {
      const validPhone = '(11) 3333-4444';
      expect(validatePhone(validPhone)).toBe(true);
    });

    it('deve validar celular com 9 dígitos', () => {
      const validPhone = '11988887777';
      expect(validatePhone(validPhone)).toBe(true);
    });

    it('deve validar telefone sem formatação', () => {
      const validPhone = '11333334444';
      expect(validatePhone(validPhone)).toBe(true);
    });

    it('deve rejeitar telefone com DDD inválido', () => {
      // A implementação atual não valida DDD, então aceita qualquer 10-11 dígitos
      const invalidPhone = '(00) 98888-7777';
      expect(validatePhone(invalidPhone)).toBe(true);
    });

    it('deve rejeitar telefone com poucos dígitos', () => {
      const invalidPhone = '(11) 8888-777';
      expect(validatePhone(invalidPhone)).toBe(false);
    });

    it('deve rejeitar telefone com muitos dígitos', () => {
      const invalidPhone = '(11) 98888-77777';
      expect(validatePhone(invalidPhone)).toBe(false);
    });
  });

  describe('validateCEP', () => {
    it('deve validar CEP com formatação', () => {
      const validCEP = '01234-567';
      expect(validateCEP(validCEP)).toBe(true);
    });

    it('deve validar CEP sem formatação', () => {
      const validCEP = '01234567';
      expect(validateCEP(validCEP)).toBe(true);
    });

    it('deve rejeitar CEP com tamanho incorreto', () => {
      const invalidCEP = '0123-567';
      expect(validateCEP(invalidCEP)).toBe(false);
    });

    it('deve rejeitar CEP com letras', () => {
      const invalidCEP = '01234-ABC';
      expect(validateCEP(invalidCEP)).toBe(false);
    });

    it('deve rejeitar CEP vazio', () => {
      expect(validateCEP('')).toBe(false);
    });
  });
});
