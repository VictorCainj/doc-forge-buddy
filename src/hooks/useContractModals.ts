/**
 * Hook para gerenciar estados de modais do componente Contratos
 * Centraliza toda a lógica de abertura/fechamento de modais
 */

import { useState, useCallback } from 'react';
import { Contract, VistoriaType, PersonType } from '@/types/contract';

export interface ContractModalStates {
  // Estados dos modais
  showAgendamentoModal: boolean;
  showRecusaAssinaturaModal: boolean;
  showWhatsAppModal: boolean;
  showAssinanteModal: boolean;
  showNPSModal: boolean;
  showNPSNumbersModal: boolean;
  showEditModal: boolean;

  // Dados selecionados
  selectedContract: Contract | null;
  selectedNPSContract: Contract | null;
  editingContract: Contract | null;

  // Dados de formulário
  dataVistoria: string;
  horaVistoria: string;
  tipoVistoria: VistoriaType;
  tipoVistoriaRecusa: VistoriaType;
  dataRealizacaoVistoria: string;
  whatsAppType: PersonType | null;
  selectedPerson: string;
  assinanteSelecionado: string;
  npsMethod: 'email' | 'whatsapp' | null;
  npsWhatsAppType: PersonType | null;
  selectedNPSPerson: string;
  npsNumbers: Record<string, string>;
  npsSelectedParties: Record<string, boolean>;
  editFormData: Record<string, string>;

  // Estados de carregamento
  generatingDocument: string | null;
  isUpdating: boolean;

  // Dados pendentes
  pendingDocumentData: {
    contract: Contract;
    template: string;
    documentType: string;
  } | null;
}

export interface UseContractModalsReturn extends ContractModalStates {
  // Ações para Agendamento
  openAgendamentoModal: (contract: Contract) => void;
  closeAgendamentoModal: () => void;
  setDataVistoria: (data: string) => void;
  setHoraVistoria: (hora: string) => void;
  setTipoVistoria: (tipo: VistoriaType) => void;

  // Ações para Recusa de Assinatura
  openRecusaAssinaturaModal: (contract: Contract) => void;
  closeRecusaAssinaturaModal: () => void;
  setTipoVistoriaRecusa: (tipo: VistoriaType) => void;
  setDataRealizacaoVistoria: (data: string) => void;

  // Ações para WhatsApp
  openWhatsAppModal: (contract: Contract, type: PersonType) => void;
  closeWhatsAppModal: () => void;
  setWhatsAppType: (type: PersonType | null) => void;
  setSelectedPerson: (person: string) => void;

  // Ações para Assinante
  openAssinanteModal: (data: {
    contract: Contract;
    template: string;
    documentType: string;
  }) => void;
  closeAssinanteModal: () => void;
  setAssinanteSelecionado: (assinante: string) => void;

  // Ações para NPS
  openNPSModal: (contract: Contract) => void;
  closeNPSModal: () => void;
  setNpsMethod: (method: 'email' | 'whatsapp' | null) => void;
  setNpsWhatsAppType: (type: PersonType | null) => void;
  setSelectedNPSPerson: (person: string) => void;
  openNPSNumbersModal: () => void;
  closeNPSNumbersModal: () => void;
  setNpsNumbers: (numbers: Record<string, string>) => void;
  setNpsSelectedParties: (parties: Record<string, boolean>) => void;

  // Ações para Edição
  openEditModal: (contract: Contract) => void;
  closeEditModal: () => void;
  setEditFormData: (data: Record<string, string>) => void;
  setIsUpdating: (updating: boolean) => void;

  // Ações para Geração de Documento
  setGeneratingDocument: (id: string | null) => void;
}

export const useContractModals = (): UseContractModalsReturn => {
  // Estados dos modais
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [showRecusaAssinaturaModal, setShowRecusaAssinaturaModal] =
    useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showAssinanteModal, setShowAssinanteModal] = useState(false);
  const [showNPSModal, setShowNPSModal] = useState(false);
  const [showNPSNumbersModal, setShowNPSNumbersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Dados selecionados
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [selectedNPSContract, setSelectedNPSContract] =
    useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Dados de formulário
  const [dataVistoria, setDataVistoria] = useState('');
  const [horaVistoria, setHoraVistoria] = useState('');
  const [tipoVistoria, setTipoVistoria] = useState<VistoriaType>('final');
  const [tipoVistoriaRecusa, setTipoVistoriaRecusa] =
    useState<VistoriaType>('vistoria');
  const [dataRealizacaoVistoria, setDataRealizacaoVistoria] = useState('');
  const [whatsAppType, setWhatsAppType] = useState<PersonType | null>(null);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [assinanteSelecionado, setAssinanteSelecionado] = useState('');
  const [npsMethod, setNpsMethod] = useState<'email' | 'whatsapp' | null>(null);
  const [npsWhatsAppType, setNpsWhatsAppType] = useState<PersonType | null>(
    null
  );
  const [selectedNPSPerson, setSelectedNPSPerson] = useState('');
  const [npsNumbers, setNpsNumbers] = useState<Record<string, string>>({});
  const [npsSelectedParties, setNpsSelectedParties] = useState<
    Record<string, boolean>
  >({});
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});

  // Estados de carregamento
  const [generatingDocument, setGeneratingDocument] = useState<string | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Dados pendentes
  const [pendingDocumentData, setPendingDocumentData] = useState<{
    contract: Contract;
    template: string;
    documentType: string;
  } | null>(null);

  // Ações para Agendamento
  const openAgendamentoModal = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setShowAgendamentoModal(true);
  }, []);

  const closeAgendamentoModal = useCallback(() => {
    setShowAgendamentoModal(false);
    setSelectedContract(null);
    setDataVistoria('');
    setHoraVistoria('');
    setTipoVistoria('final');
  }, []);

  // Ações para Recusa de Assinatura
  const openRecusaAssinaturaModal = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setShowRecusaAssinaturaModal(true);
  }, []);

  const closeRecusaAssinaturaModal = useCallback(() => {
    setShowRecusaAssinaturaModal(false);
    setSelectedContract(null);
    setDataRealizacaoVistoria('');
    setTipoVistoriaRecusa('vistoria');
    setAssinanteSelecionado('');
  }, []);

  // Ações para WhatsApp
  const openWhatsAppModal = useCallback(
    (contract: Contract, type: PersonType) => {
      setSelectedContract(contract);
      setWhatsAppType(type);
      setShowWhatsAppModal(true);
    },
    []
  );

  const closeWhatsAppModal = useCallback(() => {
    setShowWhatsAppModal(false);
    setSelectedContract(null);
    setWhatsAppType(null);
    setSelectedPerson('');
    setAssinanteSelecionado('');
  }, []);

  // Ações para Assinante
  const openAssinanteModal = useCallback(
    (data: { contract: Contract; template: string; documentType: string }) => {
      setPendingDocumentData(data);
      setShowAssinanteModal(true);
    },
    []
  );

  const closeAssinanteModal = useCallback(() => {
    setShowAssinanteModal(false);
    setPendingDocumentData(null);
    setAssinanteSelecionado('');
  }, []);

  // Ações para NPS
  const openNPSModal = useCallback((contract: Contract) => {
    setSelectedNPSContract(contract);
    setShowNPSModal(true);
  }, []);

  const closeNPSModal = useCallback(() => {
    setShowNPSModal(false);
    setSelectedNPSContract(null);
    setNpsMethod(null);
    setNpsWhatsAppType(null);
    setSelectedNPSPerson('');
  }, []);

  const openNPSNumbersModal = useCallback(() => {
    setShowNPSNumbersModal(true);
  }, []);

  const closeNPSNumbersModal = useCallback(() => {
    setShowNPSNumbersModal(false);
  }, []);

  // Ações para Edição
  const openEditModal = useCallback((contract: Contract) => {
    setEditingContract(contract);
    setEditFormData(contract.form_data || {});
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingContract(null);
    setEditFormData({});
    setIsUpdating(false);
  }, []);

  return {
    // Estados
    showAgendamentoModal,
    showRecusaAssinaturaModal,
    showWhatsAppModal,
    showAssinanteModal,
    showNPSModal,
    showNPSNumbersModal,
    showEditModal,
    selectedContract,
    selectedNPSContract,
    editingContract,
    dataVistoria,
    horaVistoria,
    tipoVistoria,
    tipoVistoriaRecusa,
    dataRealizacaoVistoria,
    whatsAppType,
    selectedPerson,
    assinanteSelecionado,
    npsMethod,
    npsWhatsAppType,
    selectedNPSPerson,
    npsNumbers,
    npsSelectedParties,
    editFormData,
    generatingDocument,
    isUpdating,
    pendingDocumentData,

    // Ações para Agendamento
    openAgendamentoModal,
    closeAgendamentoModal,
    setDataVistoria,
    setHoraVistoria,
    setTipoVistoria,

    // Ações para Recusa de Assinatura
    openRecusaAssinaturaModal,
    closeRecusaAssinaturaModal,
    setTipoVistoriaRecusa,
    setDataRealizacaoVistoria,

    // Ações para WhatsApp
    openWhatsAppModal,
    closeWhatsAppModal,
    setWhatsAppType,
    setSelectedPerson,

    // Ações para Assinante
    openAssinanteModal,
    closeAssinanteModal,
    setAssinanteSelecionado,

    // Ações para NPS
    openNPSModal,
    closeNPSModal,
    setNpsMethod,
    setNpsWhatsAppType,
    setSelectedNPSPerson,
    openNPSNumbersModal,
    closeNPSNumbersModal,
    setNpsNumbers,
    setNpsSelectedParties,

    // Ações para Edição
    openEditModal,
    closeEditModal,
    setEditFormData,
    setIsUpdating,

    // Ações para Geração de Documento
    setGeneratingDocument,
  };
};
