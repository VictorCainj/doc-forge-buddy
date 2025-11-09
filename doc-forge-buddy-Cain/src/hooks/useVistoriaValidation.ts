import { useCallback } from 'react';
import { ApontamentoVistoria, DadosVistoria } from '@/types/vistoria';
import { validateImages } from '@/utils/imageValidation';

/**
 * Interface para resultados de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Interface para validações de apontamento
 */
export interface ApontamentoValidation {
  isValid: boolean;
  required: ValidationResult;
  photos: ValidationResult;
  budget?: ValidationResult;
  classification?: ValidationResult;
  overall: string[];
}

/**
 * Interface para validações completas
 */
export interface VistoriaValidation {
  dadosVistoria: ValidationResult;
  apontamentos: ApontamentoValidation[];
  overall: string[];
  hasBlockingErrors: boolean;
}

/**
 * Hook para validações do formulário de vistoria
 */
export const useVistoriaValidation = () => {
  /**
   * Valida dados básicos da vistoria
   */
  const validateDadosVistoria = useCallback((dados: DadosVistoria): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dados.locatario?.trim()) {
      errors.push('Nome do locatário é obrigatório');
    }

    if (!dados.endereco?.trim()) {
      errors.push('Endereço é obrigatório');
    }

    if (!dados.dataVistoria?.trim()) {
      errors.push('Data da vistoria é obrigatória');
    } else {
      // Validar formato de data
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!dateRegex.test(dados.dataVistoria)) {
        errors.push('Data da vistoria deve estar no formato DD/MM/AAAA');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  /**
   * Valida arquivos de imagem
   */
  const validateImageFiles = useCallback(async (
    files: File[],
    options: {
      maxSize?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ) => {
    const { maxSize = 10 * 1024 * 1024, maxWidth = 4096, maxHeight = 4096 } = options;

    const validationResults = await validateImages(files, {
      maxSize,
      maxWidth,
      maxHeight,
    });

    const validFiles: File[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    validationResults.forEach((result, file) => {
      if (result.valid) {
        validFiles.push(file);
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      validFiles,
      errors,
      warnings,
    };
  }, []);

  /**
   * Valida apontamento individual
   */
  const validateApontamento = useCallback((
    apontamento: Partial<ApontamentoVistoria>,
    documentMode: 'analise' | 'orcamento' = 'analise'
  ): ApontamentoValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validação de campos obrigatórios
    const requiredErrors: string[] = [];
    if (!apontamento.ambiente?.trim()) {
      requiredErrors.push('Ambiente é obrigatório');
    }
    if (!apontamento.descricao?.trim()) {
      requiredErrors.push('Descrição é obrigatória');
    }
    if (documentMode === 'orcamento' && !apontamento.descricaoServico?.trim()) {
      requiredErrors.push('Descrição do serviço é obrigatória no modo orçamento');
    }

    // Validação de fotos
    const photoErrors: string[] = [];
    const fotoInicial = apontamento.vistoriaInicial?.fotos || [];
    const fotoFinal = apontamento.vistoriaFinal?.fotos || [];

    if (fotoInicial.length === 0) {
      photoErrors.push('É necessário pelo menos uma foto da vistoria inicial');
    }
    if (fotoFinal.length === 0) {
      photoErrors.push('É necessário pelo menos uma foto da vistoria final');
    }

    // Validações de fotos (verificar se são File válidos)
    const validFotoInicial = fotoInicial.filter(foto => {
      if (foto.isFromDatabase) {
        return foto.url && foto.url.length > 0;
      }
      return foto instanceof File && foto.size > 0;
    });

    const validFotoFinal = fotoFinal.filter(foto => {
      if (foto.isFromDatabase) {
        return foto.url && foto.url.length > 0;
      }
      return foto instanceof File && foto.size > 0;
    });

    if (validFotoInicial.length !== fotoInicial.length) {
      photoErrors.push(`${fotoInicial.length - validFotoInicial.length} foto(s) da vistoria inicial é/são inválida(s)`);
    }
    if (validFotoFinal.length !== fotoFinal.length) {
      photoErrors.push(`${fotoFinal.length - validFotoFinal.length} foto(s) da vistoria final é/são inválida(s)`);
    }

    // Validação de orçamento (se no modo orçamento)
    const budgetErrors: string[] = [];
    if (documentMode === 'orcamento') {
      if (!apontamento.tipo) {
        budgetErrors.push('Tipo de orçamento é obrigatório');
      }
      if (typeof apontamento.valor !== 'number' || apontamento.valor <= 0) {
        budgetErrors.push('Valor deve ser maior que zero');
      }
      if (typeof apontamento.quantidade !== 'number' || apontamento.quantidade <= 0) {
        budgetErrors.push('Quantidade deve ser maior que zero');
      }
    }

    // Validação de classificação (se no modo análise)
    const classificationErrors: string[] = [];
    if (documentMode === 'analise') {
      if (!apontamento.classificacao) {
        classificationErrors.push('Classificação é obrigatória no modo análise');
      }
    }

    // Compilar erros e avisos
    if (requiredErrors.length > 0) {
      errors.push(...requiredErrors);
    }
    if (photoErrors.length > 0) {
      errors.push(...photoErrors);
    }
    if (budgetErrors.length > 0) {
      errors.push(...budgetErrors);
    }
    if (classificationErrors.length > 0) {
      errors.push(...classificationErrors);
    }

    // Avisos
    if (!apontamento.subtitulo?.trim()) {
      warnings.push('Subtítulo não informado - ajudará na organização');
    }
    if (!apontamento.observacao?.trim()) {
      warnings.push('Análise técnica não informada - recomendada para documentação');
    }
    if (documentMode === 'orcamento' && !apontamento.vistoriaInicial?.descritivoLaudo?.trim()) {
      warnings.push('Descritivo do laudo de entrada não informado - recomendado para orçamento');
    }

    return {
      isValid: errors.length === 0,
      required: {
        isValid: requiredErrors.length === 0,
        errors: requiredErrors,
        warnings: [],
      },
      photos: {
        isValid: photoErrors.length === 0,
        errors: photoErrors,
        warnings: [],
      },
      budget: documentMode === 'orcamento' ? {
        isValid: budgetErrors.length === 0,
        errors: budgetErrors,
        warnings: [],
      } : undefined,
      classification: documentMode === 'analise' ? {
        isValid: classificationErrors.length === 0,
        errors: classificationErrors,
        warnings: [],
      } : undefined,
      overall: [...errors, ...warnings],
    };
  }, []);

  /**
   * Valida lista completa de apontamentos
   */
  const validateApontamentosList = useCallback((
    apontamentos: ApontamentoVistoria[],
    documentMode: 'analise' | 'orcamento' = 'analise'
  ): ApontamentoValidation[] => {
    return apontamentos.map(apontamento => validateApontamento(apontamento, documentMode));
  }, [validateApontamento]);

  /**
   * Valida estado completo da vistoria
   */
  const validateVistoria = useCallback((
    dados: DadosVistoria,
    apontamentos: ApontamentoVistoria[],
    documentMode: 'analise' | 'orcamento' = 'analise'
  ): VistoriaValidation => {
    const dadosValidation = validateDadosVistoria(dados);
    const apontamentosValidation = validateApontamentosList(apontamentos, documentMode);
    
    const overall: string[] = [];
    const hasBlockingErrors = !dadosValidation.isValid;

    if (!dadosValidation.isValid) {
      overall.push(...dadosValidation.errors);
    }

    // Verificar apontamentos com erros bloqueantes
    const invalidApontamentos = apontamentosValidation.filter(val => !val.isValid);
    if (invalidApontamentos.length > 0) {
      overall.push(`${invalidApontamentos.length} apontamento(s) com erro(s) de validação`);
      invalidApontamentos.forEach((validation, index) => {
        if (validation.required.errors.length > 0) {
          overall.push(`Apontamento ${index + 1}: ${validation.required.errors.join(', ')}`);
        }
        if (validation.photos.errors.length > 0) {
          overall.push(`Apontamento ${index + 1}: ${validation.photos.errors.join(', ')}`);
        }
      });
      hasBlockingErrors = true;
    }

    // Verificar se há apontamentos
    if (apontamentos.length === 0) {
      overall.push('Nenhum apontamento foi adicionado à vistoria');
    }

    return {
      dadosVistoria: dadosValidation,
      apontamentos: apontamentosValidation,
      overall,
      hasBlockingErrors,
    };
  }, [validateDadosVistoria, validateApontamentosList]);

  /**
   * Valida se pode salvar a análise
   */
  const canSaveAnalysis = useCallback((
    dados: DadosVistoria,
    apontamentos: ApontamentoVistoria[],
    documentMode: 'analise' | 'orcamento' = 'analise'
  ): { canSave: boolean; reason?: string } => {
    const validation = validateVistoria(dados, apontamentos, documentMode);
    
    if (validation.hasBlockingErrors) {
      return {
        canSave: false,
        reason: '存在 erros de validação que impedem o salvamento',
      };
    }

    if (apontamentos.length === 0) {
      return {
        canSave: false,
        reason: 'Adicione pelo menos um apontamento antes de salvar',
      };
    }

    return { canSave: true };
  }, [validateVistoria]);

  /**
   * Valida se pode gerar documento
   */
  const canGenerateDocument = useCallback((
    dados: DadosVistoria,
    apontamentos: ApontamentoVistoria[],
    documentMode: 'analise' | 'orcamento' = 'analise'
  ): { canGenerate: boolean; reason?: string } => {
    const validation = validateVistoria(dados, apontamentos, documentMode);
    
    if (validation.hasBlockingErrors) {
      return {
        canGenerate: false,
        reason: '存在 erros de validação que impedem a geração do documento',
      };
    }

    if (apontamentos.length === 0) {
      return {
        canGenerate: false,
        reason: 'Adicione pelo menos um apontamento para gerar o documento',
      };
    }

    return { canGenerate: true };
  }, [validateVistoria]);

  return {
    // Validações individuais
    validateDadosVistoria,
    validateApontamento,
    validateImageFiles,
    
    // Validações de lista
    validateApontamentosList,
    validateVistoria,
    
    // Validações condicionais
    canSaveAnalysis,
    canGenerateDocument,
  };
};

export default useVistoriaValidation;