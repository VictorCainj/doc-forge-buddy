import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTermoLocatario } from '@/features/documents/hooks/useTermoLocatario';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock do toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useTermoLocatario', () => {
  const mockContractData = {
    numeroContrato: 'CTR-2024-001',
    enderecoImovel: 'Rua Teste, 123',
    dataFirmamentoContrato: '2024-01-01',
    nomeProprietario: 'João Silva',
    nomeLocatario: 'Maria Santos',
    celularLocatario: '(11) 98765-4321',
    emailLocatario: 'maria@example.com',
    generoProprietario: 'masculino',
    generoLocatario: 'feminino',
    quantidadeChaves: '2',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com dados de contato do contrato', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    expect(result.current.contactData).toEqual({
      celularLocatario: '(11) 98765-4321',
      emailLocatario: 'maria@example.com',
    });
    expect(result.current.showContactModal).toBe(false);
  });

  it('deve validar campos de contato corretamente', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const validation = result.current.validateContactFields({});

    expect(validation.isValid).toBe(true);
    expect(validation.missingFields.celular).toBe(false);
    expect(validation.missingFields.email).toBe(false);
  });

  it('deve identificar campos faltantes', () => {
    const contractWithoutContact = {
      ...mockContractData,
      celularLocatario: '',
      emailLocatario: '',
    };

    const { result } = renderHook(() =>
      useTermoLocatario(contractWithoutContact)
    );

    act(() => {
      result.current.setContactData({
        celularLocatario: '',
        emailLocatario: '',
      });
    });

    const validation = result.current.validateContactFields({});

    expect(validation.isValid).toBe(false);
    expect(validation.missingFields.celular).toBe(true);
    expect(validation.missingFields.email).toBe(true);
  });

  it('deve atualizar modal de contato', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    act(() => {
      result.current.setShowContactModal(true);
    });

    expect(result.current.showContactModal).toBe(true);

    act(() => {
      result.current.setShowContactModal(false);
    });

    expect(result.current.showContactModal).toBe(false);
  });

  it('deve atualizar dados de contato', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const newContactData = {
      celularLocatario: '(21) 99999-8888',
      emailLocatario: 'novo@example.com',
    };

    act(() => {
      result.current.setContactData(newContactData);
    });

    expect(result.current.contactData).toEqual(newContactData);
  });

  it('deve processar formData e detectar múltiplos locatários', () => {
    const contractWithMultiple = {
      ...mockContractData,
      primeiroLocatario: 'João',
      segundoLocatario: 'Maria',
    };

    const { result } = renderHook(() =>
      useTermoLocatario(contractWithMultiple)
    );

    const processed = result.current.processFormData({
      nomeQuemRetira: 'João',
      tipoQuantidadeChaves: '2',
    });

    // isMultipleLocatarios será truthy porque primeiroLocatario E segundoLocatario existem
    expect(processed.isMultipleLocatarios).toBeTruthy();
    expect(processed.dadosLocatarioTitulo).toBe('DADOS DOS LOCATÁRIOS');
    expect(processed.locatarioResponsabilidade).toBe('dos locatários');
  });

  it('deve processar formData e detectar locatário único feminino', () => {
    const contractSingle = {
      ...mockContractData,
      primeiroLocatario: undefined,
      segundoLocatario: undefined,
      terceiroLocatario: undefined,
      quartoLocatario: undefined,
    };

    const { result } = renderHook(() => useTermoLocatario(contractSingle));

    const processed = result.current.processFormData({
      nomeQuemRetira: 'Maria',
      tipoQuantidadeChaves: '2',
    });

    // isMultipleLocatarios será false ou undefined porque não há primeiroLocatario
    expect(processed.isMultipleLocatarios).toBeFalsy();
    expect(processed.dadosLocatarioTitulo).toBe('DADOS DA LOCATÁRIA');
    expect(processed.locatarioResponsabilidade).toBe('do locatário');
  });

  it('deve processar formData e detectar múltiplos proprietários', () => {
    const contractWithMultipleOwners = {
      ...mockContractData,
      nomeProprietario: 'João Silva e Pedro Costa',
    };

    const { result } = renderHook(() =>
      useTermoLocatario(contractWithMultipleOwners)
    );

    const processed = result.current.processFormData({
      nomeQuemRetira: 'João',
      tipoQuantidadeChaves: '2',
    });

    expect(processed.isMultipleProprietarios).toBe(true);
    expect(processed.locadorTerm).toBe('LOCADORES');
  });

  it('deve processar formData com gênero masculino', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const processed = result.current.processFormData({
      nomeQuemRetira: 'João',
      tipoQuantidadeChaves: '2',
    });

    expect(processed.locadorTerm).toBe('LOCADOR');
  });

  it('deve processar formData com gênero feminino', () => {
    const contractFemale = {
      ...mockContractData,
      generoProprietario: 'feminino',
    };

    const { result } = renderHook(() => useTermoLocatario(contractFemale));

    const processed = result.current.processFormData({
      nomeQuemRetira: 'Maria',
      tipoQuantidadeChaves: '2',
    });

    expect(processed.locadorTerm).toBe('LOCADORA');
  });

  it('deve usar nome completo quando incluirNomeCompleto é "todos"', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const processed = result.current.processFormData({
      incluirNomeCompleto: 'todos',
      nomeQuemRetira: 'João',
      tipoQuantidadeChaves: '2',
    });

    expect(processed.nomeQuemRetira).toBe('Maria Santos');
  });

  it('deve usar valor customizado quando incluirNomeCompleto tem valor específico', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const processed = result.current.processFormData({
      incluirNomeCompleto: 'Fulano de Tal',
      nomeQuemRetira: 'João',
      tipoQuantidadeChaves: '2',
    });

    expect(processed.nomeQuemRetira).toBe('Fulano de Tal');
  });

  it('deve usar quantidade de chaves do contrato quando solicitado', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const processed = result.current.processFormData({
      usarQuantidadeChavesContrato: 'sim',
      tipoQuantidadeChaves: '5',
    });

    expect(processed.tipoQuantidadeChaves).toBe('2');
  });

  it('deve usar quantidade de chaves customizada quando não usar do contrato', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const processed = result.current.processFormData({
      usarQuantidadeChavesContrato: 'nao',
      tipoQuantidadeChaves: '5',
    });

    expect(processed.tipoQuantidadeChaves).toBe('5');
  });

  it('deve atualizar dados de contato no Supabase com sucesso', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ error: null });
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: '123',
        form_data: { numeroContrato: 'CTR-2024-001' },
      },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    let updateResult: boolean | undefined;

    await act(async () => {
      updateResult = await result.current.updateContractContactData({
        celularLocatario: '(21) 99999-8888',
        emailLocatario: 'novo@example.com',
      });
    });

    await waitFor(() => {
      expect(updateResult).toBe(true);
    });
  });

  it('deve armazenar pendingFormData', () => {
    const { result } = renderHook(() => useTermoLocatario(mockContractData));

    const formData = { campo1: 'valor1', campo2: 'valor2' };

    act(() => {
      result.current.setPendingFormData(formData);
    });

    expect(result.current.pendingFormData).toEqual(formData);
  });
});
