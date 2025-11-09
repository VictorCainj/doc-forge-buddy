import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentFormState } from '@/features/documents/hooks/useDocumentFormState';

// Mock do utilitário de template
vi.mock('@/features/documents/utils/templateProcessor', () => ({
  isMultipleLocatarios: (nome: string) => {
    return nome.includes(' e ') || nome.includes(',');
  },
}));

describe('useDocumentFormState', () => {
  it('deve definir gênero como neutro quando há múltiplos locatários', () => {
    const updateField = vi.fn();
    const formData = {
      nomeLocatario: 'João Silva e Maria Santos',
      generoLocatario: '',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData: {},
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith('generoLocatario', 'neutro');
  });

  it('não deve atualizar gênero se já estiver definido', () => {
    const updateField = vi.fn();
    const formData = {
      nomeLocatario: 'João Silva e Maria Santos',
      generoLocatario: 'masculino',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData: {},
        updateField,
      })
    );

    expect(updateField).not.toHaveBeenCalledWith('generoLocatario', 'neutro');
  });

  it('deve definir gênero do proprietário como neutro quando há múltiplos', () => {
    const updateField = vi.fn();
    const formData = {
      nomeProprietario: 'José Lima, Pedro Costa',
      generoProprietario: '',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData: {},
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith('generoProprietario', 'neutro');
  });

  it('deve auto-preencher dados do locador quando tipoTermo é locador', () => {
    const updateField = vi.fn();
    const formData = {
      tipoTermo: 'locador',
      tipoQuemRetira: '',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Carlos Alberto',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith('tipoQuemRetira', 'proprietario');
    expect(updateField).toHaveBeenCalledWith(
      'nomeQuemRetira',
      'Carlos Alberto'
    );
  });

  it('não deve sobrescrever tipoQuemRetira se já estiver definido', () => {
    const updateField = vi.fn();
    const formData = {
      tipoTermo: 'locador',
      tipoQuemRetira: 'imobiliaria',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Carlos Alberto',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).not.toHaveBeenCalledWith(
      'tipoQuemRetira',
      'proprietario'
    );
  });

  it('deve preencher nome quando incluirNomeCompleto é "sim"', () => {
    const updateField = vi.fn();
    const formData = {
      incluirNomeCompleto: 'sim',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Roberto Silva',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith('nomeQuemRetira', 'Roberto Silva');
  });

  it('deve preencher nome quando incluirNomeCompleto é "todos"', () => {
    const updateField = vi.fn();
    const formData = {
      incluirNomeCompleto: 'todos',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Ana Paula Costa',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith(
      'nomeQuemRetira',
      'Ana Paula Costa'
    );
  });

  it('deve usar valor customizado quando incluirNomeCompleto não é sim/nao/todos', () => {
    const updateField = vi.fn();
    const formData = {
      incluirNomeCompleto: 'Fulano de Tal',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Roberto Silva',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).toHaveBeenCalledWith('nomeQuemRetira', 'Fulano de Tal');
  });

  it('deve alternar para nomeLocatario quando disponível', () => {
    const updateField = vi.fn();
    const formData = {
      incluirNomeCompleto: 'sim',
      nomeQuemRetira: '',
    };
    const contractData = {
      nomeProprietario: 'Roberto Silva',
      nomeLocatario: 'Maria Oliveira',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    // O hook tenta primeiro nomeProprietario, depois nomeLocatario
    expect(updateField).toHaveBeenCalled();
  });

  it('não deve atualizar se nomeQuemRetira já está correto', () => {
    const updateField = vi.fn();
    const formData = {
      incluirNomeCompleto: 'sim',
      nomeQuemRetira: 'Roberto Silva',
    };
    const contractData = {
      nomeProprietario: 'Roberto Silva',
    };

    renderHook(() =>
      useDocumentFormState({
        formData,
        contractData,
        updateField,
      })
    );

    expect(updateField).not.toHaveBeenCalledWith(
      'nomeQuemRetira',
      'Roberto Silva'
    );
  });
});
