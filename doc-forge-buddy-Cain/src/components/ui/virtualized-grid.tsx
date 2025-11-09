import React, {
  memo,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export interface VirtualizedGridItem {
  id: string | number;
  [key: string]: any;
}

export interface VirtualizedGridProps<T extends VirtualizedGridItem> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth: number;
  itemHeight: number;
  containerHeight?: number;
  gap?: number;
  overscan?: number;
  loading?: boolean;
  emptyMessage?: string;
  rowCount?: number;
  columnCount?: number;
  minColumnWidth?: number;
  className?: string;
  onItemClick?: (item: T, index: number) => void;
  onItemHover?: (item: T, index: number) => void;
  virtualizationEnabled?: boolean;
  threshold?: number;
}

// Hook para calcular layout do grid
const useGridLayout = (
  containerWidth: number,
  itemWidth: number,
  gap: number,
  dataLength: number,
  columnCount?: number,
  minColumnWidth?: number
) => {
  return useMemo(() => {
    const effectiveItemWidth = itemWidth + gap;
    
    let computedColumns: number;
    if (columnCount) {
      computedColumns = columnCount;
    } else {
      computedColumns = Math.max(
        1,
        Math.floor((containerWidth + gap) / effectiveItemWidth)
      );
    }

    const computedMinWidth = minColumnWidth || itemWidth;
    computedColumns = Math.max(1, computedColumns);

    const rows = Math.ceil(dataLength / computedColumns);
    const totalWidth = computedColumns * itemWidth + (computedColumns - 1) * gap;
    const totalHeight = rows * itemHeight + (rows - 1) * gap;

    return {
      columns: computedColumns,
      rows,
      totalWidth,
      totalHeight,
      itemWidth,
      itemHeight,
      gap,
    };
  }, [containerWidth, itemWidth, itemHeight, gap, dataLength, columnCount, minColumnWidth]);
};

// Hook para detectar se deve virtualizar
const useVirtualizationDetection = (dataLength: number, threshold: number) => {
  return useMemo(() => {
    if (threshold === 0) return true;
    if (threshold === Infinity) return false;
    return dataLength > threshold;
  }, [dataLength, threshold]);
};

// Componente de item do grid
const GridItem = memo<{
  item: VirtualizedGridItem;
  index: number;
  style: React.CSSProperties;
  renderItem: (item: VirtualizedGridItem, index: number) => React.ReactNode;
  onItemClick?: (item: VirtualizedGridItem, index: number) => void;
  onItemHover?: (item: VirtualizedGridItem, index: number) => void;
}>(({ item, index, style, renderItem, onItemClick, onItemHover }) => {
  const handleClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [item, index, onItemClick]);

  const handleMouseEnter = useCallback(() => {
    if (onItemHover) {
      onItemHover(item, index);
    }
  }, [item, index, onItemHover]);

  return (
    <div
      style={style}
      className="p-1"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {renderItem(item, index)}
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Componente de skeleton para loading
const GridSkeleton = memo<{
  count: number;
  itemWidth: number;
  itemHeight: number;
}>(({ count, itemWidth, itemHeight }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </>
  );
});

GridSkeleton.displayName = 'GridSkeleton';

// Componente principal do grid virtualizado
export const VirtualizedGrid = <T extends VirtualizedGridItem>(
  {
    data,
    renderItem,
    itemWidth,
    itemHeight,
    containerHeight = 600,
    gap = 8,
    overscan = 3,
    loading = false,
    emptyMessage = 'Nenhum item encontrado',
    rowCount,
    columnCount,
    minColumnWidth,
    className = '',
    onItemClick,
    onItemHover,
    virtualizationEnabled,
    threshold = 100,
  }: VirtualizedGridProps<T>
) => {
  const gridRef = useRef<Grid>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Detectar se deve virtualizar
  const shouldVirtualize = useMemo(() => {
    if (typeof virtualizationEnabled === 'boolean') return virtualizationEnabled;
    return useVirtualizationDetection(data.length, threshold);
  }, [data.length, threshold, virtualizationEnabled]);

  // Calcular layout do grid
  const layout = useGridLayout(
    containerWidth,
    itemWidth,
    gap,
    data.length,
    columnCount,
    minColumnWidth
  );

  // Atualizar largura do container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Cell renderer para react-window
  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * layout.columns + columnIndex;
      const item = data[index];

      if (!item && loading) {
        return (
          <div style={style} className="p-1">
            <Card className="h-full">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          </div>
        );
      }

      if (!item) return null;

      return (
        <GridItem
          item={item}
          index={index}
          style={{
            ...style,
            left: style.left as number,
            top: style.top as number,
            width: style.width as number,
            height: style.height as number,
          }}
          renderItem={renderItem}
          onItemClick={onItemClick}
          onItemHover={onItemHover}
        />
      );
    },
    [data, loading, renderItem, onItemClick, onItemHover, layout.columns]
  );

  // Loading state
  if (loading && data.length === 0) {
    const skeletonCount = Math.min(12, Math.ceil(containerWidth / (itemWidth + gap)) * 2);
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
          }}
        >
          <GridSkeleton count={skeletonCount} itemWidth={itemWidth} itemHeight={itemHeight} />
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Se não deve virtualizar, usar CSS Grid
  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: columnCount 
              ? `repeat(${columnCount}, ${itemWidth}px)`
              : `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
          }}
        >
          {data.map((item, index) => (
            <div key={item.id} className="p-1">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid virtualizado
  return (
    <div 
      ref={containerRef} 
      className={`w-full ${className}`}
      style={{ height: containerHeight }}
    >
      {containerWidth > 0 && (
        <Grid
          ref={gridRef}
          columnCount={layout.columns}
          columnWidth={itemWidth + gap}
          height={containerHeight}
          rowCount={layout.rows}
          rowHeight={itemHeight + gap}
          width={containerWidth}
          overscanColumnCount={overscan}
          overscanRowCount={overscan}
        >
          {Cell}
        </Grid>
      )}
    </div>
  );
};

VirtualizedGrid.displayName = 'VirtualizedGrid';

export default VirtualizedGrid;