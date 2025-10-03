/**
 * Lista Virtualizada de Contratos
 * Renderiza apenas itens visíveis para melhorar performance
 */

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Contract } from '@/types/contract';
import { OptimizedContractCard } from './OptimizedContractCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface VirtualizedContractListProps {
  contracts: Contract[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onGenerateAgendamento: (contract: Contract) => void;
  onGenerateNPS: (contract: Contract) => void;
  onGenerateWhatsApp: (contract: Contract, type: 'locador' | 'locatario') => void;
  generatingDocument?: string | null;
  itemHeight?: number;
  overscan?: number;
}

// ✅ Componente de item memoizado para a lista virtualizada
const ContractListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    contracts: Contract[];
    onEdit: (contract: Contract) => void;
    onDelete: (contractId: string) => void;
    onGenerateAgendamento: (contract: Contract) => void;
    onGenerateNPS: (contract: Contract) => void;
    onGenerateWhatsApp: (contract: Contract, type: 'locador' | 'locatario') => void;
    generatingDocument?: string | null;
  };
}>(({ index, style, data }) => {
  const contract = data.contracts[index];
  
  if (!contract) {
    return (
      <div style={style} className="p-3">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div style={style} className="p-3">
      <OptimizedContractCard
        contract={contract}
        onEdit={data.onEdit}
        onDelete={data.onDelete}
        onGenerateAgendamento={data.onGenerateAgendamento}
        onGenerateNPS={data.onGenerateNPS}
        onGenerateWhatsApp={data.onGenerateWhatsApp}
        generatingDocument={data.generatingDocument}
      />
    </div>
  );
});

ContractListItem.displayName = 'ContractListItem';

export const VirtualizedContractList = memo<VirtualizedContractListProps>(({
  contracts,
  loading,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onGenerateAgendamento,
  onGenerateNPS,
  onGenerateWhatsApp,
  generatingDocument,
  itemHeight = 280,
  overscan = 5,
}) => {
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Ajustar altura do container baseado na viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // 100px de margem
        setContainerHeight(Math.max(400, Math.min(800, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // ✅ Dados memoizados para a lista virtualizada
  const listData = useMemo(() => ({
    contracts,
    onEdit,
    onDelete,
    onGenerateAgendamento,
    onGenerateNPS,
    onGenerateWhatsApp,
    generatingDocument,
  }), [
    contracts,
    onEdit,
    onDelete,
    onGenerateAgendamento,
    onGenerateNPS,
    onGenerateWhatsApp,
    generatingDocument,
  ]);

  // ✅ Callback para detectar quando chegou ao fim da lista
  const handleItemsRendered = useCallback(({
    visibleStartIndex,
    visibleStopIndex,
  }: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    // Carregar mais quando estiver próximo do fim
    const threshold = 5;
    if (
      hasMore &&
      !loading &&
      visibleStopIndex >= contracts.length - threshold
    ) {
      onLoadMore();
    }
  }, [hasMore, loading, contracts.length, onLoadMore]);

  // ✅ Estado de carregamento inicial
  if (loading && contracts.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium text-foreground">
              Carregando contratos...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Aguarde enquanto buscamos seus dados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ Estado vazio
  if (contracts.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="p-4 bg-muted rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Você ainda não possui contratos cadastrados. Comece criando seu primeiro contrato.
            </p>
            <Button asChild>
              <Link to="/cadastrar-contrato">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Contrato
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* ✅ Lista virtualizada - renderiza apenas itens visíveis */}
      <div className="border border-border rounded-lg overflow-hidden">
        <List
          height={containerHeight}
          itemCount={contracts.length}
          itemSize={itemHeight}
          itemData={listData}
          overscanCount={overscan}
          onItemsRendered={handleItemsRendered}
        >
          {ContractListItem}
        </List>
      </div>

      {/* ✅ Indicador de carregamento no final da lista */}
      {loading && contracts.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando mais contratos...</span>
          </div>
        </div>
      )}

      {/* ✅ Botão manual para carregar mais (fallback) */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Carregar Mais Contratos
          </Button>
        </div>
      )}

      {/* ✅ Indicador de fim da lista */}
      {!hasMore && contracts.length > 10 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Todos os contratos foram carregados ({contracts.length} total)
          </p>
        </div>
      )}
    </div>
  );
});

VirtualizedContractList.displayName = 'VirtualizedContractList';
