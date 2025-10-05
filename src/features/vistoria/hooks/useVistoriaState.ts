import { useReducer, useCallback } from 'react';
import { ApontamentoVistoria, DadosVistoria } from '@/types/vistoria';
import { BudgetItemType } from '@/types/orcamento';

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

interface VistoriaState {
  apontamentos: ApontamentoVistoria[];
  currentApontamento: Partial<ApontamentoVistoria & { tipo?: BudgetItemType; valor?: number; quantidade?: number }>;
  selectedContract: Contract | null;
  dadosVistoria: DadosVistoria;
  editingApontamento: string | null;
  showDadosVistoria: boolean;
  savedAnaliseId: string | null;
  isEditMode: boolean;
  editingAnaliseId: string | null;
  existingAnaliseId: string | null;
  hasExistingAnalise: boolean;
  documentMode: 'analise' | 'orcamento';
}

type VistoriaAction =
  | { type: 'SET_APONTAMENTOS'; payload: ApontamentoVistoria[] }
  | { type: 'ADD_APONTAMENTO'; payload: ApontamentoVistoria }
  | { type: 'REMOVE_APONTAMENTO'; payload: string }
  | { type: 'UPDATE_APONTAMENTO'; payload: { id: string; data: Partial<ApontamentoVistoria> } }
  | { type: 'SET_CURRENT_APONTAMENTO'; payload: Partial<ApontamentoVistoria> }
  | { type: 'RESET_CURRENT_APONTAMENTO' }
  | { type: 'SET_SELECTED_CONTRACT'; payload: Contract | null }
  | { type: 'SET_DADOS_VISTORIA'; payload: DadosVistoria }
  | { type: 'SET_EDITING_APONTAMENTO'; payload: string | null }
  | { type: 'SET_SHOW_DADOS_VISTORIA'; payload: boolean }
  | { type: 'SET_SAVED_ANALISE_ID'; payload: string | null }
  | { type: 'SET_EDIT_MODE'; payload: { isEditMode: boolean; editingAnaliseId: string | null } }
  | { type: 'SET_EXISTING_ANALISE'; payload: { existingAnaliseId: string | null; hasExistingAnalise: boolean } }
  | { type: 'SET_DOCUMENT_MODE'; payload: 'analise' | 'orcamento' }
  | { type: 'CLEAR_ALL_DATA' };

const initialCurrentApontamento = {
  ambiente: '',
  subtitulo: '',
  descricao: '',
  vistoriaInicial: { fotos: [], descritivoLaudo: '' },
  vistoriaFinal: { fotos: [] },
  observacao: '',
  tipo: 'material' as BudgetItemType,
  valor: 0,
  quantidade: 0,
};

const initialState: VistoriaState = {
  apontamentos: [],
  currentApontamento: initialCurrentApontamento,
  selectedContract: null,
  dadosVistoria: {
    locatario: '',
    endereco: '',
    dataVistoria: '',
  },
  editingApontamento: null,
  showDadosVistoria: true,
  savedAnaliseId: null,
  isEditMode: false,
  editingAnaliseId: null,
  existingAnaliseId: null,
  hasExistingAnalise: false,
  documentMode: 'analise',
};

function vistoriaReducer(state: VistoriaState, action: VistoriaAction): VistoriaState {
  switch (action.type) {
    case 'SET_APONTAMENTOS':
      return { ...state, apontamentos: action.payload };
    
    case 'ADD_APONTAMENTO':
      return { 
        ...state, 
        apontamentos: [...state.apontamentos, action.payload],
        currentApontamento: initialCurrentApontamento,
      };
    
    case 'REMOVE_APONTAMENTO':
      return { 
        ...state, 
        apontamentos: state.apontamentos.filter(ap => ap.id !== action.payload) 
      };
    
    case 'UPDATE_APONTAMENTO':
      return {
        ...state,
        apontamentos: state.apontamentos.map(ap =>
          ap.id === action.payload.id ? { ...ap, ...action.payload.data } : ap
        ),
      };
    
    case 'SET_CURRENT_APONTAMENTO':
      return { ...state, currentApontamento: action.payload };
    
    case 'RESET_CURRENT_APONTAMENTO':
      return { ...state, currentApontamento: initialCurrentApontamento };
    
    case 'SET_SELECTED_CONTRACT':
      return { ...state, selectedContract: action.payload };
    
    case 'SET_DADOS_VISTORIA':
      return { ...state, dadosVistoria: action.payload };
    
    case 'SET_EDITING_APONTAMENTO':
      return { ...state, editingApontamento: action.payload };
    
    case 'SET_SHOW_DADOS_VISTORIA':
      return { ...state, showDadosVistoria: action.payload };
    
    case 'SET_SAVED_ANALISE_ID':
      return { ...state, savedAnaliseId: action.payload };
    
    case 'SET_EDIT_MODE':
      return { 
        ...state, 
        isEditMode: action.payload.isEditMode,
        editingAnaliseId: action.payload.editingAnaliseId,
      };
    
    case 'SET_EXISTING_ANALISE':
      return {
        ...state,
        existingAnaliseId: action.payload.existingAnaliseId,
        hasExistingAnalise: action.payload.hasExistingAnalise,
      };
    
    case 'SET_DOCUMENT_MODE':
      return { ...state, documentMode: action.payload };
    
    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        showDadosVistoria: true,
      };
    
    default:
      return state;
  }
}

export function useVistoriaState() {
  const [state, dispatch] = useReducer(vistoriaReducer, initialState);

  const setApontamentos = useCallback((apontamentos: ApontamentoVistoria[]) => {
    dispatch({ type: 'SET_APONTAMENTOS', payload: apontamentos });
  }, []);

  const addApontamento = useCallback((apontamento: ApontamentoVistoria) => {
    dispatch({ type: 'ADD_APONTAMENTO', payload: apontamento });
  }, []);

  const removeApontamento = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_APONTAMENTO', payload: id });
  }, []);

  const updateApontamento = useCallback((id: string, data: Partial<ApontamentoVistoria>) => {
    dispatch({ type: 'UPDATE_APONTAMENTO', payload: { id, data } });
  }, []);

  const setCurrentApontamento = useCallback((apontamento: Partial<ApontamentoVistoria>) => {
    dispatch({ type: 'SET_CURRENT_APONTAMENTO', payload: apontamento });
  }, []);

  const resetCurrentApontamento = useCallback(() => {
    dispatch({ type: 'RESET_CURRENT_APONTAMENTO' });
  }, []);

  const setSelectedContract = useCallback((contract: Contract | null) => {
    dispatch({ type: 'SET_SELECTED_CONTRACT', payload: contract });
  }, []);

  const setDadosVistoria = useCallback((dados: DadosVistoria) => {
    dispatch({ type: 'SET_DADOS_VISTORIA', payload: dados });
  }, []);

  const setEditingApontamento = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_APONTAMENTO', payload: id });
  }, []);

  const setShowDadosVistoria = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_DADOS_VISTORIA', payload: show });
  }, []);

  const setSavedAnaliseId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SAVED_ANALISE_ID', payload: id });
  }, []);

  const setEditMode = useCallback((isEditMode: boolean, editingAnaliseId: string | null) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: { isEditMode, editingAnaliseId } });
  }, []);

  const setExistingAnalise = useCallback((existingAnaliseId: string | null, hasExistingAnalise: boolean) => {
    dispatch({ type: 'SET_EXISTING_ANALISE', payload: { existingAnaliseId, hasExistingAnalise } });
  }, []);

  const setDocumentMode = useCallback((mode: 'analise' | 'orcamento') => {
    dispatch({ type: 'SET_DOCUMENT_MODE', payload: mode });
  }, []);

  const clearAllData = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
  }, []);

  return {
    state,
    actions: {
      setApontamentos,
      addApontamento,
      removeApontamento,
      updateApontamento,
      setCurrentApontamento,
      resetCurrentApontamento,
      setSelectedContract,
      setDadosVistoria,
      setEditingApontamento,
      setShowDadosVistoria,
      setSavedAnaliseId,
      setEditMode,
      setExistingAnalise,
      setDocumentMode,
      clearAllData,
    },
  };
}
