import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Contract } from '@/types/contract';
import { useContractReducer } from '../useContractReducer';

describe('useContractReducer', () => {
  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useContractReducer());
      
      expect(result.current.state.contracts).toEqual([]);
      expect(result.current.state.selectedContract).toBeNull();
      expect(result.current.state.currentPage).toBe(1);
      expect(result.current.state.modals.agendamento).toBe(false);
      expect(result.current.state.loading.fetch).toBe(false);
    });
  });
  
  describe('Gerenciamento de Contratos', () => {
    it('deve adicionar contratos', () => {
      const { result } = renderHook(() => useContractReducer());
      
      const mockContracts: Contract[] = [
        { id: '1', title: 'Contrato 1', form_data: { numeroContrato: '1' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
        { id: '2', title: 'Contrato 2', form_data: { numeroContrato: '2' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
      ];
      
      act(() => {
        result.current.actions.setContracts(mockContracts);
      });
      
      expect(result.current.state.contracts).toHaveLength(2);
      expect(result.current.state.contracts[0].id).toBe('1');
      expect(result.current.state.contracts[1].id).toBe('2');
    });
    
    it('deve adicionar mais contratos aos existentes', () => {
      const { result } = renderHook(() => useContractReducer());
      
      const initialContracts: Contract[] = [
        { id: '1', title: 'Contrato 1', form_data: { numeroContrato: '1' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
      ];
      
      const newContracts: Contract[] = [
        { id: '2', title: 'Contrato 2', form_data: { numeroContrato: '2' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
      ];
      
      act(() => {
        result.current.actions.setContracts(initialContracts);
      });
      
      act(() => {
        result.current.actions.addContracts(newContracts);
      });
      
      expect(result.current.state.contracts).toHaveLength(2);
    });
    
    it('deve atualizar contrato existente', () => {
      const { result } = renderHook(() => useContractReducer());
      
      const mockContracts: Contract[] = [
        { id: '1', title: 'Contrato 1', form_data: { numeroContrato: '1' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
      ];
      
      act(() => {
        result.current.actions.setContracts(mockContracts);
      });
      
      const updatedContract: Contract = {
        id: '1',
        title: 'Contrato Atualizado',
        form_data: { numeroContrato: '1' },
        content: '',
        document_type: 'test',
        created_at: '',
        updated_at: '',
      };
      
      act(() => {
        result.current.actions.updateContract(updatedContract);
      });
      
      expect(result.current.state.contracts[0].title).toBe('Contrato Atualizado');
    });
    
    it('deve deletar contrato', () => {
      const { result } = renderHook(() => useContractReducer());
      
      const mockContracts: Contract[] = [
        { id: '1', title: 'Contrato 1', form_data: { numeroContrato: '1' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
        { id: '2', title: 'Contrato 2', form_data: { numeroContrato: '2' }, content: '', document_type: 'test', created_at: '', updated_at: '' },
      ];
      
      act(() => {
        result.current.actions.setContracts(mockContracts);
      });
      
      act(() => {
        result.current.actions.deleteContract('1');
      });
      
      expect(result.current.state.contracts).toHaveLength(1);
      expect(result.current.state.contracts[0].id).toBe('2');
    });
    
    it('deve selecionar contrato', () => {
      const { result } = renderHook(() => useContractReducer());
      
      const mockContract: Contract = {
        id: '1',
        title: 'Contrato 1',
        form_data: { numeroContrato: '1' },
        content: '',
        document_type: 'test',
        created_at: '',
        updated_at: '',
      };
      
      act(() => {
        result.current.actions.selectContract(mockContract);
      });
      
      expect(result.current.state.selectedContract).toEqual(mockContract);
    });
  });
  
  describe('Gerenciamento de Modais', () => {
    it('deve abrir modal', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.openModal('agendamento');
      });
      
      expect(result.current.state.modals.agendamento).toBe(true);
    });
    
    it('deve fechar modal', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.openModal('agendamento');
      });
      
      act(() => {
        result.current.actions.closeModal('agendamento');
      });
      
      expect(result.current.state.modals.agendamento).toBe(false);
    });
    
    it('deve fechar todos os modais', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.openModal('agendamento');
        result.current.actions.openModal('recusaAssinatura');
        result.current.actions.openModal('whatsapp');
      });
      
      act(() => {
        result.current.actions.closeAllModals();
      });
      
      expect(result.current.state.modals.agendamento).toBe(false);
      expect(result.current.state.modals.recusaAssinatura).toBe(false);
      expect(result.current.state.modals.whatsapp).toBe(false);
    });
  });
  
  describe('Gerenciamento de Form Data', () => {
    it('deve atualizar form data', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setFormData('dataVistoria', '2024-10-15');
      });
      
      expect(result.current.state.formData.dataVistoria).toBe('2024-10-15');
    });
    
    it('deve resetar form data', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setFormData('dataVistoria', '2024-10-15');
        result.current.actions.setFormData('horaVistoria', '14:00');
      });
      
      act(() => {
        result.current.actions.resetFormData();
      });
      
      expect(result.current.state.formData.dataVistoria).toBe('');
      expect(result.current.state.formData.horaVistoria).toBe('');
    });
  });
  
  describe('Gerenciamento de Loading', () => {
    it('deve atualizar estado de loading', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setLoading('fetch', true);
      });
      
      expect(result.current.state.loading.fetch).toBe(true);
      
      act(() => {
        result.current.actions.setLoading('fetch', false);
      });
      
      expect(result.current.state.loading.fetch).toBe(false);
    });
    
    it('deve gerenciar loading de geração de documentos', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setLoading('generating', 'contract-123');
      });
      
      expect(result.current.state.loading.generating).toBe('contract-123');
    });
  });
  
  describe('Paginação', () => {
    it('deve atualizar página atual', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setPage(2);
      });
      
      expect(result.current.state.currentPage).toBe(2);
    });
    
    it('deve atualizar hasMore', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setHasMore(true);
      });
      
      expect(result.current.state.hasMore).toBe(true);
    });
    
    it('deve atualizar total count', () => {
      const { result } = renderHook(() => useContractReducer());
      
      act(() => {
        result.current.actions.setTotalCount(50);
      });
      
      expect(result.current.state.totalCount).toBe(50);
    });
  });
  
  describe('Reset Completo', () => {
    it('deve resetar todo o estado', () => {
      const { result } = renderHook(() => useContractReducer());
      
      // Modificar vários estados
      act(() => {
        result.current.actions.setContracts([{ id: '1' }] as any);
        result.current.actions.openModal('agendamento');
        result.current.actions.setFormData('dataVistoria', '2024-10-15');
        result.current.actions.setPage(3);
        result.current.actions.setLoading('fetch', true);
      });
      
      // Reset
      act(() => {
        result.current.actions.reset();
      });
      
      // Verificar estado inicial
      expect(result.current.state.contracts).toEqual([]);
      expect(result.current.state.modals.agendamento).toBe(false);
      expect(result.current.state.formData.dataVistoria).toBe('');
      expect(result.current.state.currentPage).toBe(1);
      expect(result.current.state.loading.fetch).toBe(false);
    });
  });
});
