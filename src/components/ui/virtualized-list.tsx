import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, User, CalendarDays } from 'lucide-react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

interface VirtualizedListState {
  scrollTop: number;
  containerHeight: number;
  itemHeight: number;
  overscan: number;
}

/**
 * Lista virtualizada para performance com grandes volumes de dados
 */
export const VirtualizedList = <T,>({
  items,
  renderItem,
  itemHeight = 120,
  containerHeight = 600,
  overscan = 5,
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  className = "",
}: VirtualizedListProps<T>) => {
  const [state, setState] = useState<VirtualizedListState>({
    scrollTop: 0,
    containerHeight,
    itemHeight,
    overscan,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calcular itens visíveis
  const visibleItems = useMemo(() => {
    const { scrollTop, containerHeight, itemHeight, overscan } = state;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      visibleCount: endIndex - startIndex + 1,
    };
  }, [state, items.length]);

  // Itens a serem renderizados
  const visibleItemsData = useMemo(() => {
    const { startIndex, endIndex } = visibleItems;
    return items.slice(startIndex, endIndex + 1);
  }, [items, visibleItems]);

  // Altura total da lista
  const totalHeight = items.length * itemHeight;

  // Offset para posicionamento
  const offsetY = visibleItems.startIndex * itemHeight;

  // Handler de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setState(prev => ({ ...prev, scrollTop }));
  }, []);

  // Atualizar dimensões do container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setState(prev => ({
          ...prev,
          containerHeight: rect.height,
        }));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        ref={scrollElementRef}
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItemsData.map((item, index) => {
            const actualIndex = visibleItems.startIndex + index;
            return (
              <div
                key={actualIndex}
                style={{
                  height: itemHeight,
                  padding: '8px',
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de item de contrato otimizado
 */
interface ContractData {
  form_data: {
    numeroContrato?: string;
    nomeLocatario?: string;
    enderecoImovel?: string;
    dataTerminoRescisao?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const ContractItem = React.memo<{
  contract: ContractData;
  onEdit?: (contract: ContractData) => void;
  _onDelete?: (contract: ContractData) => void;
  onGenerate?: (contract: ContractData, documentType: string) => void;
  isGenerating?: boolean;
}>(({ contract, onEdit, _onDelete, onGenerate, isGenerating = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (contract: ContractData) => {
    const endDate = new Date(contract.form_data.dataTerminoRescisao || '');
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="secondary">Próximo do vencimento</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm truncate">
                {contract.form_data.numeroContrato || 'Sem número'}
              </h3>
              {getStatusBadge(contract)}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3" />
                <span className="truncate">
                  {contract.form_data.nomeLocatario || 'Sem nome'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {contract.form_data.enderecoImovel || 'Sem endereço'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-3 w-3" />
                <span>
                  Criado em {formatDate(contract.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1 ml-4">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(contract)}
                className="w-20"
              >
                Editar
              </Button>
            )}
            {onGenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onGenerate(contract, 'contrato')}
                disabled={isGenerating}
                className="w-20"
              >
                {isGenerating ? 'Gerando...' : 'Gerar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ContractItem.displayName = 'ContractItem';

export default VirtualizedList;