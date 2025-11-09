/**
 * Testes para utilitários de política de senhas
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validatePassword,
  generateStrongPassword,
  estimateCrackTime,
  isPasswordExpired,
  daysUntilExpiration,
  checkPasswordCompromised,
} from '@/utils/passwordPolicy';

describe('passwordPolicy', () => {
  describe('validatePassword', () => {
    it('deve validar senha forte corretamente', () => {
      const strongPassword = 'MinhaSenh@123';
      const result = validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very-strong');
      expect(result.score).toBeGreaterThan(60);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar senha fraca', () => {
      const weakPassword = '123';
      const result = validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.score).toBeLessThan(40);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve validar senha muito forte', () => {
      const veryStrongPassword = 'MinhaSenh@MuitoForte123!@#';
      const result = validatePassword(veryStrongPassword);

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very-strong');
      expect(result.score).toBeGreaterThan(80);
    });

    it('deve detectar senhas comuns', () => {
      const commonPassword = 'password123';
      const result = validatePassword(commonPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Esta senha é muito comum. Escolha uma senha mais segura'
      );
    });
  });

  describe('generateStrongPassword', () => {
    it('deve gerar senha com comprimento correto', () => {
      const password = generateStrongPassword(16);
      expect(password).toHaveLength(16);
    });

    it('deve gerar senha válida', () => {
      const password = generateStrongPassword(12);
      const validation = validatePassword(password);
      expect(validation.isValid).toBe(true);
    });

    it('deve gerar senhas diferentes', () => {
      const password1 = generateStrongPassword(16);
      const password2 = generateStrongPassword(16);
      expect(password1).not.toBe(password2);
    });
  });

  describe('estimateCrackTime', () => {
    it('deve estimar tempo para senha fraca', () => {
      const weakPassword = '123';
      const time = estimateCrackTime(weakPassword);
      expect(time).toBe('Instantâneo');
    });

    it('deve estimar tempo para senha forte', () => {
      const strongPassword = 'MinhaSenh@123';
      const time = estimateCrackTime(strongPassword);
      expect(time).toMatch(/\d+|Séculos/); // Deve conter números ou "Séculos"
    });
  });

  describe('isPasswordExpired', () => {
    it('deve detectar senha expirada', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 dias atrás

      const isExpired = isPasswordExpired(oldDate, 90); // 90 dias de validade
      expect(isExpired).toBe(true);
    });

    it('deve detectar senha não expirada', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 dias atrás

      const isExpired = isPasswordExpired(recentDate, 90); // 90 dias de validade
      expect(isExpired).toBe(false);
    });
  });

  describe('daysUntilExpiration', () => {
    it('deve calcular dias até expiração', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 dias atrás

      const days = daysUntilExpiration(recentDate, 90);
      expect(days).toBe(60); // 90 - 30 = 60 dias restantes
    });
  });

  describe('checkPasswordCompromised', () => {
    it('deve retornar false para senha não comprometida (mock)', async () => {
      // Mock da função para evitar chamadas reais à API
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(''),
      });
      global.fetch = mockFetch;

      const result = await checkPasswordCompromised('MinhaSenh@123');
      expect(result).toBe(false);
    });
  });
});
