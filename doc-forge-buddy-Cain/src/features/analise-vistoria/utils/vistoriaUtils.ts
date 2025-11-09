import { validateImages } from '@/utils/imageValidation';

// Tipos para validação de imagens
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ImageValidationOptions {
  maxSize: number;
  maxWidth: number;
  maxHeight: number;
}

// Validação de imagens específica para vistoria
export const validateVistoriaImages = async (
  files: File[],
  options: ImageValidationOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 4096,
    maxHeight: 4096,
  }
): Promise<Map<File, ImageValidationResult>> => {
  return validateImages(files, options);
};

// Formatação de valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Cálculo de subtotal
export const calculateSubtotal = (valor: number, quantidade: number): number => {
  return valor * quantidade;
};

// Geração de ID único para apontamentos
export const generateApontamentoId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Validação de campos obrigatórios
export const validateApontamento = (apontamento: {
  ambiente?: string;
  descricao?: string;
  descricaoServico?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!apontamento.ambiente?.trim()) {
    errors.push('Ambiente é obrigatório');
  }

  if (!apontamento.descricao?.trim()) {
    errors.push('Descrição é obrigatória');
  }

  if (!apontamento.descricaoServico?.trim()) {
    errors.push('Descrição do serviço é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Processamento de imagens para análise
export const processImagesForAnalysis = async (
  fotos: (File | {
    name: string;
    size: number;
    type: string;
    lastModified?: number;
    base64?: string;
    isFromDatabase?: boolean;
    isExternal?: boolean;
    url?: string;
    image_serial?: string;
  })[]
): Promise<string[]> => {
  const base64Images: string[] = [];

  for (const foto of fotos) {
    if (foto instanceof File) {
      // Se é um File, converter para base64
      const base64 = await fileToBase64(foto);
      base64Images.push(base64);
    } else if (foto.url) {
      // Se é uma imagem do banco ou externa
      if (foto.url.startsWith('data:image/')) {
        // Já é base64
        base64Images.push(foto.url);
      } else {
        // URL normal, converter para base64
        try {
          const response = await fetch(foto.url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          base64Images.push(base64);
        } catch (error) {
          console.error('Erro ao converter imagem:', error);
          throw new Error(`Erro ao processar imagem: ${foto.name}`);
        }
      }
    }
  }

  return base64Images;
};

// Helper para converter File para base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Verificação se imagem é válida
export const isValidImage = (file: File | any): boolean => {
  if (file instanceof File) {
    return file.size > 0 && file.type.startsWith('image/');
  }
  
  if (file && typeof file === 'object') {
    if (file.isFromDatabase) {
      return file.url && file.url.length > 0;
    }
    if (file.isExternal) {
      return file.url && file.url.length > 0;
    }
  }
  
  return false;
};

// Extração de informações do contrato
export const extractContractInfo = (contract: {
  form_data: Record<string, string>;
  title?: string;
}) => {
  const formData = contract.form_data || {};
  
  // Buscar dados do locatário
  const locatario =
    formData.locatario ||
    formData.nome_locatario ||
    formData.nomeLocatario ||
    formData.inquilino ||
    formData.nome_inquilino ||
    formData.nome ||
    '';

  // Buscar dados do endereço
  const endereco =
    formData.endereco ||
    formData.endereco_imovel ||
    formData.enderecoImovel ||
    formData.endereco_completo ||
    formData.logradouro ||
    formData.rua ||
    '';

  // Tentar extrair do título se não encontrar nos dados
  let locatarioFinal = locatario;
  if (!locatarioFinal && contract.title) {
    const match = contract.title.match(/[-–]\s*(.+?)(?:\s*[-–]|$)/);
    if (match) locatarioFinal = match[1].trim();
  }

  return {
    locatario: locatarioFinal || 'Não informado',
    endereco: endereco || 'Não informado',
  };
};

// Estatísticas dos apontamentos
export const getApontamentosStats = (apontamentos: any[]) => {
  const total = apontamentos.length;
  const comClassificacao = apontamentos.filter(a => a.classificacao).length;
  const semClassificacao = total - comClassificacao;
  
  const responsabilidade = apontamentos.filter(a => a.classificacao === 'responsabilidade').length;
  const revisao = apontamentos.filter(a => a.classificacao === 'revisao').length;
  
  const totalValor = apontamentos.reduce((sum, a) => {
    return sum + ((a.valor || 0) * (a.quantidade || 0));
  }, 0);
  
  const porTipo = {
    material: apontamentos.filter(a => a.tipo === 'material').length,
    mao_de_obra: apontamentos.filter(a => a.tipo === 'mao_de_obra').length,
    ambos: apontamentos.filter(a => a.tipo === 'ambos').length,
  };

  return {
    total,
    comClassificacao,
    semClassificacao,
    responsabilidade,
    revisao,
    totalValor,
    porTipo,
  };
};