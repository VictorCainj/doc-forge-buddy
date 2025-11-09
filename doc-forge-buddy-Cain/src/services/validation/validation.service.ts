/**
 * ValidationService - Serviço para validação de dados
 * Implementa validações centralizadas e regras de negócio
 */

import { ValidationRule, ValidationError } from '@/services/core/interfaces';
import { ContractFormData, DocumentType } from '@/types/domain/contract';

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
}

export interface BusinessRuleValidation {
  rule: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  applies: (data: unknown) => boolean;
  message: string;
}

export class ValidationService {
  private schemas = new Map<string, ValidationSchema>();
  private businessRules: BusinessRuleValidation[] = [];

  constructor() {
    this.registerDefaultSchemas();
    this.registerDefaultBusinessRules();
  }

  /**
   * Valida dados usando um schema
   */
  validate<T>(data: T, schemaName: string): ValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validação por campo
    for (const [field, rule] of Object.entries(schema)) {
      const value = (data as any)[field];
      const fieldErrors = this.validateField(field, value, rule);
      errors.push(...fieldErrors);
    }

    // Validação de regras de negócio
    const businessRuleResults = this.validateBusinessRules(data);
    for (const result of businessRuleResults) {
      if (result.severity === 'error') {
        errors.push({
          field: 'business',
          message: result.message,
          code: result.rule,
          severity: 'error'
        });
      } else if (result.severity === 'warning') {
        warnings.push(result.message);
      } else {
        suggestions.push(result.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Valida dados de formulário de contrato
   */
  validateContractFormData(formData: ContractFormData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validação de campos obrigatórios
    if (!formData.numeroContrato?.trim()) {
      errors.push({
        field: 'numeroContrato',
        message: 'Número do contrato é obrigatório',
        severity: 'error'
      });
    }

    if (!formData.nomeLocatario?.trim()) {
      errors.push({
        field: 'nomeLocatario',
        message: 'Nome do locatário é obrigatório',
        severity: 'error'
      });
    }

    if (!formData.enderecoImovel?.trim()) {
      errors.push({
        field: 'enderecoImovel',
        message: 'Endereço do imóvel é obrigatório',
        severity: 'error'
      });
    }

    // Validação de datas
    if (formData.dataFirmamentoContrato && formData.dataTerminoRescisao) {
      const startDate = new Date(formData.dataFirmamentoContrato);
      const endDate = new Date(formData.dataTerminoRescisao);
      
      if (endDate <= startDate) {
        errors.push({
          field: 'dataTerminoRescisao',
          message: 'Data de término deve ser posterior à data de início',
          severity: 'error'
        });
      }

      // Verificar se a duração é razoável
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 30) {
        warnings.push('Duração do contrato é muito curta (menos de 30 dias)');
      } else if (daysDiff > 3650) { // 10 anos
        warnings.push('Duração do contrato é muito longa (mais de 10 anos)');
      }
    }

    // Validação de informações de contato
    if (formData.emailLocatario && !this.isValidEmail(formData.emailLocatario)) {
      errors.push({
        field: 'emailLocatario',
        message: 'Email do locatário não é válido',
        severity: 'error'
      });
    }

    if (formData.celularLocatario && !this.isValidPhone(formData.celularLocatario)) {
      errors.push({
        field: 'celularLocatario',
        message: 'Celular do locatário não é válido',
        severity: 'error'
      });
    }

    if (formData.emailProprietario && !this.isValidEmail(formData.emailProprietario)) {
      errors.push({
        field: 'emailProprietario',
        message: 'Email do proprietário não é válido',
        severity: 'error'
      });
    }

    if (formData.celularProprietario && !this.isValidPhone(formData.celularProprietario)) {
      errors.push({
        field: 'celularProprietario',
        message: 'Celular do proprietário não é válido',
        severity: 'error'
      });
    }

    // Validação de campos condicionais
    if (formData.tipoGarantia === 'fiador' || formData.temFiador === 'sim') {
      if (!formData.nomeFiador?.trim()) {
        errors.push({
          field: 'nomeFiador',
          message: 'Nome do fiador é obrigatório quando há fiador',
          severity: 'error'
        });
      }

      if (formData.celularFiador && !this.isValidPhone(formData.celularFiador)) {
        errors.push({
          field: 'celularFiador',
          message: 'Celular do fiador não é válido',
          severity: 'error'
        });
      }
    }

    // Validação de consistência de nomes
    if (formData.nomeLocatario && formData.primeiroLocatario) {
      const firstName = this.extractFirstName(formData.nomeLocatario);
      if (firstName.toLowerCase() !== formData.primeiroLocatario.toLowerCase()) {
        warnings.push('Primeiro nome do locatário não corresponde ao nome completo');
      }
    }

    if (formData.nomeProprietario && formData.primeiroFiador) {
      const firstName = this.extractFirstName(formData.nomeProprietario);
      if (firstName.toLowerCase() !== formData.primeiroFiador.toLowerCase()) {
        warnings.push('Primeiro nome do proprietário não corresponde ao nome completo');
      }
    }

    // Sugestões
    if (formData.nomeLocatario && !formData.primeiroNomeLocatario) {
      suggestions.push('Considere preencher o primeiro nome do locatário para melhor personalização');
    }

    if (formData.nomeProprietario && !formData.primeiroNomeProprietario) {
      suggestions.push('Considere preencher o primeiro nome do proprietário para melhor personalização');
    }

    if (!formData.observacao?.trim()) {
      suggestions.push('Considere adicionar observações ao contrato');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Valida número de contrato único
   */
  async validateContractNumberUnique(contractNumber: string, excludeId?: string): Promise<ValidationResult> {
    try {
      const response = await fetch(`/api/contracts/validate-number?number=${encodeURIComponent(contractNumber)}${excludeId ? `&exclude=${excludeId}` : ''}`);
      const result = await response.json();

      if (!result.isUnique) {
        return {
          isValid: false,
          errors: [{
            field: 'numeroContrato',
            message: 'Este número de contrato já existe',
            code: 'duplicate_contract_number',
            severity: 'error'
          }],
          warnings: [],
          suggestions: []
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'numeroContrato',
          message: 'Erro ao validar número do contrato',
          code: 'validation_error',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Valida dados para renovação
   */
  validateContractRenewal(
    currentData: ContractFormData,
    renewalData: { newEndDate: string; newStartDate?: string }
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar nova data de término
    if (!renewalData.newEndDate) {
      errors.push({
        field: 'newEndDate',
        message: 'Nova data de término é obrigatória',
        severity: 'error'
      });
    } else {
      const newEndDate = new Date(renewalData.newEndDate);
      const currentEndDate = new Date(currentData.dataTerminoRescisao || '');
      
      if (newEndDate <= currentEndDate) {
        errors.push({
          field: 'newEndDate',
          message: 'Nova data de término deve ser posterior à data atual',
          severity: 'error'
        });
      }

      // Verificar se a renovação é por um período razoável
      const renewalDays = Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
      if (renewalDays < 30) {
        warnings.push('Período de renovação é muito curto (menos de 30 dias)');
      } else if (renewalDays > 3650) {
        warnings.push('Período de renovação é muito longo (mais de 10 anos)');
      }
    }

    // Validar nova data de início se fornecida
    if (renewalData.newStartDate) {
      const newStartDate = new Date(renewalData.newStartDate);
      const currentStartDate = new Date(currentData.dataFirmamentoContrato || '');
      
      if (newStartDate < currentStartDate) {
        errors.push({
          field: 'newStartDate',
          message: 'Nova data de início não pode ser anterior à data atual',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Valida dados para terminação
   */
  validateContractTermination(
    currentData: ContractFormData,
    terminationData: { terminationDate: string; reason: string; terminationType: string }
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar data de terminação
    if (!terminationData.terminationDate) {
      errors.push({
        field: 'terminationDate',
        message: 'Data de terminação é obrigatória',
        severity: 'error'
      });
    } else {
      const terminationDate = new Date(terminationData.terminationDate);
      const startDate = new Date(currentData.dataFirmamentoContrato || '');
      const endDate = new Date(currentData.dataTerminoRescisao || '');

      if (terminationDate < startDate) {
        errors.push({
          field: 'terminationDate',
          message: 'Data de terminação não pode ser anterior ao início do contrato',
          severity: 'error'
        });
      }

      // Se a terminação é posterior à data de término, é uma extensão
      if (terminationDate > endDate) {
        warnings.push('Terminação é posterior à data de término original - considere renewal');
      }
    }

    // Validar reason
    if (!terminationData.reason?.trim()) {
      errors.push({
        field: 'reason',
        message: 'Motivo da terminação é obrigatório',
        severity: 'error'
      });
    }

    // Validar tipo de terminação
    const validTypes = ['mutual', 'unilateral', 'breach', 'expiration'];
    if (!validTypes.includes(terminationData.terminationType)) {
      errors.push({
        field: 'terminationType',
        message: 'Tipo de terminação inválido',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Registra um schema de validação
   */
  registerSchema(name: string, schema: ValidationSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Registra uma regra de negócio
   */
  registerBusinessRule(rule: BusinessRuleValidation): void {
    this.businessRules.push(rule);
  }

  /**
   * Remove uma regra de negócio
   */
  removeBusinessRule(ruleName: string): void {
    this.businessRules = this.businessRules.filter(rule => rule.rule !== ruleName);
  }

  /**
   * Lista regras de negócio registradas
   */
  listBusinessRules(): BusinessRuleValidation[] {
    return [...this.businessRules];
  }

  // === Private Methods ===

  private validateField(field: string, value: unknown, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field,
        message: `${field} é obrigatório`,
        severity: 'error'
      });
      return errors; // Não validar outras regras se é obrigatório
    }

    if (value === null || value === undefined || value === '') {
      return errors; // Campo vazio e não obrigatório
    }

    // Validar length
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors.push({
        field,
        message: `${field} deve ter pelo menos ${rule.minLength} caracteres`,
        severity: 'error'
      });
    }

    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors.push({
        field,
        message: `${field} deve ter no máximo ${rule.maxLength} caracteres`,
        severity: 'error'
      });
    }

    // Validar pattern
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push({
        field,
        message: rule.message || `${field} não está no formato correto`,
        severity: 'error'
      });
    }

    // Validar custom
    if (rule.custom) {
      const customError = rule.custom(value.toString());
      if (customError) {
        errors.push({
          field,
          message: customError,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private validateBusinessRules(data: unknown): BusinessRuleValidation[] {
    return this.businessRules
      .filter(rule => rule.applies(data))
      .map(rule => ({
        rule: rule.rule,
        description: rule.description,
        severity: rule.severity,
        applies: rule.applies,
        message: rule.message
      }));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Verifica se tem 10 ou 11 dígitos (formato brasileiro)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0] || '';
  }

  private registerDefaultSchemas(): void {
    // Schema para dados básicos de contrato
    this.registerSchema('contract_basic', {
      numeroContrato: { required: true, minLength: 3, maxLength: 50 },
      nomeLocatario: { required: true, minLength: 2, maxLength: 200 },
      enderecoImovel: { required: true, minLength: 5, maxLength: 500 },
      emailLocatario: { 
        required: false, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email inválido'
      },
      celularLocatario: { 
        required: false, 
        pattern: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
        message: 'Celular inválido'
      }
    });

    // Schema para dados de fiador
    this.registerSchema('contract_guarantor', {
      nomeFiador: { required: false, minLength: 2, maxLength: 200 },
      celularFiador: { 
        required: false, 
        pattern: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
        message: 'Celular do fiador inválido'
      }
    });
  }

  private registerDefaultBusinessRules(): void {
    // Regra: Data de início não pode ser no futuro
    this.registerBusinessRule({
      rule: 'start_date_not_future',
      description: 'Data de início não pode ser no futuro',
      severity: 'error',
      applies: (data) => {
        const formData = data as ContractFormData;
        return formData.dataFirmamentoContrato !== undefined;
      },
      message: 'Data de início do contrato não pode ser no futuro'
    });

    // Regra: Verificar se tem informações de contato do locatário
    this.registerBusinessRule({
      rule: 'locatario_contact_info',
      description: 'Locatário deve ter pelo menos um meio de contato',
      severity: 'warning',
      applies: (data) => {
        const formData = data as ContractFormData;
        return !formData.emailLocatario && !formData.celularLocatario;
      },
      message: 'Locatário deve ter pelo menos email ou celular informado'
    });

    // Regra: Verificar informações de fiador quando necessário
    this.registerBusinessRule({
      rule: 'guarantor_required',
      description: 'Fiador é obrigatório para alguns tipos de garantia',
      severity: 'warning',
      applies: (data) => {
        const formData = data as ContractFormData;
        return formData.tipoGarantia === 'fiador' && !formData.nomeFiador;
      },
      message: 'Fiador é obrigatório quando o tipo de garantia é fiador'
    });
  }
}