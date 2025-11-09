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
import { FixedSizeList as List } from 'react-window';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown } from '@/utils/iconMapper';

export interface VirtualizedTableColumn<T> {
  key: keyof T;
  title: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualizedTableProps<T> {
  data: T[];
  columns: VirtualizedTableColumn<T>[];
  itemHeight?: number;
  height?: number;
  overscan?: number;
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  stickyHeader?: boolean;
  virtualized?: boolean; // Auto-detecção de virtualização
  threshold?: number; // Threshold para ativar virtualização (padrão: 100)
}

// Hook para detectar o tamanho da lista
const useListSizeDetection = (dataLength: number, threshold: number) => {
  return useMemo(() => {
    if (threshold === 0) return true; // Sempre virtualizar se threshold = 0
    if (threshold === Infinity) return false; // Nunca virtualizar se threshold = Infinity
    return dataLength > threshold;
  }, [dataLength, threshold]);
};

// Hook para debouncing de eventos
const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Hook para pré-carregamento de itens
const usePreloadItems = <T,>(
  items: T[],
  startIndex: number,
  endIndex: number,
  preloadBuffer: number = 10
) => {
  return useMemo(() => {
    const preloadStart = Math.max(0, startIndex - preloadBuffer);
    const preloadEnd = Math.min(items.length, endIndex + preloadBuffer);
    return items.slice(preloadStart, preloadEnd);
  }, [items, startIndex, endIndex, preloadBuffer]);
};

// Componente de cabeçalho da tabela
const TableHeaderRow = memo<{
  columns: VirtualizedTableColumn<any>[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof any, direction: 'asc' | 'desc') => void;
  sticky?: boolean;
  itemHeight: number;
}>(({ columns, sortBy, sortDirection, onSort, sticky, itemHeight }) => {
  const handleSort = useCallback((column: keyof any) => {
    if (!onSort) return;
    
    const newDirection = 
      sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  }, [sortBy, sortDirection, onSort]);

  return (
    <TableHeader className={sticky ? 'sticky top-0 z-10 bg-white' : ''}>
      <TableRow style={{ height: itemHeight }}>
        {columns.map((column) => (
          <TableHead
            key={String(column.key)}
            className={`
              ${column.align === 'center' ? 'text-center' : ''}
              ${column.align === 'right' ? 'text-right' : ''}
              ${column.sortable ? 'cursor-pointer select-none' : ''}
              ${sticky ? 'shadow-sm' : ''}
            `}
            style={{
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              width: column.width,
            }}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            <div className="flex items-center gap-1">
              <span>{column.title}</span>
              {column.sortable && sortBy === column.key && (
                <span className="inline-flex">
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
});

TableHeaderRow.displayName = 'TableHeaderRow';

// Componente de linha da tabela
const TableRowVirtualized = memo<{
  item: any;
  index: number;
  columns: VirtualizedTableColumn<any>[];
  style: React.CSSProperties;
  rowClassName?: (item: any, index: number) => string;
  onRowClick?: (item: any, index: number) => void;
}>(({ item, index, columns, style, rowClassName, onRowClick }) => {
  const handleClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  }, [item, index, onRowClick]);

  return (
    <TableRow
      style={style}
      className={`
        ${rowClassName ? rowClassName(item, index) : ''}
        ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
        transition-colors duration-150
      `}
      onClick={handleClick}
    >
      {columns.map((column) => (
        <TableCell
          key={String(column.key)}
          className={`
            ${column.align === 'center' ? 'text-center' : ''}
            ${column.align === 'right' ? 'text-right' : ''}
          `}
          style={{
            minWidth: column.minWidth,
            maxWidth: column.maxWidth,
            width: column.width,
          }}
        >
          {column.render
            ? column.render(item[column.key], item, index)
            : String(item[column.key] || '')}
        </TableCell>
      ))}
    </TableRow>
  );
});

TableRowVirtualized.displayName = 'TableRowVirtualized';

// Componente de loading skeleton para tabela
const TableSkeleton = memo<{
  columns: VirtualizedTableColumn<any>[];
  rows?: number;
  itemHeight: number;
}>(({ columns, rows = 5, itemHeight }) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} style={{ height: itemHeight }}>
          {columns.map((column) => (
            <TableCell
              key={String(column.key)}
              style={{
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                width: column.width,
              }}
            >
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

// Componente principal da tabela virtualizada
export const VirtualizedTable = <T extends Record<string, any>>(
  {
    data,
    columns,
    itemHeight = 48,
    height = 600,
    overscan = 5,
    loading = false,
    emptyMessage = 'Nenhum dado encontrado',
    sortBy,
    sortDirection = 'asc',
    onSort,
    rowClassName,
    onRowClick,
    className = '',
    stickyHeader = true,
    virtualized,
    threshold = 100,
  }: VirtualizedTableProps<T>
) => {
  const listRef = useRef<List>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Auto-detect se deve virtualizar
  const shouldVirtualize = useMemo(() => {
    if (typeof virtualized === 'boolean') return virtualized;
    return useListSizeDetection(data.length, threshold);
  }, [data.length, threshold, virtualized]);

  // Debounced scroll handler
  const debouncedScrollHandler = useDebouncedCallback(
    useCallback((info: any) => {
      // Aqui você pode adicionar analytics ou cache de scroll
      // console.log('Scroll position:', info);
    }, []),
    16 // ~60fps
  );

  // Calcular colunas total width
  const totalColumnWidth = useMemo(() => {
    return columns.reduce((total, column) => {
      return total + (column.width || 120);
    }, 0);
  }, [columns]);

  // Handler de redimensionamento
  useEffect(() => {
    const updateWidth = () => {
      if (listRef.current) {
        const container = listRef.current.container as HTMLElement;
        if (container) {
          setContainerWidth(container.offsetWidth);
        }
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (listRef.current) {
      const container = listRef.current.container as HTMLElement;
      if (container) {
        resizeObserver.observe(container);
      }
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Memoized header
  const header = useMemo(
    () => (
      <TableHeaderRow
        columns={columns}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={onSort}
        sticky={stickyHeader}
        itemHeight={itemHeight}
      />
    ),
    [columns, sortBy, sortDirection, onSort, stickyHeader, itemHeight]
  );

  // Memoized row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = data[index];
      
      if (!item && loading) {
        return (
          <TableRow style={style}>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        );
      }

      if (!item) return null;

      return (
        <TableRowVirtualized
          item={item}
          index={index}
          columns={columns}
          style={style}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
        />
      );
    },
    [data, columns, loading, rowClassName, onRowClick]
  );

  // Loading state
  if (loading && data.length === 0) {
    return (
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        <Table>
          {header}
        </Table>
        <TableSkeleton columns={columns} itemHeight={itemHeight} />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <Table>
          {header}
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Se não deve virtualizar, renderizar tabela normal
  if (!shouldVirtualize) {
    return (
      <div className={`border rounded-lg overflow-auto max-h-[${height}px] ${className}`}>
        <Table>
          {header}
          <TableBody>
            {data.map((item, index) => (
              <TableRowVirtualized
                key={index}
                item={item}
                index={index}
                columns={columns}
                style={{ height: itemHeight }}
                rowClassName={rowClassName}
                onRowClick={onRowClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Tabela virtualizada
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        {header}
      </Table>
      <div style={{ height: height - (stickyHeader ? itemHeight : 0) }}>
        <List
          ref={listRef}
          height={height - (stickyHeader ? itemHeight : 0)}
          itemCount={data.length}
          itemSize={itemHeight}
          width={containerWidth || '100%'}
          overscan={overscan}
          onItemsRendered={debouncedScrollHandler}
        >
          {Row}
        </List>
      </div>
    </div>
  );
};

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;