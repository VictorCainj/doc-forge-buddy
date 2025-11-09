import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractActions } from '@/features/contracts/hooks/useContractActions';
import { setupMocks } from '@/test/utils/test-utils';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { 
              id: 'contract-copy-1', 
              title: 'Contrato Teste (Cópia)',
              form_data: { numeroContrato: '001-COPY' }
            }, 
            error: null 
          }),
        })),
      })),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Setup dos mocks antes de cada teste
beforeEach(() => {
  setupMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useContractActions', () => {
  it('deve retornar as funções de ação necessárias', () => {
    const { result } = renderHook(() => useContractActions());

    expect(typeof result.current.deleteContract).toBe('function');
    expect(typeof result.current.duplicateContract).toBe('function');
    expect(typeof result.current.exportContracts).toBe('function');
    expect(typeof result.current.bulkDelete).toBe('function');
    expect(typeof result.current.bulkUpdateStatus).toBe('function');
  });

  describe('deleteContract', () => {
    it('deve deletar contrato com sucesso', async () => {
      const { result } = renderHook(() => useContractActions());
      const contractId = 'contract-1';

      const success = await result.current.deleteContract(contractId);

      expect(success).toBe(true);
      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith(
        'Contrato deletado com sucesso'
      );
    });

    it('deve retornar false quando houver erro ao deletar', async () => {
      // Mock que retorna erro
      const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
      supabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ 
            error: new Error('Erro ao deletar') 
          }),
        })),
      });

      const { result } = renderHook(() => useContractActions());
      const contractId = 'contract-1';

      const success = await result.current.deleteContract(contractId);

      expect(success).toBe(false);
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        'Erro ao deletar contrato'
      );
    });
  });

  describe('duplicateContract', () => {
    it('deve duplicar contrato com sucesso', async () => {
      const { result } = renderHook(() => useContractActions());
      const contract = {
        id: 'contract-1',
        title: 'Contrato Teste',
        form_data: {
          numeroContrato: '001',
        },
        content: 'Content',
        document_type: 'contrato',
      };

      const duplicatedContract = await result.current.duplicateContract(contract);

      expect(duplicatedContract).toBeDefined();
      expect(duplicatedContract?.title).toBe('Contrato Teste (Cópia)');
      expect(duplicatedContract?.form_data.numeroContrato).toBe('001-COPY');
      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith(
        'Contrato duplicado com sucesso'
      );
    });

    it('deve retornar null quando usuário não está autenticado', async () => {
      // Mock que retorna usuário nulo
      const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useContractActions());
      const contract = {
        id: 'contract-1',
        title: 'Contrato Teste',
        form_data: { numeroContrato: '001' },
        content: 'Content',
        document_type: 'contrato',
      };

      const duplicatedContract = await result.current.duplicateContract(contract);

      expect(duplicatedContract).toBeNull();
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        'Usuário não autenticado'
      );
    });

    it('deve retornar null quando houver erro ao duplicar', async () => {
      // Mock que retorna erro
      const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
      supabase.from.mockReturnValue({
        delete: vi.fn(),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: new Error('Erro ao duplicar') 
            }),
          })),
        })),
      });

      const { result } = renderHook(() => useContractActions());
      const contract = {
        id: 'contract-1',
        title: 'Contrato Teste',
        form_data: { numeroContrato: '001' },
        content: 'Content',
        document_type: 'contrato',
      };

      const duplicatedContract = await result.current.duplicateContract(contract);

      expect(duplicatedContract).toBeNull();
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        'Erro ao duplicar contrato'
      );
    });
  });

  describe('exportContracts', () => {
    it('deve exportar contratos para CSV com sucesso', () => {
      const { result } = renderHook(() => useContractActions());
      const contracts = [
        {
          id: 'contract-1',
          form_data: {
            numeroContrato: '001',
            nomeLocatario: 'João Silva',
            enderecoImovel: 'Rua A, 123',
          },
          created_at: '2024-01-01T00:00:00.000Z',
          status: 'Ativo',
        },
        {
          id: 'contract-2',
          form_data: {
            numeroContrato: '002',
            nomeLocatario: 'Maria Santos',
            enderecoImovel: 'Rua B, 456',
          },
          created_at: '2024-01-02T00:00:00.000Z',
          status: 'Ativo',
        },
      ];

      // Mock do createElement e click
      const mockCreateElement = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      global.document.createElement = mockCreateElement;
      global.document.body.appendChild = mockAppendChild;
      global.document.body.removeChild = mockRemoveChild;
      mockCreateElement.mockReturnValue({
        setAttribute: vi.fn(),
        click: mockClick,
        style: { visibility: 'hidden' },
      });
      vi.mocked(URL.createObjectURL).mockReturnValue('blob-url');

      // Mock do Blob
      const mockBlob = vi.fn();
      global.Blob = mockBlob;

      result.current.exportContracts(contracts);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith(
        '2 contratos exportados'
      );
    });

    it('deve usar valores padrão quando dados do contrato estiverem incompletos', () => {
      const { result } = renderHook(() => useContractActions());
      const contracts = [
        {
          id: 'contract-1',
          form_data: {}, // Dados incompletos
          created_at: null,
        },
      ];

      // Mock do createElement e click
      const mockCreateElement = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      global.document.createElement = mockCreateElement;
      global.document.body.appendChild = mockAppendChild;
      global.document.body.removeChild = mockRemoveChild;
      mockCreateElement.mockReturnValue({
        setAttribute: vi.fn(),
        click: mockClick,
        style: { visibility: 'hidden' },
      });
      vi.mocked(URL.createObjectURL).mockReturnValue('blob-url');

      // Mock do Blob
      const mockBlob = vi.fn();
      global.Blob = mockBlob;

      result.current.exportContracts(contracts);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });
  });

  describe('bulkDelete', () => {
    it('deve deletar múltiplos contratos com sucesso', async () => {
      const { result } = renderHook(() => useContractActions());
      const contractIds = ['contract-1', 'contract-2', 'contract-3'];

      const success = await result.current.bulkDelete(contractIds);

      expect(success).toBe(true);
      expect(vi.mocked(require('sonner').toast.success)).toHaveBeenCalledWith(
        '3 contratos deletados com sucesso'
      );
    });

    it('deve retornar false quando houver erro ao deletar em lote', async () => {
      // Mock que retorna erro
      const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
      supabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ 
            error: new Error('Erro ao deletar em lote') 
          }),
        })),
      });

      const { result } = renderHook(() => useContractActions());
      const contractIds = ['contract-1', 'contract-2'];

      const success = await result.current.bulkDelete(contractIds);

      expect(success).toBe(false);
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        'Erro ao deletar contratos em lote'
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('deve retornar false e mostrar erro (funcionalidade não disponível)', async () => {
      const { result } = renderHook(() => useContractActions());
      const contractIds = ['contract-1', 'contract-2'];
      const status = 'inativo';

      const success = await result.current.bulkUpdateStatus(contractIds, status);

      expect(success).toBe(false);
      expect(vi.mocked(require('sonner').toast.error)).toHaveBeenCalledWith(
        'Funcionalidade de status não disponível'
      );
    });
  });

  it('deve gerar nome de arquivo CSV com data atual', () => {
    const { result } = renderHook(() => useContractActions());
    const contracts = [
      {
        id: 'contract-1',
        form_data: {
          numeroContrato: '001',
          nomeLocatario: 'João Silva',
          enderecoImovel: 'Rua A, 123',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        status: 'Ativo',
      },
    ];

    // Mock do createElement para capturar o nome do arquivo
    let capturedDownloadName = '';
    global.document.createElement = vi.fn().mockImplementation(() => ({
      setAttribute: vi.fn((attr, value) => {
        if (attr === 'download') {
          capturedDownloadName = value;
        }
      }),
      click: vi.fn(),
      style: { visibility: 'hidden' },
    }));
    global.document.body.appendChild = vi.fn();
    global.document.body.removeChild = vi.fn();
    vi.mocked(URL.createObjectURL).mockReturnValue('blob-url');
    global.Blob = vi.fn();

    result.current.exportContracts(contracts);

    expect(capturedDownloadName).toMatch(/^contratos_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});