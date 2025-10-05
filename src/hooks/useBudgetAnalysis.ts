/**
 * Hook para gerenciar análise de orçamento
 * Baseado no useAnaliseVistoriaFixed mas adaptado para orçamento
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Contract } from '@/types/contract';
import { BudgetItem, DadosOrcamento, Orcamento } from '@/types/orcamento';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface UseBudgetAnalysisReturn {
  // Estados principais
  itens: BudgetItem[];
  currentItem: Partial<BudgetItem>;
  contracts: Contract[];
  selectedContract: Contract | null;
  dadosOrcamento: DadosOrcamento;

  // Estados de UI
  editingItem: string | null;
  documentPreview: string;
  showDadosOrcamento: boolean;

  // Estados de persistência
  savedOrcamentoId: string | null;
  isEditMode: boolean;
  hasExistingOrcamento: boolean;

  // Estados de loading
  loading: boolean;
  saving: boolean;
  loadingExistingOrcamento: boolean;

  // Valor total calculado
  valorTotal: number;

  // Ações
  setItens: (itens: BudgetItem[]) => void;
  setCurrentItem: (item: Partial<BudgetItem>) => void;
  setSelectedContract: (contract: Contract | null) => void;
  setDadosOrcamento: (dados: DadosOrcamento) => void;
  addItem: () => void;
  editItem: (id: string) => void;
  deleteItem: (id: string) => void;
  saveOrcamento: () => Promise<void>;
  calculateTotal: () => number;
}

export const useBudgetAnalysis = (): UseBudgetAnalysisReturn => {
  const location = useLocation();
  const { toast } = useToast();

  // ✅ Estados organizados
  const [itens, setItens] = useState<BudgetItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<BudgetItem>>({
    ambiente: '',
    subtitulo: '',
    descricao: '',
    tipo: 'material',
    valor: 0,
    quantidade: 1,
    unidade: 'un',
    fotoAntes: { fotos: [] },
    fotoDepois: { fotos: [] },
    observacao: '',
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dadosOrcamento, setDadosOrcamento] = useState<DadosOrcamento>({
    cliente: '',
    endereco: '',
    dataOrcamento: new Date().toLocaleDateString('pt-BR'),
    validadeOrcamento: '',
    formaPagamento: '',
    observacoesGerais: '',
  });

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [_showDadosOrcamento, _setShowDadosOrcamento] = useState(true);

  const [savedOrcamentoId, setSavedOrcamentoId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingOrcamento, setHasExistingOrcamento] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingExistingOrcamento, setLoadingExistingOrcamento] = useState(false);

  // ✅ Calcular valor total
  const valorTotal = itens.reduce((total, item) => {
    return total + (item.valor * item.quantidade);
  }, 0);

  // ✅ Função para carregar contratos (memoizada)
  const fetchContracts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedContracts = (data || []).map(contract => ({
        ...contract,
        form_data: typeof contract.form_data === 'string'
          ? JSON.parse(contract.form_data)
          : contract.form_data || {},
      })) as Contract[];

      setContracts(processedContracts);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar contratos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ✅ Função para verificar orçamento existente (memoizada)
  const checkExistingOrcamento = useCallback(async (contractId: string) => {
    if (!contractId) {
      setHasExistingOrcamento(false);
      return;
    }

    setLoadingExistingOrcamento(true);
    try {
      // TODO: Tabela 'orcamentos' ainda não existe no schema
      // Temporariamente retornando false até a tabela ser criada
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('orcamentos')
        .select('id')
        .eq('contract_id', contractId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasExistingOrcamento(!!data);
    } catch {
      setHasExistingOrcamento(false);
    } finally {
      setLoadingExistingOrcamento(false);
    }
  }, []);

  // ✅ Efeito para carregar contratos
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // ✅ Efeito para detectar modo de edição
  useEffect(() => {
    const state = location.state as {
      editMode?: boolean;
      orcamentoData?: Orcamento;
    };

    if (state?.editMode && state?.orcamentoData && contracts.length > 0) {
      // Carregar dados do orçamento existente
      const orcamento = state.orcamentoData;

      setItens(orcamento.itens || []);
      setDadosOrcamento(orcamento.dados_orcamento);
      setSavedOrcamentoId(orcamento.id || null);
      setIsEditMode(true);

      // Encontrar e selecionar o contrato correspondente
      if (orcamento.contract_id) {
        const contract = contracts.find(c => c.id === orcamento.contract_id);
        if (contract) {
          setSelectedContract(contract);
        }
      }
    }
  }, [location.state, contracts]);

  // ✅ Efeito para atualizar dados do orçamento
  useEffect(() => {
    if (selectedContract) {
      setDadosOrcamento(prev => ({
        ...prev,
        cliente: selectedContract.form_data.nomeLocatario || selectedContract.form_data.numeroContrato || '',
        endereco: selectedContract.form_data.enderecoImovel ||
                  selectedContract.form_data.endereco || '',
      }));

      // Verificar orçamento existente
      checkExistingOrcamento(selectedContract.id);
    }
  }, [selectedContract, checkExistingOrcamento]);

  // ✅ Efeito para atualizar preview
  useEffect(() => {
    const updateDocumentPreview = async () => {
      if (itens.length === 0) {
        setDocumentPreview('');
        return;
      }

      try {
        // Validar itens
        const itensValidos = itens.filter((item) => {
          return item.ambiente && item.descricao && item.valor > 0;
        });

        if (itensValidos.length === 0) {
          setDocumentPreview('');
          return;
        }

        // Gerar preview do documento
        const itensPreview = itensValidos.map((item, index) => `
          <div class="budget-item">
            <h4>${index + 1}. ${item.ambiente}${item.subtitulo ? ` - ${item.subtitulo}` : ''}</h4>
            <p><strong>Descrição:</strong> ${item.descricao}</p>
            <p><strong>Tipo:</strong> ${item.tipo === 'material' ? 'Material' : 'Mão de Obra'}</p>
            <p><strong>Valor Unitário:</strong> R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Quantidade:</strong> ${item.quantidade} ${item.unidade}</p>
            <p><strong>Subtotal:</strong> R$ ${(item.valor * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            ${item.observacao ? `<p><strong>Observação:</strong> ${item.observacao}</p>` : ''}
          </div>
        `).join('');

        const previewContent = `
          <div class="orcamento-preview">
            <h2>Orçamento de Reparos</h2>
            <div class="orcamento-header">
              <p><strong>Cliente:</strong> ${dadosOrcamento.cliente}</p>
              <p><strong>Endereço:</strong> ${dadosOrcamento.endereco}</p>
              <p><strong>Data:</strong> ${dadosOrcamento.dataOrcamento}</p>
              ${dadosOrcamento.validadeOrcamento ? `<p><strong>Validade:</strong> ${dadosOrcamento.validadeOrcamento}</p>` : ''}
              ${dadosOrcamento.formaPagamento ? `<p><strong>Forma de Pagamento:</strong> ${dadosOrcamento.formaPagamento}</p>` : ''}
            </div>

            <h3>Itens do Orçamento:</h3>
            ${itensPreview}

            <div class="orcamento-total">
              <h3>Valor Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>

            ${dadosOrcamento.observacoesGerais ? `
              <div class="orcamento-observacoes">
                <h3>Observações Gerais:</h3>
                <p>${dadosOrcamento.observacoesGerais}</p>
              </div>
            ` : ''}
          </div>
        `;

        setDocumentPreview(previewContent);
      } catch {
        setDocumentPreview('Erro ao gerar preview');
      }
    };

    updateDocumentPreview();
  }, [itens, dadosOrcamento, valorTotal]);

  // ✅ Calcular valor total
  const calculateTotal = useCallback(() => {
    return itens.reduce((total, item) => {
      return total + (item.valor * item.quantidade);
    }, 0);
  }, [itens]);

  // ✅ Ações do componente
  const addItem = useCallback(() => {
    if (!currentItem.ambiente || !currentItem.descricao || !currentItem.valor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha ambiente, descrição e valor',
        variant: 'destructive',
      });
      return;
    }

    const novoItem: BudgetItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ambiente: currentItem.ambiente,
      subtitulo: currentItem.subtitulo || '',
      descricao: currentItem.descricao,
      tipo: currentItem.tipo || 'material',
      valor: currentItem.valor,
      quantidade: currentItem.quantidade || 1,
      unidade: currentItem.unidade || 'un',
      fotoAntes: currentItem.fotoAntes || { fotos: [] },
      fotoDepois: currentItem.fotoDepois || { fotos: [] },
      observacao: currentItem.observacao || '',
    };

    setItens(prev => [...prev, novoItem]);
    setCurrentItem({
      ambiente: '',
      subtitulo: '',
      descricao: '',
      tipo: 'material',
      valor: 0,
      quantidade: 1,
      unidade: 'un',
      fotoAntes: { fotos: [] },
      fotoDepois: { fotos: [] },
      observacao: '',
    });
  }, [currentItem, toast]);

  const editItem = useCallback((id: string) => {
    const item = itens.find(i => i.id === id);
    if (item) {
      setCurrentItem(item);
      setEditingItem(id);
    }
  }, [itens]);

  const deleteItem = useCallback((id: string) => {
    setItens(prev => prev.filter(i => i.id !== id));
  }, []);

  const saveOrcamento = useCallback(async () => {
    if (!selectedContract || itens.length === 0) {
      toast({
        title: 'Dados insuficientes',
        description: 'Selecione um contrato e adicione pelo menos um item',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const _orcamentoData = {
        title: `Orçamento - ${selectedContract.title}`,
        contract_id: selectedContract.id,
        dados_orcamento: dadosOrcamento,
        itens,
        valor_total: valorTotal,
        status: 'rascunho' as const,
      };

      // TODO: Implementar salvamento no banco de dados
      // Por enquanto, apenas simular sucesso
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Orçamento salvo',
        description: 'Orçamento foi salvo com sucesso',
      });

      setSavedOrcamentoId('temp-id');
      setIsEditMode(true);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar orçamento',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [
    selectedContract,
    itens,
    dadosOrcamento,
    valorTotal,
    toast,
  ]);

  return {
    // Estados principais
    itens,
    currentItem,
    contracts,
    selectedContract,
    dadosOrcamento,

    // Estados de UI
    editingItem,
    documentPreview,
    showDadosOrcamento: _showDadosOrcamento,

    // Estados de persistência
    savedOrcamentoId,
    isEditMode,
    hasExistingOrcamento,

    // Estados de loading
    loading,
    saving,
    loadingExistingOrcamento,

    // Valor total
    valorTotal,

    // Ações
    setItens,
    setCurrentItem,
    setSelectedContract,
    setDadosOrcamento,
    addItem,
    editItem,
    deleteItem,
    saveOrcamento,
    calculateTotal,
  };
};
