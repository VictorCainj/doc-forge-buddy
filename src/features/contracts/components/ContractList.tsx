import React, { memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Search } from '@/utils/iconMapper';
import {
  FileText,
  User,
  User2,
  Timer,
  CalendarDays,
  Clock,
  MapPin,
} from 'lucide-react';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { Contract } from '@/types/contract';
import { ContractBillsSection } from './ContractBillsSection';

interface ContractListProps {
  contracts: Contract[];
  isLoading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  isLoadingMore?: boolean;
  totalCount?: number;
  displayedCount?: number;
  hasSearched?: boolean;
  onGenerateDocument: (
    contract: Contract,
    template: string,
    documentType: string
  ) => void;
}

/**
 * Helper para verificar múltiplos proprietários
 */
const isMultipleProprietarios = (nome?: string) => {
  if (!nome) return false;
  return nome.includes(' e ') || nome.includes(' E ');
};

/**
 * Helper para verificar múltiplos locatários
 */
const isMultipleLocatarios = (nome?: string) => {
  if (!nome) return false;
  return nome.includes(' e ') || nome.includes(' E ');
};

/**
 * Item individual de contrato - memoizado para melhor performance
 */
const ContractListItem = memo<{
  contract: Contract;
  onGenerateDocument: (
    contract: Contract,
    template: string,
    documentType: string
  ) => void;
  onJusBrasilSearch: (nomeCompleto: string) => void;
  onEdit: (contractId: string) => void;
}>(({ contract, onGenerateDocument, onJusBrasilSearch, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit(contract.id);
  }, [contract.id, onEdit]);

  const handleProprietarioSearch = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onJusBrasilSearch(contract.form_data.nomeProprietario || '');
    },
    [contract.form_data.nomeProprietario, onJusBrasilSearch]
  );

  const handleLocatarioSearch = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onJusBrasilSearch(contract.form_data.nomeLocatario || '');
    },
    [contract.form_data.nomeLocatario, onJusBrasilSearch]
  );

  return (
    <Card className="bg-white border-neutral-300 shadow-md hover:border-neutral-400 hover:shadow-sm transition-all duration-200 overflow-visible min-h-fit">
      <CardContent className="p-5">
        {/* Header do Contrato */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-black">
              <FileText className="h-4 w-4 text-white" color="white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-black">
                Contrato{' '}
                <span className="font-mono text-xl text-primary-600">
                  {contract.form_data.numeroContrato || '[NÚMERO]'}
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                ID: {contract.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-neutral-300 mb-4"></div>

        {/* PARTES ENVOLVIDAS */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
            Partes Envolvidas
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div
                className="p-1.5 rounded-md bg-black"
                style={{
                  imageRendering: 'crisp-edges',
                  backfaceVisibility: 'hidden',
                }}
              >
                <User
                  className="h-3 w-3 text-white"
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  style={{
                    color: '#FFFFFF',
                    stroke: '#FFFFFF',
                    fill: 'none',
                    shapeRendering: 'geometricPrecision',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black uppercase tracking-wide">
                  {isMultipleProprietarios(contract.form_data.nomeProprietario)
                    ? 'Proprietários'
                    : 'Proprietário'}
                </p>
                <div className="flex items-center gap-2 group">
                  <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                    {contract.form_data.nomeProprietario}
                  </p>
                  <button
                    onClick={handleProprietarioSearch}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-neutral-200 rounded"
                    title="Buscar no JusBrasil"
                    aria-label={`Buscar ${contract.form_data.nomeProprietario} no JusBrasil`}
                  >
                    <Search className="h-3 w-3 text-neutral-600" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="p-1.5 rounded-md bg-black"
                style={{
                  imageRendering: 'crisp-edges',
                  backfaceVisibility: 'hidden',
                }}
              >
                <User2
                  className="h-3 w-3 text-white"
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  style={{
                    color: '#FFFFFF',
                    stroke: '#FFFFFF',
                    fill: 'none',
                    shapeRendering: 'geometricPrecision',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black uppercase tracking-wide">
                  {isMultipleLocatarios(contract.form_data.nomeLocatario)
                    ? 'Locatários'
                    : 'Locatário'}
                </p>
                <div className="flex items-center gap-2 group">
                  <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                    {contract.form_data.nomeLocatario}
                  </p>
                  <button
                    onClick={handleLocatarioSearch}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-neutral-200 rounded"
                    title="Buscar no JusBrasil"
                    aria-label={`Buscar ${contract.form_data.nomeLocatario} no JusBrasil`}
                  >
                    <Search className="h-3 w-3 text-neutral-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TERMOS DO CONTRATO */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
            Termos do Contrato
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div
                  className="p-1 rounded bg-black"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <Timer
                    className="h-3 w-3 text-white"
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      color: '#FFFFFF',
                      stroke: '#FFFFFF',
                      fill: 'none',
                      shapeRendering: 'geometricPrecision',
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-black">Prazo</span>
              </div>
              <span className="text-sm font-bold text-black font-mono">
                {contract.form_data.prazoDias} dias
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                <div
                  className="p-1 rounded bg-black"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <CalendarDays
                    className="h-3 w-3 text-white"
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      color: '#FFFFFF',
                      stroke: '#FFFFFF',
                      fill: 'none',
                      shapeRendering: 'geometricPrecision',
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-500 font-mono">
                  {contract.form_data.dataInicioRescisao || '01/09/2026'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                <div
                  className="p-1 rounded bg-black"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <Clock
                    className="h-3 w-3 text-white"
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      color: '#FFFFFF',
                      stroke: '#FFFFFF',
                      fill: 'none',
                      shapeRendering: 'geometricPrecision',
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-500 font-mono">
                  {contract.form_data.dataTerminoRescisao || '01/10/2026'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LOCALIZAÇÃO */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
            Localização
          </h4>
          <div className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
            <div
              className="p-1 rounded bg-black"
              style={{
                imageRendering: 'crisp-edges',
                backfaceVisibility: 'hidden',
              }}
            >
              <MapPin
                className="h-3 w-3 text-white"
                color="#FFFFFF"
                strokeWidth={2.5}
                style={{
                  color: '#FFFFFF',
                  stroke: '#FFFFFF',
                  fill: 'none',
                  shapeRendering: 'geometricPrecision',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-black uppercase tracking-wide">
                Endereço
              </p>
              <p
                className="text-sm font-medium text-gray-600 line-clamp-2 cursor-pointer hover:text-primary-600 hover:underline transition-colors leading-relaxed"
                onClick={(e) => {
                  e.stopPropagation();
                  const endereco =
                    contract.form_data.endereco ||
                    contract.form_data.enderecoImovel;
                  if (endereco) {
                    const earthUrl = `https://earth.google.com/web/search/${encodeURIComponent(endereco)}`;
                    window.open(earthUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                title="Clique para abrir no Google Earth"
              >
                {contract.form_data.endereco ||
                  contract.form_data.enderecoImovel ||
                  '[ENDEREÇO NÃO INFORMADO]'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTAS DE CONSUMO */}
        <div className="mb-4 pb-2">
          <ContractBillsSection
            contractId={
              contract.form_data.numeroContrato || '[NÚMERO NÃO DEFINIDO]'
            }
            formData={contract.form_data}
          />
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="border-t border-neutral-300 pt-4 relative overflow-visible">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEdit}
                aria-label={`Editar contrato ${contract.form_data.numeroContrato}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <QuickActionsDropdown
                contractId={contract.id}
                contractNumber={contract.form_data.numeroContrato || '[NÚMERO]'}
                onGenerateDocument={(_contractId, template, title) => {
                  onGenerateDocument(contract, template, title);
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContractListItem.displayName = 'ContractListItem';

/**
 * Componente de lista de contratos
 * Memoizado para evitar re-renders desnecessários
 */
export const ContractList = memo<ContractListProps>(
  ({
    contracts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
    totalCount = 0,
    displayedCount,
    hasSearched,
    onGenerateDocument,
  }) => {
    const navigate = useNavigate();

    /**
     * Abre busca no JusBrasil pelo nome completo
     * Memoizado para evitar recriação em cada render
     */
    const handleJusBrasilSearch = useCallback((nomeCompleto: string) => {
      if (!nomeCompleto) return;
      const searchUrl = `https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(nomeCompleto)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }, []);

    /**
     * Navega para edição de contrato
     * Memoizado para evitar recriação
     */
    const handleEditContract = useCallback(
      (contractId: string) => {
        navigate(`/editar-contrato/${contractId}`);
      },
      [navigate]
    );

    // Loading state
    if (isLoading) {
      return (
        <Card className="bg-white border-neutral-300 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-neutral-100 rounded-lg mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-neutral-400 animate-pulse" />
              </div>
              <p className="text-lg font-medium text-black">
                Carregando contratos...
              </p>
              <p className="text-sm text-gray-400 mt-1">Aguarde um momento</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Empty state
    if (contracts.length === 0) {
      return (
        <Card className="bg-white border-neutral-300 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-black rounded-lg mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" color="white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Nenhum contrato cadastrado ainda
              </h3>
              <p className="text-base text-gray-400 mb-6 leading-relaxed">
                Comece criando seu primeiro contrato no sistema
              </p>
              <Link to="/cadastrar-contrato">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Contrato
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    const remainingCount = displayedCount
      ? Math.max(0, totalCount - displayedCount)
      : 0;

    return (
      <>
        {/* Grid de Contratos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <ContractListItem
              key={contract.id}
              contract={contract}
              onGenerateDocument={onGenerateDocument}
              onJusBrasilSearch={handleJusBrasilSearch}
              onEdit={handleEditContract}
            />
          ))}
        </div>

        {/* Botão Ver Mais - Design Google Minimalista */}
        {hasMore && !hasSearched && loadMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              variant="ghost"
              className="group relative px-6 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-300 border-t-neutral-700"></div>
                  <span>Carregando</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Ver mais</span>
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-700 transition-colors">
                    ({remainingCount} restantes)
                  </span>
                </div>
              )}
            </Button>
          </div>
        )}
      </>
    );
  }
);

ContractList.displayName = 'ContractList';
