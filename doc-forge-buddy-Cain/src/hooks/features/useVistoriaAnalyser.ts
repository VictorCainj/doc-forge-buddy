import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para análise de vistoria
 * Unifica funcionalidades de análise automática de documentos
 */
export const useVistoriaAnalyser = (options: {
  documentId?: string;
  autoAnalyze?: boolean;
  confidenceThreshold?: number;
} = {}) => {
  const { documentId, autoAnalyze = true, confidenceThreshold = 0.7 } = options;
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeDocument = useCallback(async (documentData: any) => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Simular progresso da análise
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Fazer chamada para análise
      const { data, error } = await supabase.functions.invoke('analyze-vistoria', {
        body: {
          document_data: documentData,
          confidence_threshold: confidenceThreshold,
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setAnalysis(data);
      toast.success('Análise da vistoria concluída');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise';
      setError(errorMessage);
      toast.error(`Erro na análise: ${errorMessage}`);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [confidenceThreshold]);

  const generateReport = useCallback(async (analysisId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-vistoria-report', {
        body: { analysis_id: analysisId }
      });

      if (error) throw error;
      
      toast.success('Relatório gerado com sucesso');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      toast.error(`Erro ao gerar relatório: ${errorMessage}`);
      throw err;
    }
  }, []);

  const exportResults = useCallback(async (format: 'pdf' | 'json' = 'pdf') => {
    if (!analysis) return null;

    try {
      const { data, error } = await supabase.functions.invoke('export-vistoria-results', {
        body: {
          analysis_id: analysis.id,
          format,
          data: analysis,
        }
      });

      if (error) throw error;
      
      toast.success(`Resultados exportados em ${format.toUpperCase()}`);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar';
      toast.error(`Erro ao exportar: ${errorMessage}`);
      throw err;
    }
  }, [analysis]);

  // Auto-análise quando documentId muda
  useEffect(() => {
    if (autoAnalyze && documentId) {
      // Implementar lógica de auto-análise
      // Esta é uma versão simplificada
    }
  }, [documentId, autoAnalyze]);

  return {
    analysis,
    isAnalyzing,
    error,
    progress,
    analyzeDocument,
    generateReport,
    exportResults,
  };
};

export default useVistoriaAnalyser;