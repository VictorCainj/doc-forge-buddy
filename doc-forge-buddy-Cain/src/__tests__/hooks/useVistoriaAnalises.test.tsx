import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVistoriaAnalises } from '@/hooks/useVistoriaAnalises';
import { setupMocks, createMockData } from '@/test/utils/test-utils';
import { VistoriaAnaliseWithImages } from '@/types/vistoria';

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockData.user(),
    loading: false,
  }),
}));

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock do useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  }),
}));

// Mock do logger
vi.mock('@/utils/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do gerador de serial
vi.mock('@/utils/imageSerialGenerator', () => ({
  generateUniqueImageSerial: vi.fn(() => 'IMG-2024-001'),
}));

// Mock dos tipos shared
vi.mock('@/types/shared/vistoria', () => ({
  toSupabaseJson: vi.fn((data) => data),
  UpdateVistoriaAnalisePayload: vi.fn(),
  cleanPayload: vi.fn((data) => data),
}));

const mockVistoriaAnalise: VistoriaAnaliseWithImages = {
  id: '1',
  contract_id: '1',
  user_id: '1',
  analise_data: {
    vistoriador: 'João Silva',
    data_vistoria: '2024-01-15',
    ambiente: 'Sala',
    itens_encontrados: [],
    observacoes: 'Teste de análise',
  },
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  images: [
    {
      id: '1',
      vistoria_analise_id: '1',
      image_url: '/test/image1.jpg',
      serial_number: 'IMG-2024-001',
      created_at: '2024-01-15T10:00:00Z',
    },
  ],
};

describe('useVistoriaAnalises', () => {
  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com estados padrão', () => {
    const { result } = renderHook(() => useVistoriaAnalises());

    expect(result.current.analises).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.saving).toBe(false);
    expect(result.current.processingImages).toEqual(new Set());
  });

  it('deve carregar análises quando usuário está autenticado', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockVistoriaAnalise],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.analises).toHaveLength(1);
    expect(result.current.analises[0]).toEqual(mockVistoriaAnalise);
  });

  it('deve não carregar análises quando usuário não está autenticado', () => {
    const { useAuth } = vi.mocked(require('@/hooks/useAuth'));
    useAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    expect(result.current.analises).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('deve lidar com erro no carregamento de análises', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { log } = vi.mocked(require('@/utils/logger'));
    
    const mockError = new Error('Erro na consulta');
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(log.error).toHaveBeenCalledWith(
      'Erro ao carregar análises:',
      mockError
    );
  });

  it('deve criar nova análise', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { log } = vi.mocked(require('@/utils/logger'));
    const { toSupabaseJson } = vi.mocked(require('@/types/shared/vistoria'));
    
    const createData = {
      contract_id: '1',
      analise_data: {
        vistoriador: 'João Silva',
        data_vistoria: '2024-01-15',
        ambiente: 'Sala',
        observacoes: 'Nova análise',
      },
    };

    supabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockVistoriaAnalise,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    act(() => {
      result.current.createAnalise(createData);
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });

    expect(toSupabaseJson).toHaveBeenCalledWith(createData);
    expect(supabase.from).toHaveBeenCalledWith('vistoria_analises');
    expect(log.info).toHaveBeenCalledWith('Análise criada:', mockVistoriaAnalise.id);
  });

  it('deve atualizar análise existente', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { log } = vi.mocked(require('@/utils/logger'));
    const { cleanPayload } = vi.mocked(require('@/types/shared/vistoria'));
    
    const updateData = {
      id: '1',
      analise_data: {
        observacoes: 'Observações atualizadas',
      },
    };

    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockVistoriaAnalise, ...updateData },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    act(() => {
      result.current.updateAnalise(updateData.id, updateData.analise_data);
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });

    expect(cleanPayload).toHaveBeenCalledWith(updateData.analise_data);
    expect(log.info).toHaveBeenCalledWith('Análise atualizada:', updateData.id);
  });

  it('deve deletar análise', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { log } = vi.mocked(require('@/utils/logger'));
    
    supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    act(() => {
      result.current.deleteAnalise('1');
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith('vistoria_analises');
    expect(log.info).toHaveBeenCalledWith('Análise deletada:', '1');
  });

  it('deve fazer upload de imagem', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { generateUniqueImageSerial } = vi.mocked(require('@/utils/imageSerialGenerator'));
    const { log } = vi.mocked(require('@/utils/logger'));
    
    generateUniqueImageSerial.mockReturnValue('IMG-2024-002');
    
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockStorageResponse = { data: { path: '/uploads/test.jpg' }, error: null };

    supabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue(mockStorageResponse),
    });

    supabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '2',
              vistoria_analise_id: '1',
              image_url: '/uploads/test.jpg',
              serial_number: 'IMG-2024-002',
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    act(() => {
      result.current.uploadImage('1', mockFile);
    });

    await waitFor(() => {
      expect(generateUniqueImageSerial).toHaveBeenCalled();
    });

    expect(log.info).toHaveBeenCalledWith(
      'Imagem processada:',
      'IMG-2024-002'
    );
  });

  it('deve detectar processamento simultâneo de imagens', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    
    const mockFile1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });

    supabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: '/uploads/test.jpg' },
        error: null,
      }),
    });

    supabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '2',
              vistoria_analise_id: '1',
              image_url: '/uploads/test.jpg',
              serial_number: 'IMG-2024-002',
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    // Iniciar upload de duas imagens simultaneamente
    act(() => {
      result.current.uploadImage('1', mockFile1);
      result.current.uploadImage('1', mockFile2);
    });

    // Verificar se as imagens estão sendo processadas
    expect(result.current.processingImages.size).toBeGreaterThan(0);
  });

  it('deve lidar com erro no upload de imagem', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    const { log } = vi.mocked(require('@/utils/logger'));
    const { toast } = vi.mocked(require('@/components/ui/use-toast'));
    
    const mockError = new Error('Erro no upload');
    supabase.storage.from.mockReturnValue({
      upload: vi.fn().mockRejectedValue(mockError),
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => useVistoriaAnalises());

    act(() => {
      result.current.uploadImage('1', mockFile);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao fazer upload da imagem:',
        mockError.message
      );
    });

    expect(log.error).toHaveBeenCalledWith(
      'Erro no upload da imagem:',
      mockError
    );
  });

  it('deve refresh análises', async () => {
    const { supabase } = vi.mocked(require('@/integrations/supabase/client'));
    
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockVistoriaAnalise],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useVistoriaAnalises());

    // Primeiro carregamento
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refresh
    act(() => {
      result.current.refreshAnalises();
    });

    expect(result.current.loading).toBe(true);
  });

  it('deve verificar se análise existe para contrato', () => {
    const { result } = renderHook(() => useVistoriaAnalises());

    const hasAnalise = result.current.hasAnaliseForContract('1');
    expect(typeof hasAnalise).toBe('boolean');
  });
});