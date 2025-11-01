// @ts-nocheck
import React, {
  memo,
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { FixedSizeList as List } from 'react-window';
// @ts-expect-error - react-window-infinite-loader não tem tipos TypeScript
import InfiniteLoader from 'react-window-infinite-loader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  User,
  User2,
  Timer,
  CalendarDays,
  Clock,
  MapPin,
  Edit,
} from '@/utils/iconMapper';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { Contract } from '@/types/contract';

interface VirtualizedContractListProps {
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
  // Novas props para scroll infinito
  itemCount?: number;
  isItemLoaded?: (index: number) => boolean;
  loadMoreItems?: (startIndex: number, stopIndex: number) => Promise<unknown>;
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
 * Componente de item individual do contrato
 * Memoizado para evitar re-renders
 */
const ContractItem = memo<{
  contract: Contract;
  style: React.CSSProperties;
  onGenerateDocument: (
    contract: Contract,
    template: string,
    documentType: string
  ) => void;
}>(({ contract, style, onGenerateDocument }) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/editar-contrato/${contract.id}`);
  }, [navigate, contract.id]);

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const endereco =
        contract.form_data.endereco || contract.form_data.enderecoImovel;
      if (endereco) {
        const earthUrl = `https://earth.google.com/web/search/${encodeURIComponent(endereco)}`;
        window.open(earthUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [contract.form_data.endereco, contract.form_data.enderecoImovel]
  );

  return (
    <div style={style} className="px-3 py-3">
      <Card className="bg-white border-neutral-200 shadow-md hover:border-neutral-300 hover:shadow-sm transition-all duration-200 overflow-visible h-full">
        <CardContent className="p-5">
          {/* Header do Contrato */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-neutral-100">
                <FileText className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900">
                  Contrato {contract.form_data.numeroContrato || '[NÚMERO]'}
                </h3>
                <p className="text-xs text-neutral-500">
                  ID: {contract.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-neutral-200 mb-4"></div>

          {/* PARTES ENVOLVIDAS */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              Partes Envolvidas
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-md bg-neutral-100">
                  <User className="h-3 w-3 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {isMultipleProprietarios(
                      contract.form_data.nomeProprietario
                    )
                      ? 'Proprietários'
                      : 'Proprietário'}
                  </p>
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {contract.form_data.nomeProprietario}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-md bg-neutral-100">
                  <User2 className="h-3 w-3 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {isMultipleLocatarios(contract.form_data.nomeLocatario)
                      ? 'Locatários'
                      : 'Locatário'}
                  </p>
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {contract.form_data.nomeLocatario}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TERMOS DO CONTRATO */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              Termos do Contrato
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-neutral-100">
                    <Timer className="h-3 w-3 text-neutral-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-600">
                    Prazo
                  </span>
                </div>
                <span className="text-xs font-semibold text-neutral-900">
                  {contract.form_data.prazoDias} dias
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                  <div className="p-1 rounded bg-neutral-100">
                    <CalendarDays className="h-3 w-3 text-neutral-600" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">
                    {contract.form_data.dataInicioRescisao || '01/09/2026'}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                  <div className="p-1 rounded bg-neutral-100">
                    <Clock className="h-3 w-3 text-neutral-600" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">
                    {contract.form_data.dataTerminoRescisao || '01/10/2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LOCALIZAÇÃO */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
              Localização
            </h4>
            <div className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
              <div className="p-1 rounded bg-neutral-100">
                <MapPin className="h-3 w-3 text-neutral-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Endereço
                </p>
                <p
                  className="text-xs font-semibold text-neutral-900 line-clamp-2 cursor-pointer hover:text-primary-600 hover:underline transition-colors"
                  onClick={handleMapClick}
                  title="Clique para abrir no Google Earth"
                >
                  {contract.form_data.endereco ||
                    contract.form_data.enderecoImovel ||
                    '[ENDEREÇO NÃO INFORMADO]'}
                </p>
              </div>
            </div>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="border-t border-neutral-200 pt-4 relative overflow-visible">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleEdit}
                  aria-label={`Editar contrato ${contract.form_data.numeroContrato || '[NÚMERO]'}`}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
                <QuickActionsDropdown
                  contractId={contract.id}
                  contractNumber={
                    contract.form_data.numeroContrato || '[NÚMERO]'
                  }
                  onGenerateDocument={(_contractId, template, title) => {
                    onGenerateDocument(contract, template, title);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ContractItem.displayName = 'ContractItem';

/**
 * Componente de lista virtualizada de contratos
 * Usa react-window para renderizar apenas itens visíveis
 */
export const VirtualizedContractList = memo<VirtualizedContractListProps>(
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
    itemCount,
    isItemLoaded,
    loadMoreItems,
  }) => {
    // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER EARLY RETURN
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState(0);
    const [_loadedItems, _setLoadedItems] = useState<Set<number>>(new Set());

    // Memoizar configurações para scroll infinito
    const infiniteLoaderConfig = useMemo(() => {
      if (!itemCount || !isItemLoaded || !loadMoreItems) {
        return null;
      }

      return {
        itemCount,
        isItemLoaded,
        loadMoreItems,
        threshold: 5, // Carregar quando faltam 5 itens para o fim
      };
    }, [itemCount, isItemLoaded, loadMoreItems]);

    // Função de renderização de cada item com loading state
    const Row = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const contract = contracts[index];

        // Se não há contrato e estamos carregando mais, mostrar skeleton
        if (!contract && isLoadingMore) {
          return (
            <div style={style} className="px-3 py-3">
              <Card className="bg-white border-neutral-200 shadow-md overflow-visible h-full">
                <CardContent className="p-5">
                  <div className="animate-pulse">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 bg-neutral-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-neutral-200 rounded"></div>
                      <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        if (!contract) return null;

        return (
          <ContractItem
            key={contract.id}
            contract={contract}
            style={style}
            onGenerateDocument={onGenerateDocument}
          />
        );
      },
      [contracts, onGenerateDocument, isLoadingMore]
    );

    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          setListWidth(containerRef.current.offsetWidth);
        }
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // AGORA PODEMOS TER EARLY RETURNS
    // Loading state
    if (isLoading) {
      return (
        <Card className="bg-white border-neutral-200 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-neutral-100 rounded-lg mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-neutral-400 animate-pulse" />
              </div>
              <p className="text-lg font-medium text-neutral-900">
                Carregando contratos...
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                Aguarde um momento
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Empty state
    if (contracts.length === 0) {
      return (
        <Card className="bg-white border-neutral-200 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-neutral-100 rounded-lg mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Nenhum contrato cadastrado ainda
              </h3>
              <p className="text-neutral-600 mb-6">
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

    // Altura estimada de cada item (pode ser ajustada)
    const itemSize = 520;

    // Calcular altura total da lista
    const totalItems = infiniteLoaderConfig?.itemCount || contracts.length;
    const listHeight = Math.min(totalItems * itemSize, 2000);

    return (
      <>
        {/* Lista virtualizada com scroll infinito */}
        <div
          ref={containerRef}
          style={{
            height: `${listHeight}px`,
            width: '100%',
          }}
        >
          {listWidth > 0 &&
            (infiniteLoaderConfig ? (
              <InfiniteLoader {...infiniteLoaderConfig} ref={listRef}>
                {({ onItemsRendered, ref }) => (
                  <List
                    ref={ref}
                    height={listHeight}
                    itemCount={infiniteLoaderConfig.itemCount}
                    itemSize={itemSize}
                    width={listWidth}
                    onItemsRendered={onItemsRendered}
                  >
                    {Row}
                  </List>
                )}
              </InfiniteLoader>
            ) : (
              <List
                ref={listRef}
                height={listHeight}
                itemCount={contracts.length}
                itemSize={itemSize}
                width={listWidth}
              >
                {Row}
              </List>
            ))}
        </div>

        {/* Botão Ver Mais */}
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

VirtualizedContractList.displayName = 'VirtualizedContractList';
