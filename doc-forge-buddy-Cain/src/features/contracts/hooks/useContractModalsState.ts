import { useReducer, useCallback } from 'react';
import { Contract, VistoriaType, PersonType } from '@/types/contract';

interface ModalsState {
  showAgendamentoModal: boolean;
  showRecusaAssinaturaModal: boolean;
  showWhatsAppModal: boolean;
  showAssinanteModal: boolean;
  selectedContract: Contract | null;
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
  tipoVistoriaRecusa: VistoriaType;
  dataRealizacaoVistoria: string;
  whatsAppType: PersonType | null;
  selectedPerson: string;
  assinanteSelecionado: string;
  pendingDocumentData: {
    contract: Contract;
    template: string;
    documentType: string;
  } | null;
}

type ModalsAction =
  | { type: 'OPEN_AGENDAMENTO_MODAL'; payload: Contract }
  | { type: 'CLOSE_AGENDAMENTO_MODAL' }
  | { type: 'SET_DATA_VISTORIA'; payload: string }
  | { type: 'SET_HORA_VISTORIA'; payload: string }
  | { type: 'SET_TIPO_VISTORIA'; payload: VistoriaType }
  | { type: 'OPEN_RECUSA_ASSINATURA_MODAL'; payload: Contract }
  | { type: 'CLOSE_RECUSA_ASSINATURA_MODAL' }
  | { type: 'SET_TIPO_VISTORIA_RECUSA'; payload: VistoriaType }
  | { type: 'SET_DATA_REALIZACAO_VISTORIA'; payload: string }
  | { type: 'SET_ASSINANTE_SELECIONADO'; payload: string }
  | { type: 'OPEN_WHATSAPP_MODAL'; payload: { contract: Contract; type: PersonType } }
  | { type: 'CLOSE_WHATSAPP_MODAL' }
  | { type: 'SET_SELECTED_PERSON'; payload: string }
  | { type: 'OPEN_ASSINANTE_MODAL'; payload: { contract: Contract; template: string; documentType: string } }
  | { type: 'CLOSE_ASSINANTE_MODAL' }
  | { type: 'RESET_ALL' };

const initialState: ModalsState = {
  showAgendamentoModal: false,
  showRecusaAssinaturaModal: false,
  showWhatsAppModal: false,
  showAssinanteModal: false,
  selectedContract: null,
  dataVistoria: '',
  horaVistoria: '',
  tipoVistoria: 'final',
  tipoVistoriaRecusa: 'vistoria',
  dataRealizacaoVistoria: '',
  whatsAppType: null,
  selectedPerson: '',
  assinanteSelecionado: '',
  pendingDocumentData: null,
};

function modalsReducer(state: ModalsState, action: ModalsAction): ModalsState {
  switch (action.type) {
    case 'OPEN_AGENDAMENTO_MODAL':
      return {
        ...state,
        showAgendamentoModal: true,
        selectedContract: action.payload,
      };
    
    case 'CLOSE_AGENDAMENTO_MODAL':
      return {
        ...state,
        showAgendamentoModal: false,
        selectedContract: null,
        dataVistoria: '',
        horaVistoria: '',
        tipoVistoria: 'final',
      };
    
    case 'SET_DATA_VISTORIA':
      return { ...state, dataVistoria: action.payload };
    
    case 'SET_HORA_VISTORIA':
      return { ...state, horaVistoria: action.payload };
    
    case 'SET_TIPO_VISTORIA':
      return { ...state, tipoVistoria: action.payload };
    
    case 'OPEN_RECUSA_ASSINATURA_MODAL':
      return {
        ...state,
        showRecusaAssinaturaModal: true,
        selectedContract: action.payload,
      };
    
    case 'CLOSE_RECUSA_ASSINATURA_MODAL':
      return {
        ...state,
        showRecusaAssinaturaModal: false,
        selectedContract: null,
        dataRealizacaoVistoria: '',
        assinanteSelecionado: '',
        tipoVistoriaRecusa: 'vistoria',
      };
    
    case 'SET_TIPO_VISTORIA_RECUSA':
      return { ...state, tipoVistoriaRecusa: action.payload };
    
    case 'SET_DATA_REALIZACAO_VISTORIA':
      return { ...state, dataRealizacaoVistoria: action.payload };
    
    case 'SET_ASSINANTE_SELECIONADO':
      return { ...state, assinanteSelecionado: action.payload };
    
    case 'OPEN_WHATSAPP_MODAL':
      return {
        ...state,
        showWhatsAppModal: true,
        selectedContract: action.payload.contract,
        whatsAppType: action.payload.type,
        selectedPerson: '',
      };
    
    case 'CLOSE_WHATSAPP_MODAL':
      return {
        ...state,
        showWhatsAppModal: false,
        selectedContract: null,
        whatsAppType: null,
        selectedPerson: '',
        assinanteSelecionado: '',
      };
    
    case 'SET_SELECTED_PERSON':
      return { ...state, selectedPerson: action.payload };
    
    case 'OPEN_ASSINANTE_MODAL':
      return {
        ...state,
        showAssinanteModal: true,
        pendingDocumentData: {
          contract: action.payload.contract,
          template: action.payload.template,
          documentType: action.payload.documentType,
        },
      };
    
    case 'CLOSE_ASSINANTE_MODAL':
      return {
        ...state,
        showAssinanteModal: false,
        pendingDocumentData: null,
        assinanteSelecionado: '',
      };
    
    case 'RESET_ALL':
      return initialState;
    
    default:
      return state;
  }
}

export function useContractModalsState() {
  const [state, dispatch] = useReducer(modalsReducer, initialState);

  const openAgendamentoModal = useCallback((contract: Contract) => {
    dispatch({ type: 'OPEN_AGENDAMENTO_MODAL', payload: contract });
  }, []);

  const closeAgendamentoModal = useCallback(() => {
    dispatch({ type: 'CLOSE_AGENDAMENTO_MODAL' });
  }, []);

  const setDataVistoria = useCallback((data: string) => {
    dispatch({ type: 'SET_DATA_VISTORIA', payload: data });
  }, []);

  const setHoraVistoria = useCallback((hora: string) => {
    dispatch({ type: 'SET_HORA_VISTORIA', payload: hora });
  }, []);

  const setTipoVistoria = useCallback((tipo: VistoriaType) => {
    dispatch({ type: 'SET_TIPO_VISTORIA', payload: tipo });
  }, []);

  const openRecusaAssinaturaModal = useCallback((contract: Contract) => {
    dispatch({ type: 'OPEN_RECUSA_ASSINATURA_MODAL', payload: contract });
  }, []);

  const closeRecusaAssinaturaModal = useCallback(() => {
    dispatch({ type: 'CLOSE_RECUSA_ASSINATURA_MODAL' });
  }, []);

  const setTipoVistoriaRecusa = useCallback((tipo: VistoriaType) => {
    dispatch({ type: 'SET_TIPO_VISTORIA_RECUSA', payload: tipo });
  }, []);

  const setDataRealizacaoVistoria = useCallback((data: string) => {
    dispatch({ type: 'SET_DATA_REALIZACAO_VISTORIA', payload: data });
  }, []);

  const setAssinanteSelecionado = useCallback((assinante: string) => {
    dispatch({ type: 'SET_ASSINANTE_SELECIONADO', payload: assinante });
  }, []);

  const openWhatsAppModal = useCallback((contract: Contract, type: PersonType) => {
    dispatch({ type: 'OPEN_WHATSAPP_MODAL', payload: { contract, type } });
  }, []);

  const closeWhatsAppModal = useCallback(() => {
    dispatch({ type: 'CLOSE_WHATSAPP_MODAL' });
  }, []);

  const setSelectedPerson = useCallback((person: string) => {
    dispatch({ type: 'SET_SELECTED_PERSON', payload: person });
  }, []);

  const openAssinanteModal = useCallback((contract: Contract, template: string, documentType: string) => {
    dispatch({ type: 'OPEN_ASSINANTE_MODAL', payload: { contract, template, documentType } });
  }, []);

  const closeAssinanteModal = useCallback(() => {
    dispatch({ type: 'CLOSE_ASSINANTE_MODAL' });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  return {
    state,
    actions: {
      openAgendamentoModal,
      closeAgendamentoModal,
      setDataVistoria,
      setHoraVistoria,
      setTipoVistoria,
      openRecusaAssinaturaModal,
      closeRecusaAssinaturaModal,
      setTipoVistoriaRecusa,
      setDataRealizacaoVistoria,
      setAssinanteSelecionado,
      openWhatsAppModal,
      closeWhatsAppModal,
      setSelectedPerson,
      openAssinanteModal,
      closeAssinanteModal,
      resetAll,
    },
  };
}
