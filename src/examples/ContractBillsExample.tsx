/**
 * Exemplo de uso do sistema de contas de consumo
 *
 * Este arquivo demonstra como usar o componente ContractBillsSection
 * e o hook useContractBills em diferentes cenários.
 */

import React from 'react';
import { ContractBillsSection } from '@/features/contracts/components';
import { useContractBills } from '@/hooks/useContractBills';
import { ContractFormData } from '@/types/contract';

// ============================================================================
// EXEMPLO 1: Uso básico do componente
// ============================================================================

export function ExemploBasico() {
  const contractId = 'uuid-do-contrato';
  const formData: ContractFormData = {
    numeroContrato: '13734',
    statusAgua: 'SIM',
    solicitarCondominio: 'sim',
    solicitarGas: 'sim',
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Exemplo: Contrato com todas as contas
      </h2>
      <ContractBillsSection contractId={contractId} formData={formData} />
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Contrato apenas com energia
// ============================================================================

export function ExemploApenasEnergia() {
  const contractId = 'uuid-do-contrato-2';
  const formData: ContractFormData = {
    numeroContrato: '13735',
    // Sem água, condomínio ou gás configurados
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Exemplo: Contrato apenas com energia
      </h2>
      <ContractBillsSection contractId={contractId} formData={formData} />
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: Uso direto do hook
// ============================================================================

export function ExemploComHook() {
  const contractId = 'uuid-do-contrato-3';
  const formData: ContractFormData = {
    numeroContrato: '13736',
    statusAgua: 'SIM',
    solicitarCondominio: 'sim',
  };

  const { bills, billStatus, isLoading, toggleBillDelivery } = useContractBills(
    {
      contractId,
      formData,
    }
  );

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Exemplo: Uso direto do hook
      </h2>

      <div className="space-y-2">
        <p>Total de contas: {bills.length}</p>

        <div>
          <h3 className="font-medium">Status das contas:</h3>
          <ul className="ml-4 mt-2 space-y-1">
            <li>Energia: {billStatus.energia ? '✅' : '❌'}</li>
            {billStatus.agua !== undefined && (
              <li>Água: {billStatus.agua ? '✅' : '❌'}</li>
            )}
            {billStatus.condominio !== undefined && (
              <li>Condomínio: {billStatus.condominio ? '✅' : '❌'}</li>
            )}
            {billStatus.gas !== undefined && (
              <li>Gás: {billStatus.gas ? '✅' : '❌'}</li>
            )}
          </ul>
        </div>

        <button
          onClick={() => toggleBillDelivery('energia')}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Alternar status da Energia
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Verificar se todas as contas foram entregues
// ============================================================================

export function ExemploVerificarCompleto() {
  const contractId = 'uuid-do-contrato-4';
  const formData: ContractFormData = {
    numeroContrato: '13737',
    statusAgua: 'SIM',
    solicitarCondominio: 'sim',
    solicitarGas: 'sim',
  };

  const { bills } = useContractBills({
    contractId,
    formData,
  });

  // Verificar se todas as contas configuradas foram entregues
  const todasEntregues = bills.every((bill) => bill.delivered);
  const totalEntregues = bills.filter((bill) => bill.delivered).length;
  const percentualCompleto =
    bills.length > 0 ? Math.round((totalEntregues / bills.length) * 100) : 0;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Exemplo: Verificar progresso
      </h2>

      <ContractBillsSection contractId={contractId} formData={formData} />

      <div className="mt-4 rounded-lg bg-neutral-100 p-4">
        <p className="font-medium">
          Progresso: {totalEntregues} de {bills.length} contas entregues
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${percentualCompleto}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          {todasEntregues
            ? '✅ Todas as contas entregues!'
            : '⏳ Aguardando entrega de contas'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 5: Integração em um card customizado
// ============================================================================

export function ExemploCardCustomizado() {
  const contractId = 'uuid-do-contrato-5';
  const formData: ContractFormData = {
    numeroContrato: '13738',
    enderecoImovel: 'Rua Exemplo, 123',
    nomeLocatario: 'João Silva',
    statusAgua: 'SIM',
    solicitarCondominio: 'sim',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Header do card */}
      <div className="mb-4 border-b border-neutral-200 pb-4">
        <h3 className="text-lg font-semibold">
          Contrato {formData.numeroContrato}
        </h3>
        <p className="text-sm text-neutral-600">{formData.nomeLocatario}</p>
        <p className="text-sm text-neutral-500">{formData.enderecoImovel}</p>
      </div>

      {/* Seção de contas de consumo */}
      <div className="mb-4">
        <ContractBillsSection contractId={contractId} formData={formData} />
      </div>

      {/* Footer do card */}
      <div className="flex justify-between border-t border-neutral-200 pt-4">
        <button className="text-sm text-blue-600 hover:underline">
          Ver detalhes
        </button>
        <button className="text-sm text-neutral-600 hover:underline">
          Editar contrato
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 6: Configurações condicionais
// ============================================================================

/**
 * Demonstra como as contas aparecem baseado na configuração
 */
export function ExemploConfiguracoesCondicionais() {
  const exemplos = [
    {
      titulo: 'Apenas Energia (padrão)',
      formData: { numeroContrato: '1' },
      contas: ['Energia'],
    },
    {
      titulo: 'Energia + Água',
      formData: { numeroContrato: '2', statusAgua: 'SIM' },
      contas: ['Energia', 'Água'],
    },
    {
      titulo: 'Energia + Condomínio',
      formData: { numeroContrato: '3', solicitarCondominio: 'sim' },
      contas: ['Energia', 'Condomínio'],
    },
    {
      titulo: 'Todas as contas',
      formData: {
        numeroContrato: '4',
        statusAgua: 'SIM',
        solicitarCondominio: 'sim',
        solicitarGas: 'sim',
      },
      contas: ['Energia', 'Água', 'Condomínio', 'Gás'],
    },
  ];

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-semibold">
        Exemplo: Configurações condicionais
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {exemplos.map((exemplo, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <h3 className="mb-2 font-medium">{exemplo.titulo}</h3>
            <p className="mb-3 text-xs text-neutral-600">
              Contas exibidas: {exemplo.contas.join(', ')}
            </p>
            <ContractBillsSection
              contractId={`exemplo-${idx}`}
              formData={exemplo.formData as ContractFormData}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">💡 Regras:</h4>
        <ul className="ml-4 list-disc space-y-1 text-sm text-blue-800">
          <li>
            <strong>Energia</strong>: Sempre exibida (obrigatória)
          </li>
          <li>
            <strong>Água</strong>: Exibida se <code>statusAgua === 'SIM'</code>
          </li>
          <li>
            <strong>Condomínio</strong>: Exibida se{' '}
            <code>solicitarCondominio === 'sim'</code>
          </li>
          <li>
            <strong>Gás</strong>: Exibida se <code>solicitarGas === 'sim'</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
