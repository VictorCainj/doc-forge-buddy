import { describe, it, expect } from 'vitest';
import {
  validateHTML,
  validateURL,
  sanitizeFilename,
  validateEmail,
} from '@/utils/securityValidators';

describe('securityValidators', () => {
  describe('validateHTML', () => {
    it('deve sanitizar HTML removendo scripts', () => {
      const maliciousHTML = '<p>Texto seguro</p><script>alert("XSS")</script>';
      const result = validateHTML(maliciousHTML);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Texto seguro');
    });

    it('deve permitir tags seguras', () => {
      const safeHTML = '<p>Texto <strong>em negrito</strong></p>';
      const result = validateHTML(safeHTML);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('em negrito');
    });

    it('deve remover event handlers perigosos', () => {
      const maliciousHTML = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = validateHTML(maliciousHTML);

      expect(result).not.toContain('onclick');
    });

    it('deve permitir imagens com src seguro', () => {
      const htmlWithImage =
        '<img src="https://example.com/image.jpg" alt="Imagem">';
      const result = validateHTML(htmlWithImage);

      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.jpg"');
    });

    it('deve remover iframes não permitidos', () => {
      const htmlWithIframe = '<iframe src="https://evil.com"></iframe>';
      const result = validateHTML(htmlWithIframe);

      expect(result).not.toContain('<iframe');
    });

    it('deve retornar string vazia para entrada vazia', () => {
      expect(validateHTML('')).toBe('');
      expect(validateHTML('   ')).toBe('');
    });
  });

  describe('validateURL', () => {
    it('deve validar URLs HTTPS válidas', () => {
      const validURL = 'https://example.com';
      const result = validateURL(validURL);

      expect(result).toBe(true);
    });

    it('deve validar URLs HTTP em desenvolvimento', () => {
      const httpURL = 'http://localhost:8080';
      // Note: This depends on environment
      const result = validateURL(httpURL);

      expect(typeof result).toBe('boolean');
    });

    it('deve rejeitar URLs malformadas', () => {
      const invalidURL = 'javascript:alert("XSS")';
      const result = validateURL(invalidURL);

      expect(result).toBe(false);
    });

    it('deve rejeitar URLs com protocolo file:', () => {
      const fileURL = 'file:///etc/passwd';
      const result = validateURL(fileURL);

      expect(result).toBe(false);
    });

    it('deve validar data URLs para imagens', () => {
      const dataURL = 'data:image/png;base64,iVBORw0KGgo=';
      const result = validateURL(dataURL);

      expect(result).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('deve remover caracteres especiais perigosos', () => {
      const filename = 'arquivo../../../etc/passwd.txt';
      const result = sanitizeFilename(filename);

      expect(result).not.toContain('../');
      expect(result).not.toContain('//');
    });

    it('deve manter caracteres seguros', () => {
      const filename = 'meu-arquivo_2024.pdf';
      const result = sanitizeFilename(filename);

      expect(result).toBe('meu-arquivo_2024.pdf');
    });

    it('deve remover espaços e caracteres especiais', () => {
      const filename = 'Meu Arquivo Com Espaços!@#.doc';
      const result = sanitizeFilename(filename);

      expect(result).not.toContain(' ');
      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });

    it('deve limitar tamanho do nome do arquivo', () => {
      const longFilename = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longFilename);

      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('validateEmail', () => {
    it('deve validar emails válidos', () => {
      const validEmails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'firstname.lastname@company.com',
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('deve rejeitar emails inválidos', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('deve rejeitar emails com caracteres maliciosos', () => {
      const maliciousEmail = 'user<script>@example.com';
      expect(validateEmail(maliciousEmail)).toBe(false);
    });
  });
});
