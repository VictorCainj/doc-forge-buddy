import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para análise de orçamentos
 * Unifica funcionalidades de análise de custos e propostas
 */
export const useBudgetAnalyzer = (options: {
  currency?: string;
  includeTaxes?: boolean;
  analysisType?: 'simple' | 'detailed' | 'comparative';
} = {}) => {
  const { 
    currency = 'BRL', 
    includeTaxes = true, 
    analysisType = 'detailed' 
  } = options;
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBudget = useCallback(async (budgetData: any) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => [...prev, data]);
      toast.success('Orçamento criado com sucesso');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar orçamento';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
      throw err;
    }
  }, []);

  const analyzeBudget = useCallback(async (budgetId: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-budget', {
        body: {
          budget_id: budgetId,
          currency,
          include_taxes: includeTaxes,
          analysis_type: analysisType,
        }
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success('Análise de orçamento concluída');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currency, includeTaxes, analysisType]);

  const compareBudgets = useCallback(async (budgetIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('compare-budgets', {
        body: {
          budget_ids: budgetIds,
          currency,
        }
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success('Comparação de orçamentos concluída');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na comparação';
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currency]);

  const getRecommendations = useCallback(async (analysisId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('budget-recommendations', {
        body: { analysis_id: analysisId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar recomendações';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    budgets,
    analysis,
    isAnalyzing,
    error,
    createBudget,
    analyzeBudget,
    compareBudgets,
    getRecommendations,
  };
};

export default useBudgetAnalyzer;