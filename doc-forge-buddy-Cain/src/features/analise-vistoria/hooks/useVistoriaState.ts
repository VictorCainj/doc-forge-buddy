import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import { useVistoriaImages } from '@/hooks/useVistoriaImages';
import { usePrestadores } from '@/hooks/usePrestadores';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { log } from '@/utils/logger';
import {
  ApontamentoVistoria,
  DadosVistoria,
  VistoriaAnaliseWithImages,
  Contract,
  VistoriaState,
  BudgetItemType,
} from '../types/vistoria';
import { deduplicateImagesBySerial } from '@/utils/imageSerialGenerator';

export const useVistoriaState = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ contractId?: string }>();
  const { user } = useAuth();
  const {
    correctText,
    extractApontamentos,
    compareVistoriaImages,
    isLoading: isAILoading,
    error: aiError,
  } = useOpenAI();
  const { fileToBase64, base64ToFile } = useVistoriaImages();
  const { prestadores } = usePrestadores();

  // Estados do componente
  const [apontamentos, setApontamentos] = useState<ApontamentoVistoria[]>([]);
  const [currentApontamento, setCurrentApontamento] = useState<
    Partial<
      ApontamentoVistoria & {
        tipo?: BudgetItemType;
        valor?: number;
        quantidade?: number;
      }
    >
  >({
    ambiente: '',
    subtitulo: '',
    descricao: '',
    descricaoServico: '',
    vistoriaInicial: { fotos: [], descritivoLaudo: '' },
    vistoriaFinal: { fotos: [] },
    observacao: '',
    classificacao: undefined,
    tipo: 'material',
    valor: 0,
    quantidade: 0,
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dadosVistoria, setDadosVistoria] = useState<DadosVistoria>({
    locatario: '',
    endereco: '',
    dataVistoria: '',
  });
  const [loading, setLoading] = useState(true);
  const [editingApontamento, setEditingApontamento] = useState<string | null>(null);
  const [savedAnaliseId, setSavedAnaliseId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnaliseId, setEditingAnaliseId] = useState<string | null>(null);
  const [existingAnaliseId, setExistingAnaliseId] = useState<string | null>(null);
  const [hasExistingAnalise, setHasExistingAnalise] = useState(false);
  const [loadingExistingAnalise, setLoadingExistingAnalise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentMode, setDocumentMode] = useState<'analise' | 'orcamento'>('analise');
  const [componentError, setComponentError] = useState<string | null>(null);
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<string>('');
  const [extractionText, setExtractionText] = useState('');
  const [showExtractionPanel, setShowExtractionPanel] = useState(false);
  const [publicDocumentId, setPublicDocumentId] = useState<string | null>(null);

  // Verificar se todos os hooks estão funcionando corretamente
  useEffect(() => {
    if (!correctText || !extractApontamentos) {
      log.error('Hooks do useOpenAI não estão funcionando corretamente:', {
        correctText: !!correctText,
        extractApontamentos: !!extractApontamentos,
      });
    }
  }, [correctText, extractApontamentos]);

  // Verificar problemas específicos no modo orçamento
  useEffect(() => {
    if (documentMode === 'orcamento') {
      log.info('Modo orçamento ativado, verificando dependências:', {
        prestadores: prestadores?.length || 0,
        correctText: !!correctText,
        extractApontamentos: !!extractApontamentos,
        user: !!user,
      });
    }
  }, [documentMode, prestadores, correctText, extractApontamentos, user]);

  // Capturar erros gerais do componente
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      log.error('Erro capturado no componente AnaliseVistoria:', event.error);
      setComponentError(event.error?.message || 'Erro desconhecido');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Capturar erros do hook useOpenAI
  useEffect(() => {
    if (aiError) {
      log.error('Erro no hook useOpenAI:', aiError);
      toast({
        title: 'Erro na IA',
        description: `Erro ao carregar funcionalidades de IA: ${aiError}`,
        variant: 'destructive',
      });
    }
  }, [aiError, toast]);

  // Carregar contratos do Supabase
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('document_type', 'contrato')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContracts((data as Contract[]) || []);
      } catch {
        toast({
          title: 'Erro ao carregar contratos',
          description: 'Não foi possível carregar a lista de contratos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [toast]);

  return {
    // States
    apontamentos,
    setApontamentos,
    currentApontamento,
    setCurrentApontamento,
    contracts,
    setContracts,
    selectedContract,
    setSelectedContract,
    dadosVistoria,
    setDadosVistoria,
    loading,
    setLoading,
    editingApontamento,
    setEditingApontamento,
    savedAnaliseId,
    setSavedAnaliseId,
    isEditMode,
    setIsEditMode,
    editingAnaliseId,
    setEditingAnaliseId,
    existingAnaliseId,
    setExistingAnaliseId,
    hasExistingAnalise,
    setHasExistingAnalise,
    loadingExistingAnalise,
    setLoadingExistingAnalise,
    saving,
    setSaving,
    documentMode,
    setDocumentMode,
    componentError,
    setComponentError,
    selectedPrestadorId,
    setSelectedPrestadorId,
    extractionText,
    setExtractionText,
    showExtractionPanel,
    setShowExtractionPanel,
    publicDocumentId,
    setPublicDocumentId,
    isAILoading,
    prestadores,
  };
};