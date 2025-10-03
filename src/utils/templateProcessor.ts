/**
 * Processador de templates centralizado
 * Elimina duplicação na lógica de processamento de templates
 */

import { DateHelpers } from './dateHelpers';

export interface TemplateData {
  [key: string]: string | undefined;
}

export class TemplateProcessor {
  /**
   * Processa condicionais Handlebars {{#eq variable "value"}}
   */
  static processEqualityConditionals(template: string, data: TemplateData): string {
    return template.replace(
      /\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g,
      (_, variable, expectedValue, content) => {
        const actualValue = data[variable];
        return actualValue === expectedValue ? content : '';
      }
    );
  }

  /**
   * Processa condicionais Handlebars {{#if}} com {{#else}}
   */
  static processIfElseConditionals(template: string, data: TemplateData): string {
    return template.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, variable, ifContent, elseContent) => {
        const value = data[variable];
        return value && value.trim() ? ifContent : elseContent;
      }
    );
  }

  /**
   * Processa condicionais Handlebars {{#if}} simples (sem else)
   */
  static processIfConditionals(template: string, data: TemplateData): string {
    return template.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, variable, content) => {
        const value = data[variable];
        return value && value.trim() ? content : '';
      }
    );
  }

  /**
   * Processa condicionais Handlebars {{#unless}}
   */
  static processUnlessConditionals(template: string, data: TemplateData): string {
    return template.replace(
      /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      (_, variable, content) => {
        const value = data[variable];
        return !value || !value.trim() ? content : '';
      }
    );
  }

  /**
   * Processa todos os tipos de condicionais Handlebars
   */
  static processHandlebarsConditionals(template: string, data: TemplateData): string {
    let result = template;
    
    // Processar na ordem correta para evitar conflitos
    result = this.processEqualityConditionals(result, data);
    result = this.processIfElseConditionals(result, data);
    result = this.processIfConditionals(result, data);
    result = this.processUnlessConditionals(result, data);
    
    return result;
  }

  /**
   * Substitui variáveis simples {{variable}}
   */
  static replaceVariables(template: string, data: TemplateData): string {
    return Object.entries(data).reduce((result, [key, value]) => {
      const placeholder = `{{${key}}}`;
      let formattedValue = value || '';

      // Para campos de observação vazios, não exibir placeholder
      if (!value && key === 'observacao') {
        formattedValue = '';
      } else if (!value) {
        formattedValue = `[${key.toUpperCase()}]`;
      }

      // Formatar datas automaticamente
      if (this.isDateField(key) && value && value.trim() !== '') {
        formattedValue = DateHelpers.convertDateToBrazilian(value);
      }

      return result.replace(new RegExp(placeholder, 'g'), formattedValue);
    }, template);
  }

  /**
   * Verifica se um campo é de data baseado no nome
   */
  static isDateField(fieldName: string): boolean {
    const dateKeywords = ['data', 'date', 'vencimento', 'prazo', 'inicio', 'fim', 'termino'];
    const lowerFieldName = fieldName.toLowerCase();
    return dateKeywords.some(keyword => lowerFieldName.includes(keyword));
  }

  /**
   * Processa loops Handlebars {{#each}}
   */
  static processEachLoops(template: string, data: TemplateData): string {
    return template.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (_, arrayName, content) => {
        const arrayData = data[arrayName];
        if (!arrayData) return '';

        try {
          const items = JSON.parse(arrayData);
          if (!Array.isArray(items)) return '';

          return items.map((item, index) => {
            let itemContent = content;
            // Substituir {{this}} pelo item atual
            itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
            // Substituir {{@index}} pelo índice
            itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
            return itemContent;
          }).join('');
        } catch {
          return '';
        }
      }
    );
  }

  /**
   * Aplica formatação especial a campos específicos
   */
  static applySpecialFormatting(template: string, data: TemplateData): string {
    let result = template;

    // Formatar valores monetários
    result = result.replace(/\{\{currency\s+(\w+)\}\}/g, (_, fieldName) => {
      const value = data[fieldName];
      if (!value) return '[VALOR]';
      
      const numericValue = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (isNaN(numericValue)) return value;
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue);
    });

    // Formatar números
    result = result.replace(/\{\{number\s+(\w+)\}\}/g, (_, fieldName) => {
      const value = data[fieldName];
      if (!value) return '[NÚMERO]';
      
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return value;
      
      return new Intl.NumberFormat('pt-BR').format(numericValue);
    });

    // Formatar texto em maiúsculas
    result = result.replace(/\{\{upper\s+(\w+)\}\}/g, (_, fieldName) => {
      const value = data[fieldName];
      return value ? value.toUpperCase() : `[${fieldName.toUpperCase()}]`;
    });

    // Formatar texto em minúsculas
    result = result.replace(/\{\{lower\s+(\w+)\}\}/g, (_, fieldName) => {
      const value = data[fieldName];
      return value ? value.toLowerCase() : `[${fieldName.toLowerCase()}]`;
    });

    return result;
  }

  /**
   * Processa template completo com todas as funcionalidades
   */
  static processTemplate(template: string, data: TemplateData): string {
    if (!template || typeof template !== 'string') {
      return '';
    }

    let result = template;
    
    // Processar na ordem correta
    result = this.processEachLoops(result, data);
    result = this.processHandlebarsConditionals(result, data);
    result = this.applySpecialFormatting(result, data);
    result = this.replaceVariables(result, data);
    
    return result;
  }

  /**
   * Valida se um template tem sintaxe válida
   */
  static validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar se todas as tags de abertura têm fechamento
    const openTags = template.match(/\{\{#\w+.*?\}\}/g) || [];
    const closeTags = template.match(/\{\{\/\w+\}\}/g) || [];
    
    if (openTags.length !== closeTags.length) {
      errors.push('Tags de abertura e fechamento não coincidem');
    }

    // Verificar sintaxe de condicionais
    const invalidConditionals = template.match(/\{\{#\w+[^}]*[^}]\}\}/g);
    if (invalidConditionals) {
      errors.push('Sintaxe inválida em condicionais');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extrai todas as variáveis usadas no template
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extrair variáveis simples {{variable}}
    const simpleVars = template.match(/\{\{(?!#|\/|\w+\s)(\w+)\}\}/g) || [];
    simpleVars.forEach(match => {
      const variable = match.replace(/[{}]/g, '');
      variables.add(variable);
    });

    // Extrair variáveis de condicionais {{#if variable}}
    const conditionalVars = template.match(/\{\{#(?:if|unless|eq)\s+(\w+)/g) || [];
    conditionalVars.forEach(match => {
      const variable = match.replace(/\{\{#(?:if|unless|eq)\s+/, '');
      variables.add(variable);
    });

    return Array.from(variables);
  }

  /**
   * Cria dados de exemplo para um template
   */
  static createSampleData(template: string): TemplateData {
    const variables = this.extractVariables(template);
    const sampleData: TemplateData = {};

    variables.forEach(variable => {
      if (this.isDateField(variable)) {
        sampleData[variable] = DateHelpers.getCurrentDateBrazilian();
      } else if (variable.toLowerCase().includes('nome')) {
        sampleData[variable] = 'Nome de Exemplo';
      } else if (variable.toLowerCase().includes('endereco')) {
        sampleData[variable] = 'Endereço de Exemplo, 123';
      } else if (variable.toLowerCase().includes('valor')) {
        sampleData[variable] = 'R$ 1.000,00';
      } else {
        sampleData[variable] = `Exemplo ${variable}`;
      }
    });

    return sampleData;
  }
}
