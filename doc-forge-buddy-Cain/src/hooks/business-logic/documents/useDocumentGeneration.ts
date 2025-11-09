import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';

// Tipos para geração de documentos
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'contract' | 'report' | 'certificate' | 'invoice' | 'custom';
  format: 'pdf' | 'docx' | 'html';
  fields: DocumentField[];
  validation: DocumentValidation;
  preview: DocumentPreview;
  version: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'file' | 'table' | 'signature';
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customValidator?: string;
  };
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  styling?: {
    width?: number;
    height?: number;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
}

export interface DocumentValidation {
  rules: ValidationRule[];
  dependencies: FieldDependency[];
  global: GlobalValidation;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  params?: any;
  message: string;
}

export interface FieldDependency {
  field: string;
  dependsOn: string;
  relation: 'required' | 'visible' | 'disabled';
  condition: string;
}

export interface GlobalValidation {
  minFields?: number;
  maxFields?: number;
  customRule?: string;
}

export interface DocumentPreview {
  template: string;
  styles: Record<string, any>;
  layout: 'single' | 'double' | 'table';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface DocumentData {
  [fieldId: string]: any;
  metadata?: {
    title?: string;
    subtitle?: string;
    author?: string;
    createdAt?: Date;
    version?: string;
  };
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  template: DocumentTemplate;
  data: DocumentData;
  status: 'draft' | 'generating' | 'ready' | 'error' | 'expired';
  format: 'pdf' | 'docx' | 'html';
  preview?: {
    url: string;
    thumbnail?: string;
    lastUpdated: Date;
  };
  download?: {
    url: string;
    size: number;
    expiresAt: Date;
  };
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface DocumentGenerationOptions {
  autoPreview?: boolean;
  validateData?: boolean;
  generateThumbnails?: boolean;
  compressOutput?: boolean;
  customStyles?: Record<string, any>;
  outputQuality?: 'low' | 'medium' | 'high';
  maxRetries?: number;
}

const DEFAULT_OPTIONS: DocumentGenerationOptions = {
  autoPreview: true,
  validateData: true,
  generateThumbnails: true,
  compressOutput: true,
  outputQuality: 'medium',
  maxRetries: 3
};

export function useDocumentGeneration(template: DocumentTemplate, options: DocumentGenerationOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  // Estados locais
  const [documentData, setDocumentData] = useState<DocumentData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Buscar templates disponíveis
  const {
    data: availableTemplates,
    isLoading: templatesLoading
  } = useQuery({
    queryKey: ['document-templates', template.category],
    queryFn: async (): Promise<DocumentTemplate[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return [template]; // Retorna apenas o template atual
    },
    enabled: !!template
  });

  // Mutação para geração de documento
  const generateDocumentMutation = useMutation({
    mutationFn: async (data: DocumentData): Promise<GeneratedDocument> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        setGenerationProgress(0);
        setIsGenerating(true);

        // Simular progresso
        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // Validação
        if (finalOptions.validateData) {
          const validation = validateDocumentData(data, template);
          setValidationErrors(validation.errors);
          setValidationWarnings(validation.warnings);
          
          if (validation.errors.length > 0) {
            throw new Error('Dados inválidos para geração do documento');
          }
        }

        // Gerar documento (simulação)
        await new Promise(resolve => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        setGenerationProgress(100);

        const generatedDoc: GeneratedDocument = {
          id: `doc-${Date.now()}`,
          templateId: template.id,
          template,
          data,
          status: 'ready',
          format: template.format,
          preview: {
            url: `data:text/html;base64,${btoa(generatePreviewHTML(data, template))}`,
            lastUpdated: new Date()
          },
          download: {
            url: `blob:generated-document-${Date.now()}`,
            size: Math.floor(Math.random() * 500000) + 100000,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          validation: {
            isValid: validationErrors.length === 0,
            errors: validationErrors,
            warnings: validationWarnings
          },
          createdBy: user?.id || 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return generatedDoc;
      } finally {
        setIsGenerating(false);
        setGenerationProgress(0);
      }
    },
    onSuccess: (doc) => {
      setGeneratedDocument(doc);
      queryClient.setQueryData(['generated-documents'], (old: GeneratedDocument[] = []) => [
        ...old,
        doc
      ]);
      
      toast({
        title: 'Documento gerado',
        description: `O documento "${template.name}" foi gerado com sucesso`,
      });
    },
    onError: (error) => {
      setGenerationProgress(0);
      toast({
        title: 'Erro na geração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  // Mutação para regenerar documento
  const regenerateDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Buscar documento existente
      const existingDoc = generatedDocument;
      if (!existingDoc || existingDoc.id !== documentId) {
        throw new Error('Documento não encontrado');
      }

      return await generateDocumentMutation.mutateAsync(existingDoc.data);
    }
  });

  // Atualizar dados do documento
  const updateDocumentData = useCallback((updates: Partial<DocumentData>) => {
    setDocumentData(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }));

    // Limpar erros de validação se necessário
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  }, [validationErrors.length]);

  // Validar dados do documento
  const validateData = useCallback((data: DocumentData = documentData): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } => {
    return validateDocumentData(data, template);
  }, [documentData, template]);

  // Gerar documento
  const generate = useCallback(async (data?: DocumentData) => {
    const dataToUse = data || documentData;
    
    // Parar geração anterior se estiver em andamento
    if (isGenerating) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    await generateDocumentMutation.mutateAsync(dataToUse);
  }, [documentData, isGenerating, generateDocumentMutation]);

  // Gerar preview
  const generatePreview = useCallback(async () => {
    if (!finalOptions.autoPreview || !generatedDocument) return;

    try {
      const previewData = {
        url: `data:text/html;base64,${btoa(generatePreviewHTML(documentData, template))}`,
        lastUpdated: new Date()
      };

      setGeneratedDocument(prev => prev ? {
        ...prev,
        preview: previewData
      } : null);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  }, [documentData, template, generatedDocument, finalOptions.autoPreview]);

  // Baixar documento
  const download = useCallback(async (format?: 'pdf' | 'docx' | 'html') => {
    if (!generatedDocument) return;

    const downloadFormat = format || generatedDocument.format;
    
    try {
      // Simular download
      const blob = new Blob(['Mock document content'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_${Date.now()}.${downloadFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: `Baixando documento em formato ${downloadFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o documento',
        variant: 'destructive'
      });
    }
  }, [generatedDocument, template, toast]);

  // Compartilhar documento
  const share = useCallback(async (options: {
    email?: string;
    message?: string;
    expireIn?: number; // horas
  }) => {
    if (!generatedDocument) return;

    try {
      // Simular compartilhamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Documento compartilhado',
        description: 'Link de compartilhamento foi enviado',
      });
    } catch (error) {
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível compartilhar o documento',
        variant: 'destructive'
      });
    }
  }, [generatedDocument, toast]);

  // Cancelar geração
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setGenerationProgress(0);
  }, []);

  // Limpar dados
  const clearData = useCallback(() => {
    setDocumentData({});
    setValidationErrors([]);
    setValidationWarnings([]);
    setGeneratedDocument(null);
  }, []);

  // Estatísticas de preenchimento
  const completionStats = useCallback(() => {
    const totalFields = template.fields.length;
    const filledFields = template.fields.filter(field => {
      const value = documentData[field.id];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return {
      total: totalFields,
      filled: filledFields,
      percentage: totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0,
      requiredFilled: template.fields
        .filter(field => field.required)
        .filter(field => {
          const value = documentData[field.id];
          return value !== undefined && value !== null && value !== '';
        }).length
    };
  }, [template, documentData]);

  return {
    // Estado
    documentData,
    generatedDocument,
    validationErrors,
    validationWarnings,
    isGenerating,
    generationProgress,
    availableTemplates,
    template,
    isLoading: templatesLoading,

    // Ações
    updateDocumentData,
    validateData,
    generate,
    generatePreview,
    download,
    share,
    cancelGeneration,
    clearData,
    regenerate: () => generatedDocument && regenerateDocumentMutation.mutateAsync(generatedDocument.id),

    // Estatísticas
    completionStats,

    // Estado das operações
    canGenerate: validationErrors.length === 0 && !isGenerating,
    isPreviewAvailable: !!generatedDocument?.preview,
    isDownloadAvailable: !!generatedDocument?.download,
    
    // Metadados
    templateVersion: template.version,
    lastUpdated: documentData.metadata?.updatedAt,
    createdAt: documentData.metadata?.createdAt
  };
}

// Funções auxiliares
function validateDocumentData(
  data: DocumentData,
  template: DocumentTemplate
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validação de campos obrigatórios
  template.fields.forEach(field => {
    const value = data[field.id];
    
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.id,
        message: `${field.label} é obrigatório`,
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
      return;
    }

    // Validação de formato
    if (value && field.validation) {
      const validation = field.validation;
      
      if (validation.minLength && value.length < validation.minLength) {
        errors.push({
          field: field.id,
          message: `${field.label} deve ter pelo menos ${validation.minLength} caracteres`,
          code: 'MIN_LENGTH',
          severity: 'error'
        });
      }

      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push({
          field: field.id,
          message: `${field.label} deve ter no máximo ${validation.maxLength} caracteres`,
          code: 'MAX_LENGTH',
          severity: 'error'
        });
      }

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: field.id,
            message: `${field.label} não está no formato válido`,
            code: 'INVALID_FORMAT',
            severity: 'error'
          });
        }
      }
    }

    // Validações específicas por tipo
    if (value && field.type === 'number') {
      if (isNaN(Number(value))) {
        errors.push({
          field: field.id,
          message: `${field.label} deve ser um número válido`,
          code: 'INVALID_NUMBER',
          severity: 'error'
        });
      }
    }

    if (value && field.type === 'date') {
      if (isNaN(Date.parse(value))) {
        errors.push({
          field: field.id,
          message: `${field.label} deve ser uma data válida`,
          code: 'INVALID_DATE',
          severity: 'error'
        });
      }
    }
  });

  // Validações de dependência
  template.validation.dependencies.forEach(dep => {
    const fieldValue = data[dep.field];
    const dependsOnValue = data[dep.dependsOn];

    // Implementar lógica de dependências
    if (dep.relation === 'required' && !fieldValue && dependsOnValue) {
      // Lógica de validação de dependência
    }
  });

  // Validações globais
  const global = template.validation.global;
  if (global.minFields) {
    const filledFields = Object.keys(data).filter(key => {
      const value = data[key];
      return value !== undefined && value !== null && value !== '';
    }).length;

    if (filledFields < global.minFields) {
      errors.push({
        field: 'global',
        message: `Preencha pelo menos ${global.minFields} campos`,
        code: 'MIN_FIELDS',
        severity: 'error'
      });
    }
  }

  return { errors, warnings };
}

function generatePreviewHTML(data: DocumentData, template: DocumentTemplate): string {
  const { preview } = template;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.metadata?.title || template.name}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: ${preview.margins.top}px ${preview.margins.right}px ${preview.margins.bottom}px ${preview.margins.left}px;
          line-height: 1.6;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .field { margin: 10px 0; }
        .required::after { content: " *"; color: red; }
      </style>
    </head>
    <body>
  `;

  // Cabeçalho
  if (data.metadata?.title) {
    html += `<div class="header"><h1>${data.metadata.title}</h1>`;
    if (data.metadata?.subtitle) {
      html += `<h3>${data.metadata.subtitle}</h3>`;
    }
    html += `</div>`;
  }

  // Conteúdo
  html += `<div class="content">`;
  
  template.fields.forEach(field => {
    const value = data[field.id];
    if (value !== undefined && value !== null && value !== '') {
      const isRequired = field.required ? 'required' : '';
      html += `
        <div class="field">
          <strong>${field.label}:</strong> 
          <span>${formatFieldValue(value, field.type)}</span>
        </div>
      `;
    }
  });
  
  html += `</div></body></html>`;
  
  return html;
}

function formatFieldValue(value: any, type: DocumentField['type']): string {
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString('pt-BR');
    case 'number':
      return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'select':
      return typeof value === 'string' ? value : value?.label || '';
    default:
      return String(value);
  }
}