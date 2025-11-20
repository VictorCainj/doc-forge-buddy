import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Edit, Loader2 } from '@/utils/iconMapper';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PremiumButton } from '@/components/ui/premium-button';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExcelIcon } from '@/components/icons/ExcelIcon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useStandardToast } from '@/utils/toastHelpers';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/core/dateFormatter';
import {
  exportContractsToExcel,
  ExportContractsOptions,
} from '@/utils/exportContractsToExcel';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/shared/contract';
import type { Contract as DomainContract } from '@/types/domain/contract';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { applyContractConjunctions } from '@/features/contracts/utils/contractConjunctions';
import { processTemplate } from '@/shared/template-processing';
import { NOTIFICACAO_AGENDAMENTO_TEMPLATE } from '@/templates/documentos';
import { ContractBillsSection } from '@/features/contracts/components/ContractBillsSection';
import { ContractOccurrencesButtonImproved as ContractOccurrencesButton } from '@/features/contracts/components/ContractOccurrencesModalImproved';
import { OptimizedSearch } from '@/components/ui/optimized-search';
import { useAnonymizedData } from '@/hooks/useAnonymizedData';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { anonymizeContractData } from '@/utils/privacyUtils';

const CONTRACTS_PER_PAGE = 5;

// Hook para buscar contratos do Supabase com cache React Query
const useContracts = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const queryResult = useQuery<Contract[]>({
    queryKey: ['contracts', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error: supabaseError } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      return (data || []).map(dbTerm => {
        const formData =
          typeof dbTerm.form_data === 'string'
            ? JSON.parse(dbTerm.form_data)
            : dbTerm.form_data || {};

        return {
          id: dbTerm.id,
          title: dbTerm.title || '',
          content: dbTerm.content || '',
          document_type: dbTerm.document_type || 'contrato',
          form_data: formData,
          created_at: dbTerm.created_at || '',
          updated_at: dbTerm.updated_at || '',
          user_id: dbTerm.user_id,
        } as Contract;
      });
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
  });

  const contracts = queryResult.data ?? [];
  const typedError = queryResult.error
    ? queryResult.error instanceof Error
      ? queryResult.error
      : new Error(
          (queryResult.error as { message?: string }).message ??
            'Erro ao buscar contratos'
        )
    : null;

  if (typedError) {
    console.error('Erro ao buscar contratos:', typedError);
  }

  return {
    data: userId ? contracts : ([] as Contract[]),
    isLoading: userId ? queryResult.isLoading && contracts.length === 0 : false,
    error: userId ? typedError : null,
  };
};

// Reducer hook (removido - usar estado local)
const useContractReducer = () => {
  const [state, setState] = React.useState({
    loading: { loadMore: false },
    modals: {},
    selectedContract: null,
    pendingDocument: null,
    formData: {},
  });

  const actions = {
    setFormData: (data: any) => setState(prev => ({ ...prev, formData: data })),
    closeModal: () =>
      setState(prev => ({ ...prev, modals: {}, selectedContract: null })),
  };

  return { state, actions };
};

// Component de lista de contratos
const ContractList = ({
  contracts,
  isLoading,
  onGenerateDocument,
  onScheduleAgendamento,
  onGenerateInvitation,
  hasMore,
  onLoadMore,
}: {
  contracts: Contract[];
  isLoading: boolean;
  onGenerateDocument: (
    contractId: string,
    template: string,
    title: string
  ) => void;
  onScheduleAgendamento?: (contractId: string) => void;
  onGenerateInvitation?: (contractId: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) => {
  const { anonymize } = useAnonymizedData();
  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className='bg-white border border-neutral-200 rounded-lg p-6 animate-pulse'
          >
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
            <div className='h-3 bg-gray-200 rounded w-1/2 mb-4'></div>
            <div className='flex gap-2'>
              <div className='h-8 bg-gray-200 rounded w-20'></div>
              <div className='h-8 bg-gray-200 rounded w-32'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className='bg-white border border-neutral-200 rounded-lg p-12 text-center'>
        <FileText className='h-16 w-16 text-gray-300 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Nenhum contrato encontrado
        </h3>
        <p className='text-gray-500 mb-6'>
          Comece criando seu primeiro contrato de locação
        </p>
        <Link
          to='/cadastrar-contrato'
          className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <Plus className='h-4 w-4' />
          Criar Contrato
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {contracts.map(contract => {
        const numeroContrato =
          contract.form_data?.numeroContrato ||
          contract.form_data?.numero_contrato ||
          '[NÚMERO NÃO DEFINIDO]';
        // Dados serão anonimizados no componente se necessário
        const nomeLocador =
          contract.form_data?.nomeProprietario ||
          contract.form_data?.primeiroNomeProprietario ||
          'Não informado';
        const nomeLocatario =
          contract.form_data?.nomeLocatario ||
          contract.form_data?.primeiroLocatario ||
          contract.form_data?.locatario_nome ||
          'Não informado';
        const endereco =
          contract.form_data?.enderecoImovel ||
          contract.form_data?.imovel_endereco ||
          'Não informado';

        return (
          <div
            key={contract.id}
            className='bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow'
          >
            {/* Header com Número do Contrato */}
            <div className='mb-4'>
              <div className='flex items-center gap-2 mb-1'>
                <FileText className='h-5 w-5 text-blue-600' />
                <h3 className='text-lg font-bold text-gray-900'>
                  Contrato #{numeroContrato}
                </h3>
              </div>
            </div>

            {/* Informações do Contrato */}
            <div className='space-y-3 mb-4'>
              {/* Nome do Locador */}
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Locador
                </p>
                <p className='text-sm font-semibold text-gray-900'>
                  {anonymize.namesList(nomeLocador)}
                </p>
              </div>

              {/* Nome do Locatário */}
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Locatário
                </p>
                <p className='text-sm font-semibold text-gray-900'>
                  {anonymize.name(nomeLocatario)}
                </p>
              </div>

              {/* Endereço */}
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Endereço
                </p>
                <p className='text-sm text-gray-700'>{anonymize.address(endereco)}</p>
              </div>
            </div>

            {/* Contas de Consumo */}
            <div className='mb-4 border-t border-neutral-200 pt-4'>
              <ContractBillsSection
                contractId={contract.id}
                formData={contract.form_data}
              />
            </div>

            {/* Botões de Ação */}
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <QuickActionsDropdown
                  contractId={contract.id}
                  contractNumber={numeroContrato}
                  onGenerateDocument={onGenerateDocument}
                  onScheduleAgendamento={onScheduleAgendamento}
                  onGenerateInvitation={onGenerateInvitation}
                />
                <ContractOccurrencesButton
                  contractId={contract.id}
                  contractNumber={numeroContrato}
                />
              </div>

              <Link
                to={`/editar-contrato/${contract.id}`}
                className='inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors'
              >
                <Edit className='h-4 w-4' />
                Editar
              </Link>
            </div>
          </div>
        );
      })}

      {/* Botão Ver Mais */}
      {hasMore && onLoadMore && (
        <div className='flex justify-center pt-4'>
          <button
            type='button'
            onClick={onLoadMore}
            className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors'
          >
            Ver mais
          </button>
        </div>
      )}
    </div>
  );
};


interface ContractFiltersProps {
  onSearch: (term: string) => void | Promise<void>;
  onClear: () => void;
  isLoading: boolean;
  hasSearched: boolean;
  resultsCount: number;
  totalCount: number;
  resetKey: number;
}

const ContractFilters: React.FC<ContractFiltersProps> = ({
  onSearch,
  onClear,
  isLoading,
  hasSearched,
  resultsCount,
  totalCount,
  resetKey,
}) => {
  const resultMessage = hasSearched
    ? resultsCount === 0
      ? 'Nenhum contrato corresponde à sua busca.'
      : `${resultsCount} ${resultsCount === 1 ? 'contrato encontrado' : 'contratos encontrados'}.`
    : `Você possui ${totalCount} ${totalCount === 1 ? 'contrato' : 'contratos'} cadastrados.`;

  return (
    <div className='bg-white border border-neutral-200 rounded-lg p-4 shadow-sm space-y-3'>
      <OptimizedSearch
        key={resetKey}
        onSearch={onSearch}
        isLoading={isLoading}
        resultsCount={resultsCount}
        showResultsCount={hasSearched}
        placeholder='Busque por número, locador, locatário ou endereço'
      />

      <div className='flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-neutral-600'>
        <p className='font-medium'>{resultMessage}</p>
        {hasSearched && (
          <button
            type='button'
            onClick={onClear}
            className='text-blue-600 font-semibold hover:underline transition-colors'
          >
            Limpar busca
          </button>
        )}
      </div>
    </div>
  );
};

// Lazy load de modals (simplificado)
const ContractModals = () => null;

// Memoizar funções pesadas
const getContractDate = (contract: any) => {
  const dateStr =
    contract.form_data.dataInicioRescisao ||
    contract.form_data.dataFirmamentoContrato;
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

type ExportScope = 'all' | 'notified-month' | 'current-view';

const parseDateForFilter = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;

  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface ScheduleFormState {
  tipoVistoria: 'final' | 'revistoria';
  dataVistoria: string;
  horaVistoria: string;
}

const filterContractsByNotificationMonth = (
  contracts: Contract[],
  targetMonth?: number,
  targetYear?: number
): Contract[] => {
  const now = new Date();
  const month = targetMonth ?? now.getMonth() + 1;
  const year = targetYear ?? now.getFullYear();

  return contracts.filter(contract => {
    const formData = contract.form_data || {};
    const referenceDate =
      parseDateForFilter(formData.dataInicioRescisao) ||
      parseDateForFilter(formData.dataComunicacao) ||
      parseDateForFilter(formData.dataTerminoRescisao);

    if (!referenceDate) return false;

    return (
      referenceDate.getMonth() + 1 === month &&
      referenceDate.getFullYear() === year
    );
  });
};

const Contratos = () => {
  const navigate = useNavigate();
  const { showError, showCustom } = useStandardToast();
  const { profile, user } = useAuth();
  const { anonymize } = useAnonymizedData();
  const { isPrivacyModeActive } = usePrivacyMode();

  // Estado para exportação
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Reducer state (substitui ~20 useState)
  const { state, actions } = useContractReducer();

  // Hook para buscar contratos do Supabase
  const { data: contracts, isLoading, error } = useContracts();
  const [displayedContracts, setDisplayedContracts] =
    useState<Contract[]>(contracts);

  // Estado para controlar quantos contratos exibir
  const [visibleCount, setVisibleCount] = useState(CONTRACTS_PER_PAGE);

  const [filters, setFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [contractIndex, setContractIndex] = useState(0);
  const [favoritesSet, setFavoritesSet] = useState(new Set());
  const [allTags, setAllTags] = useState([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [meses] = useState([
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]);
  const [searchResetCounter, setSearchResetCounter] = useState(0);
  const [isMonthExportDialogOpen, setIsMonthExportDialogOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>(() =>
    String(new Date().getMonth() + 1)
  );
  const [exportYear, setExportYear] = useState<string>(() =>
    String(new Date().getFullYear())
  );

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleContract, setScheduleContract] = useState<Contract | null>(
    null
  );
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>({
    tipoVistoria: 'final',
    dataVistoria: '',
    horaVistoria: '',
  });
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  // Atualizar displayedContracts quando contracts mudar
  useEffect(() => {
    setDisplayedContracts(contracts);
    // Resetar contador visível quando novos contratos são carregados
    setVisibleCount(CONTRACTS_PER_PAGE);
  }, [contracts]);

  useEffect(() => {
    const years = new Set<number>();

    contracts.forEach(contract => {
      const formData = contract.form_data || {};
      const candidateDates = [
        parseDateForFilter(formData.dataInicioRescisao),
        parseDateForFilter(formData.dataTerminoRescisao),
        parseDateForFilter(formData.dataComunicacao),
      ];
      candidateDates
        .filter((date): date is Date => !!date && !Number.isNaN(date.getTime()))
        .forEach(date => years.add(date.getFullYear()));
    });

    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    const sortedYears = Array.from(years)
      .sort((a, b) => b - a)
      .map(String);

    setAvailableYears(sortedYears);
    setExportYear(prev => (sortedYears.includes(prev) ? prev : sortedYears[0]));
  }, [contracts]);

  // Calcular contratos visíveis
  const visibleContracts = displayedContracts.slice(0, visibleCount);
  const hasMoreContracts = displayedContracts.length > visibleCount;

  // Função para carregar mais contratos
  const handleLoadMore = () => {
    setVisibleCount(prev =>
      Math.min(prev + CONTRACTS_PER_PAGE, displayedContracts.length)
    );
  };

  // Funções de busca e filtro
  const performSearch = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setDisplayedContracts(contracts);
        setVisibleCount(CONTRACTS_PER_PAGE);
        setHasSearched(false);
        return;
      }

      const termLower = term.toLowerCase();
      const filtered = contracts.filter(contract => {
        const title = contract.title?.toLowerCase() || '';
        const locatarioNome =
          contract.form_data?.nomeLocatario?.toLowerCase() ||
          contract.form_data?.locatario_nome?.toLowerCase() ||
          contract.form_data?.primeiroLocatario?.toLowerCase() ||
          '';
        const endereco =
          contract.form_data?.enderecoImovel?.toLowerCase() ||
          contract.form_data?.imovel_endereco?.toLowerCase() ||
          '';

        const numeroContrato = (
          contract.form_data?.numeroContrato ||
          contract.form_data?.numero_contrato ||
          ''
        )
          .toString()
          .toLowerCase();

        const nomeLocador =
          contract.form_data?.nomeProprietario?.toLowerCase() ||
          contract.form_data?.primeiroNomeProprietario?.toLowerCase() ||
          contract.form_data?.nomeLocador?.toLowerCase() ||
          '';

        return [
          title,
          locatarioNome,
          endereco,
          numeroContrato,
          nomeLocador,
        ].some(field => field.includes(termLower));
      });

      setDisplayedContracts(filtered);
      setVisibleCount(CONTRACTS_PER_PAGE);
      setHasSearched(true);
    },
    [contracts]
  );

  const clearSearch = useCallback(() => {
    setDisplayedContracts(contracts);
    setVisibleCount(CONTRACTS_PER_PAGE);
    setHasSearched(false);
    setSearchResetCounter(prev => prev + 1);
  }, [contracts]);

  const handleOpenScheduleModal = useCallback(
    (contractId: string) => {
      const contractToSchedule = contracts.find(
        contract => contract.id === contractId
      );

      if (!contractToSchedule) {
        showError('validation', {
          description: 'Contrato não encontrado para agendamento.',
        });
        return;
      }

      setScheduleContract(contractToSchedule);
      setScheduleForm(prev => ({
        tipoVistoria: prev.tipoVistoria || 'final',
        dataVistoria: '',
        horaVistoria: '',
      }));
      setIsScheduleModalOpen(true);
    },
    [contracts, showError]
  );

  const handleCloseScheduleModal = useCallback(() => {
    setIsScheduleModalOpen(false);
    setScheduleContract(null);
    setScheduleForm({
      tipoVistoria: 'final',
      dataVistoria: '',
      horaVistoria: '',
    });
  }, []);

  const handleScheduleFormChange = useCallback(
    (key: 'tipoVistoria' | 'dataVistoria' | 'horaVistoria', value: string) => {
      setScheduleForm(prev => ({
        ...prev,
        [key]:
          key === 'tipoVistoria'
            ? (value as ScheduleFormState['tipoVistoria'])
            : value,
      }));
    },
    []
  );

  const resolveScheduleDate = useCallback(() => {
    if (!scheduleForm.dataVistoria) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(scheduleForm.dataVistoria)) {
      const [year, month, day] = scheduleForm.dataVistoria.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(dateObj.getTime())
        ? ''
        : formatDateBrazilian(dateObj);
    }

    return convertDateToBrazilian(scheduleForm.dataVistoria);
  }, [scheduleForm.dataVistoria]);

  const buildInvitationContent = useCallback(
    (formData: Record<string, unknown>) => {
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const numeroContrato =
        (formData.numeroContrato as string) ||
        (formData.numero_contrato as string) ||
        (formData.contractNumber as string) ||
        '[Número do contrato]';

      const endereco =
        (formData.enderecoImovel as string) ||
        (formData.imovel_endereco as string) ||
        (formData.endereco as string) ||
        '[Endereço do imóvel]';

      const locatarioBase =
        (formData.nomeLocatario as string) ||
        (formData.primeiroLocatario as string) ||
        (formData.locatario_nome as string) ||
        '[Nome do locatário]';
      const locatarioRepresentante =
        (formData.locatarioRepresentante as string) ||
        (formData.representanteLocatario as string) ||
        (formData.socioLocatario as string) ||
        '';

      const locadorBase =
        (formData.nomeProprietario as string) ||
        (formData.primeiroNomeProprietario as string) ||
        (formData.nomeLocador as string) ||
        '[Nome do locador]';
      const locadorRepresentante =
        (formData.locadorRepresentante as string) ||
        (formData.representanteLocador as string) ||
        (formData.socioLocador as string) ||
        '';

      const locatarioTexto = locatarioRepresentante
        ? `${locatarioBase} neste ato representada pelo seu sócio proprietário ${locatarioRepresentante}`
        : locatarioBase;

      const locadorTexto = locadorRepresentante
        ? `${locadorBase} neste ato representado pelo seu sócio proprietário ${locadorRepresentante}`
        : locadorBase;

      const inferDate = () => {
        const rawDate =
          (formData.dataVistoriaConvite as string) ||
          (formData.dataVistoriaAgendada as string) ||
          (formData.dataVistoria as string) ||
          (formData.data_vistoria as string) ||
          '';

        if (!rawDate) {
          return '[Data a confirmar]';
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          return formatDateBrazilian(new Date(rawDate));
        }

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
          return rawDate;
        }

        const parsed = new Date(rawDate);
        return Number.isNaN(parsed.getTime())
          ? '[Data a confirmar]'
          : formatDateBrazilian(parsed);
      };

      const inferTime = () => {
        const rawTime =
          (formData.horaVistoriaConvite as string) ||
          (formData.horaVistoriaAgendada as string) ||
          (formData.horaVistoria as string) ||
          (formData.hora_vistoria as string) ||
          '';

        return rawTime || '[Horário a confirmar]';
      };

      const dataTexto = inferDate();
      const horaTexto = inferTime();

      const destinatarios = [locatarioTexto, locadorTexto]
        .filter(Boolean)
        .join(', ');

      const textMessage = [
        `Prezados ${destinatarios}`,
        '',
        `Informamos que a vistoria de saída do imóvel localizado no endereço: ${endereco}, foi agendada pelo locatário ${locatarioTexto} – Contrato n. ${numeroContrato}`,
        '',
        'Conforme previsto contratualmente e em atenção às boas práticas de transparência e segurança jurídica, convidamos Vossa Senhoria a acompanhar presencialmente o ato da vistoria, ocasião em que será realizada a conferência do estado de conservação do imóvel.',
        '',
        'A presença no local é importante para que todas as observações possam ser feitas em comum acordo, garantindo a ciência e a possibilidade de manifestação imediata quanto ao conteúdo do laudo.',
        '',
        '• Responsável técnico: David Issa',
        '',
        'Caso não seja possível o comparecimento, solicitamos que nos informe com antecedência. Ressaltamos que, mesmo na ausência, a vistoria será realizada conforme agendado, e o laudo será elaborado com base na análise técnica do vistoriador.',
        '',
        'Anexo a este e-mail, a notificação formal de agendamento da vistoria.',
        '',
        'Permanecemos à disposição para quaisquer esclarecimentos.',
        '',
        'Atenciosamente,',
        '',
        'MADIA IMÓVEIS LTDA',
        '',
        'Setor de Rescisão',
      ]
        .join('\n')
        .trim();

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #202124;">
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
            <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 140px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
          </div>
          <p style="margin: 0 0 16px 0;">${escapeHtml(`Prezados ${destinatarios}`)}</p>
          <p style="margin: 0 0 16px 0;">
            Informamos que a vistoria de saída do imóvel localizado no endereço: <strong>${escapeHtml(endereco)}</strong>, foi agendada pelo locatário <strong>${escapeHtml(locatarioTexto)}</strong> – Contrato n. <strong>${escapeHtml(numeroContrato)}</strong>
          </p>
          <p style="margin: 0 0 16px 0;">
            Conforme previsto contratualmente e em atenção às boas práticas de transparência e segurança jurídica, convidamos Vossa Senhoria a acompanhar presencialmente o ato da vistoria, ocasião em que será realizada a conferência do estado de conservação do imóvel.
          </p>
          <p style="margin: 0 0 16px 0;">
            A presença no local é importante para que todas as observações possam ser feitas em comum acordo, garantindo a ciência e a possibilidade de manifestação imediata quanto ao conteúdo do laudo.
          </p>
          <p style="margin: 0 0 16px 0;"><strong>&bull; Responsável técnico:</strong> David Issa</p>
          <p style="margin: 0 0 16px 0;">
            Caso não seja possível o comparecimento, solicitamos que nos informe com antecedência. Ressaltamos que, mesmo na ausência, a vistoria será realizada conforme agendado, e o laudo será elaborado com base na análise técnica do vistoriador.
          </p>
          <p style="margin: 0 0 16px 0;">
            Anexo a este e-mail, a notificação formal de agendamento da vistoria.
          </p>
          <p style="margin: 0 0 16px 0;">
            Permanecemos à disposição para quaisquer esclarecimentos.
          </p>
          <p style="margin: 0 0 16px 0;">Atenciosamente,</p>
          <p style="margin: 0 0 16px 0;"><strong>MADIA IMÓVEIS LTDA</strong></p>
          <p style="margin: 0;">Setor de Rescisão</p>
        </div>
      `.trim();

      return { text: textMessage, html: htmlMessage, numeroContrato };
    },
    [formatDateBrazilian]
  );

  const handleGenerateInvitation = useCallback(
    async (contractId: string) => {
      try {
        const { data: contractData, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('id', contractId)
          .single();

        if (error || !contractData) {
          showError('Erro ao carregar dados do contrato');
          return;
        }

        const formData =
          typeof contractData.form_data === 'string'
            ? JSON.parse(contractData.form_data)
            : contractData.form_data || {};

        const { text, html, numeroContrato } = buildInvitationContent(formData);

        navigate('/gerar-documento', {
          state: {
            title: `Convite para Acompanhamento da Vistoria de Saída - Contrato N° ${numeroContrato}`,
            template: html,
            formData,
            documentType: 'Convite para Acompanhamento',
            contractId,
            invitationMessage: text,
            invitationMessageHtml: html,
          },
        });
      } catch (error) {
        console.error('Erro ao gerar convite:', error);
        showError('Erro ao gerar documento. Tente novamente.');
      }
    },
    [buildInvitationContent, navigate, showError]
  );

  const loadMore = () => {};
  const isFavorite = () => false;
  const getContractTags = () => [];
  const setFilter = (key: string, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const clearAllFilters = () => setFilters({});

  // Função para gerar documentos (usada pelo QuickActionsDropdown)
  const handleGenerateDocument = useCallback(
    async (contractId: string, template: string, title: string) => {
      try {
        // Buscar dados do contrato
        const { data: contractData, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('id', contractId)
          .single();

        if (error || !contractData) {
          showError('Erro ao carregar dados do contrato');
          return;
        }

        // Processar form_data
        const formData =
          typeof contractData.form_data === 'string'
            ? JSON.parse(contractData.form_data)
            : contractData.form_data || {};

        // Aplicar conjugações e processar template
        const enhancedData = applyContractConjunctions(formData);
        const processedTemplate = processTemplate(template, enhancedData);

        // Determinar o tipo de documento baseado no título
        const documentType = title;

        // Navegar para a página de gerar documento
        navigate('/gerar-documento', {
          state: {
            title: title,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType,
            contractId: contractId,
          },
        });
      } catch (error) {
        console.error('Erro ao gerar documento:', error);
        showError('Erro ao gerar documento. Tente novamente.');
      }
    },
    [navigate, showError]
  );

  const handleGenerateAgendamento = useCallback(async () => {
    if (!scheduleContract) {
      showError('validation', {
        description: 'Selecione um contrato para gerar o agendamento.',
      });
      return;
    }

    if (!scheduleForm.dataVistoria || !scheduleForm.horaVistoria) {
      showError('validation', {
        description: 'Informe a data e a hora da vistoria.',
      });
      return;
    }

    try {
      setIsGeneratingSchedule(true);

      const { data: contractData, error: contractError } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', scheduleContract.id)
        .single();

      if (contractError || !contractData) {
        showError('Erro ao carregar dados do contrato');
        return;
      }

      const formData =
        typeof contractData.form_data === 'string'
          ? JSON.parse(contractData.form_data)
          : contractData.form_data || {};

      const enhancedData = applyContractConjunctions(formData);
      enhancedData.dataAtual = formatDateBrazilian(new Date());

      const dataVistoriaFormatada =
        resolveScheduleDate() || scheduleForm.dataVistoria;

      enhancedData.dataVistoria = dataVistoriaFormatada;
      enhancedData.horaVistoria = scheduleForm.horaVistoria;
      enhancedData.tipoVistoria = scheduleForm.tipoVistoria;

      const tipoVistoriaTexto =
        scheduleForm.tipoVistoria === 'revistoria'
          ? 'Revistoria'
          : 'Vistoria Final';

      enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
      enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
      enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

      // Aplicar anonimização se necessário
      const finalData = isPrivacyModeActive
        ? anonymizeContractData(enhancedData)
        : enhancedData;

      const processedTemplate = processTemplate(
        NOTIFICACAO_AGENDAMENTO_TEMPLATE,
        finalData
      );

      const contractNumber =
        enhancedData.numeroContrato ||
        scheduleContract.form_data?.numeroContrato ||
        scheduleContract.title ||
        '';

      const documentTitle = `Notificação de Agendamento - ${tipoVistoriaTexto} - ${contractNumber}`;

      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: 'Notificação de Agendamento',
          contractId: scheduleContract.id,
        },
      });

      handleCloseScheduleModal();
    } catch (error) {
      console.error('Erro ao gerar agendamento:', error);
      showError('Erro ao gerar documento. Tente novamente.');
    } finally {
      setIsGeneratingSchedule(false);
    }
  }, [
    handleCloseScheduleModal,
    navigate,
    resolveScheduleDate,
    scheduleContract,
    scheduleForm.dataVistoria,
    scheduleForm.horaVistoria,
    scheduleForm.tipoVistoria,
    showError,
  ]);
  const handleGenerateRecusaAssinatura = () => console.log('Gerar recusa');
  const handleGenerateWhatsApp = () => console.log('Gerar WhatsApp');
  const handleGenerateWithAssinante = () => console.log('Gerar com assinante');
  const handleGenerateStatusVistoria = () => console.log('Gerar status');

  const handleExportContracts = useCallback(
    async (scope: ExportScope, month?: number, year?: number) => {
      if (!contracts || contracts.length === 0) {
        showCustom({
          title: 'Nenhum contrato para exportar',
          description: 'Cadastre um contrato para gerar a planilha.',
        });
        return false;
      }

      setIsExporting(true);
      let exportSucceeded = false;

      try {
        let contractsToExport: Contract[] = [];
        const exportOptions: ExportContractsOptions = {};

        if (scope === 'current-view') {
          contractsToExport = displayedContracts;
          exportOptions.hasSearched = hasSearched;
        } else if (scope === 'notified-month') {
          const now = new Date();
          const targetMonth = month ?? now.getMonth() + 1;
          const targetYear = year ?? now.getFullYear();
          contractsToExport = filterContractsByNotificationMonth(
            contracts,
            targetMonth,
            targetYear
          );
          exportOptions.selectedMonth = String(targetMonth);
          exportOptions.selectedYear = String(targetYear);
        } else {
          contractsToExport = contracts;
        }

        if (!contractsToExport || contractsToExport.length === 0) {
          showCustom({
            title:
              scope === 'notified-month'
                ? 'Sem notificações no período escolhido'
                : 'Nenhum contrato na seleção atual',
            description:
              scope === 'notified-month'
                ? 'Nenhum contrato foi notificado no mês selecionado.'
                : 'Aplique outro filtro ou veja todos os contratos para exportar.',
          });
          return false;
        }

        await exportContractsToExcel(
          contractsToExport as unknown as DomainContract[],
          exportOptions
        );

        showCustom({
          title: 'Planilha preparada',
          description:
            'Exportação concluída com sucesso. O arquivo é compatível com o Google Sheets.',
        });
        exportSucceeded = true;
      } catch (error) {
        console.error('Erro ao exportar contratos:', error);
        showError('load', {
          title: 'Erro na exportação',
          description:
            'Não foi possível gerar a planilha. Tente novamente em instantes.',
        });
      } finally {
        setIsExporting(false);
      }

      return exportSucceeded;
    },
    [contracts, displayedContracts, hasSearched, showCustom, showError]
  );

  const handleConfirmMonthExport = useCallback(async () => {
    const monthNumber = parseInt(exportMonth, 10);
    const yearNumber = parseInt(exportYear, 10);

    if (Number.isNaN(monthNumber) || Number.isNaN(yearNumber)) {
      showCustom({
        title: 'Período inválido',
        description: 'Selecione um mês e um ano válidos para exportar.',
      });
      return;
    }

    const exported = await handleExportContracts(
      'notified-month',
      monthNumber,
      yearNumber
    );
    if (exported) {
      setIsMonthExportDialogOpen(false);
    }
  }, [exportMonth, exportYear, handleExportContracts, showCustom]);

  const handleClearDateFilter = () => console.log('Limpar filtro');
  const generateDocumentWithAssinante = () =>
    console.log('Gerar com assinante');

  // Mostrar erro se houver
  if (error) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-red-600 mb-2'>
            Erro ao carregar contratos
          </h2>
          <p className='text-gray-600'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='min-h-screen bg-white relative'>
        {isExporting && <LoadingOverlay message='Gerando planilha...' />}
        {/* Conteúdo principal com z-index */}
        <div className='relative z-10'>
          {/* Header Compacto - Todos os elementos visíveis sem scroll */}
          <div className='bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm'>
            <div className='max-w-[1400px] mx-auto px-4 py-3 sm:px-6 lg:px-8'>
              {/* Linha 1: Título e Botão Novo Contrato */}
              <div className='flex items-center justify-between gap-3 mb-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='icon-container w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0'>
                    <FileText className='h-6 w-6 sm:h-7 sm:w-7 text-white' />
                  </div>
                  <div className='min-w-0'>
                    <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate'>
                      Contratos
                    </h1>
                    <p className='text-xs sm:text-sm text-neutral-600 font-medium truncate'>
                      Gerencie todos os contratos de locação
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <PremiumButton
                        icon={
                          isExporting ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <ExcelIcon className='w-5 h-5' />
                          )
                        }
                        disabled={isExporting}
                        className='bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-400 hover:via-green-500 hover:to-teal-500'
                      >
                        Exportar planilha
                      </PremiumButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-64'>
                      <DropdownMenuLabel>Exportar contratos</DropdownMenuLabel>
                      <DropdownMenuItem
                        onSelect={async () => {
                          await handleExportContracts('all');
                        }}
                      >
                        Todos os contratos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async () => {
                          await handleExportContracts('notified-month');
                        }}
                      >
                        Notificados no mês atual
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setIsMonthExportDialogOpen(true);
                        }}
                      >
                        Notificados em outro mês...
                      </DropdownMenuItem>
                      {hasSearched && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              handleExportContracts('current-view')
                            }
                          >
                            Resultado da busca
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link to='/cadastrar-contrato' className='flex-shrink-0'>
                    <button className='inline-flex items-center gap-2 px-6 py-3 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50'>
                      <Plus className='h-5 w-5' />
                      <span className='hidden sm:inline'>Novo Contrato</span>
                      <span className='sm:hidden'>Novo</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Linha 2: Busca e Filtros Compactos */}
              <div className='space-y-2'>
                <ContractFilters
                  onSearch={performSearch}
                  onClear={clearSearch}
                  isLoading={isLoading}
                  hasSearched={hasSearched}
                  resultsCount={displayedContracts.length}
                  totalCount={contracts.length}
                  resetKey={searchResetCounter}
                />
              </div>
            </div>
          </div>

          {/* Welcome Section Compacta */}
          <div className='max-w-[1400px] mx-auto px-4 py-2 sm:px-6 lg:px-8'>
            <div className='bg-white border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 shadow-sm'>
              <div className='flex flex-col gap-0.5'>
                <h2 className='text-base sm:text-lg font-semibold text-neutral-900'>
                  Bem-vindo,{' '}
                  <span className='inline-block text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                    {profile?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Usuário'}
                  </span>
                </h2>
                <p className='text-xs sm:text-sm text-neutral-600'>
                  Com quais contratos iremos trabalhar hoje?
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <p className='text-xs text-neutral-500 uppercase tracking-wider font-medium'>
                  Hoje
                </p>
                <div className='bg-white/90 px-3 py-1.5 rounded-lg border border-white/50'>
                  <p className='text-xs sm:text-sm font-semibold text-neutral-700'>
                    {formatDateBrazilian(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            {/* Lista de Contratos */}
            <ContractList
              contracts={visibleContracts}
              isLoading={isLoading}
              onGenerateDocument={handleGenerateDocument}
              onScheduleAgendamento={handleOpenScheduleModal}
              onGenerateInvitation={handleGenerateInvitation}
              hasMore={hasMoreContracts}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>

        <Dialog
          open={isScheduleModalOpen}
          onOpenChange={open => {
            if (!open) {
              handleCloseScheduleModal();
            }
          }}
        >
          <DialogContent className='sm:max-w-[420px]'>
            <DialogHeader>
              <DialogTitle>Agendar Vistoria</DialogTitle>
              <DialogDescription>
                Preencha a data e hora da vistoria para gerar a notificação.
                {scheduleContract && (
                  <span className='block text-sm text-neutral-600 mt-1'>
                    Contrato:{' '}
                    <span className='font-semibold text-neutral-800'>
                      {scheduleContract.form_data?.numeroContrato ||
                        scheduleContract.title ||
                        scheduleContract.id}
                    </span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-2'>
              <div className='grid gap-2'>
                <Label htmlFor='schedule-tipo-vistoria'>Tipo de Vistoria</Label>
                <Select
                  value={scheduleForm.tipoVistoria}
                  onValueChange={value =>
                    handleScheduleFormChange('tipoVistoria', value)
                  }
                >
                  <SelectTrigger id='schedule-tipo-vistoria'>
                    <SelectValue placeholder='Selecione o tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='final'>Vistoria Final</SelectItem>
                    <SelectItem value='revistoria'>Revistoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='schedule-data'>Data da Vistoria</Label>
                <Input
                  id='schedule-data'
                  type='date'
                  value={scheduleForm.dataVistoria}
                  onChange={event =>
                    handleScheduleFormChange('dataVistoria', event.target.value)
                  }
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='schedule-hora'>Hora da Vistoria</Label>
                <Input
                  id='schedule-hora'
                  type='time'
                  value={scheduleForm.horaVistoria}
                  onChange={event =>
                    handleScheduleFormChange('horaVistoria', event.target.value)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleCloseScheduleModal}
                disabled={isGeneratingSchedule}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                onClick={handleGenerateAgendamento}
                disabled={isGeneratingSchedule}
              >
                {isGeneratingSchedule ? 'Gerando...' : 'Gerar Notificação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isMonthExportDialogOpen}
          onOpenChange={setIsMonthExportDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar notificações por mês</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <p className='text-sm font-medium text-neutral-700'>Mês</p>
                <Select value={exportMonth} onValueChange={setExportMonth}>
                  <SelectTrigger className='border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20'>
                    <SelectValue placeholder='Selecione o mês' />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes, index) => (
                      <SelectItem key={mes} value={String(index + 1)}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <p className='text-sm font-medium text-neutral-700'>Ano</p>
                <Select value={exportYear} onValueChange={setExportYear}>
                  <SelectTrigger className='border-neutral-300 focus:border-blue-500 focus:ring-blue-500/20'>
                    <SelectValue placeholder='Selecione o ano' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(yearOption => (
                      <SelectItem key={yearOption} value={yearOption}>
                        {yearOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsMonthExportDialogOpen(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                onClick={handleConfirmMonthExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modals - Lazy loaded */}
        <React.Suspense fallback={null}>
          <ContractModals
            modals={state.modals}
            selectedContract={state.selectedContract}
            pendingDocument={state.pendingDocument}
            formData={state.formData}
            onFormDataChange={actions.setFormData}
            onCloseModal={actions.closeModal}
            onGenerateAgendamento={handleGenerateAgendamento}
            onGenerateRecusaAssinatura={handleGenerateRecusaAssinatura}
            onGenerateWhatsApp={handleGenerateWhatsApp}
            onGenerateWithAssinante={handleGenerateWithAssinante}
            onGenerateStatusVistoria={handleGenerateStatusVistoria}
          />
        </React.Suspense>
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
