import { describe, it, expect } from 'vitest';
import {
  replaceTemplateVariables,
  isMultipleLocatarios,
  isTerceiraPessoa,
} from '@/utils/templateProcessor';

describe('templateProcessor', () => {
  describe('replaceTemplateVariables', () => {
    it('deve substituir variáveis simples', () => {
      const template = 'Olá, {{nome}}!';
      const data = { nome: 'João' };

      const result = replaceTemplateVariables(template, data);

      expect(result).toBe('Olá, João!');
    });

    it('deve substituir múltiplas variáveis', () => {
      const template = '{{nome}} mora em {{cidade}}, {{estado}}';
      const data = {
        nome: 'Maria',
        cidade: 'São Paulo',
        estado: 'SP',
      };

      const result = replaceTemplateVariables(template, data);

      expect(result).toBe('Maria mora em São Paulo, SP');
    });

    it('deve manter variáveis não encontradas', () => {
      const template = '{{nome}} tem {{idade}} anos';
      const data = { nome: 'Pedro' };

      const result = replaceTemplateVariables(template, data);

      expect(result).toContain('Pedro');
      expect(result).toContain('{{idade}}');
    });

    it('deve lidar com valores vazios', () => {
      const template = 'Nome: {{nome}}';
      const data = { nome: '' };

      const result = replaceTemplateVariables(template, data);

      expect(result).toBe('Nome: ');
    });

    it('deve lidar com valores numéricos', () => {
      const template = 'Preço: R$ {{preco}}';
      const data = { preco: '1500.50' };

      const result = replaceTemplateVariables(template, data);

      expect(result).toBe('Preço: R$ 1500.50');
    });

    it('deve processar condicionais simples', () => {
      const template =
        '{{#if ativo}}Ativo{{/if}}{{#unless ativo}}Inativo{{/unless}}';
      const dataAtivo = { ativo: true };
      const dataInativo = { ativo: false };

      const resultAtivo = replaceTemplateVariables(template, dataAtivo);
      const resultInativo = replaceTemplateVariables(template, dataInativo);

      expect(resultAtivo).toContain('Ativo');
      expect(resultInativo).toContain('Inativo');
    });

    it('deve sanitizar HTML injetado nas variáveis', () => {
      const template = 'Mensagem: {{mensagem}}';
      const data = { mensagem: '<script>alert("XSS")</script>' };

      const result = replaceTemplateVariables(template, data);

      // A função deve escapar HTML por padrão
      expect(result).not.toContain('<script>');
    });
  });

  describe('isMultipleLocatarios', () => {
    it('deve identificar múltiplos locatários por vírgula', () => {
      const data = {
        nomeLocatario: 'João Silva, Maria Santos',
      };

      expect(isMultipleLocatarios(data)).toBe(true);
    });

    it('deve identificar múltiplos locatários por "e"', () => {
      const data = {
        nomeLocatario: 'João Silva e Maria Santos',
      };

      expect(isMultipleLocatarios(data)).toBe(true);
    });

    it('deve retornar false para locatário único', () => {
      const data = {
        nomeLocatario: 'João Silva',
      };

      expect(isMultipleLocatarios(data)).toBe(false);
    });

    it('deve lidar com campo vazio', () => {
      const data = {
        nomeLocatario: '',
      };

      expect(isMultipleLocatarios(data)).toBe(false);
    });

    it('deve lidar com campo ausente', () => {
      const data = {};

      expect(isMultipleLocatarios(data)).toBe(false);
    });
  });

  describe('isTerceiraPessoa', () => {
    it('deve identificar terceira pessoa quando especificado', () => {
      const data = {
        terceiraPessoa: 'true',
      };

      expect(isTerceiraPessoa(data)).toBe(true);
    });

    it('deve identificar terceira pessoa por nome diferente', () => {
      const data = {
        nomeLocatario: 'João Silva',
        nomeRecebedor: 'Maria Santos',
      };

      expect(isTerceiraPessoa(data)).toBe(true);
    });

    it('deve retornar false quando não é terceira pessoa', () => {
      const data = {
        terceiraPessoa: 'false',
        nomeLocatario: 'João Silva',
        nomeRecebedor: 'João Silva',
      };

      expect(isTerceiraPessoa(data)).toBe(false);
    });

    it('deve lidar com campos ausentes', () => {
      const data = {};

      expect(isTerceiraPessoa(data)).toBe(false);
    });
  });
});
