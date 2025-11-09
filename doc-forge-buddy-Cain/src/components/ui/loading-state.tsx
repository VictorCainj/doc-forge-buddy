import { Skeleton } from './skeleton';
import { Loader2 } from '@/utils/iconMapper';
import { LoadingOverlay } from './loading-overlay';

/**
 * Variantes de loading states disponíveis
 */
export type LoadingVariant = 'skeleton' | 'spinner' | 'overlay';

/**
 * Props do componente LoadingState
 */
export interface LoadingStateProps {
  /**
   * Variante do loading state
   * @default 'skeleton'
   */
  variant?: LoadingVariant;

  /**
   * Mensagem opcional exibida no loading
   */
  message?: string;

  /**
   * Número de linhas skeleton (apenas para variant='skeleton')
   * @default 3
   */
  rows?: number;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Componente centralizado para exibir estados de carregamento
 *
 * Fornece 3 variantes diferentes de loading para diferentes contextos:
 * - `skeleton`: Para cards e listas (Placeholder do conteúdo)
 * - `spinner`: Para ações e formulários (Feedback simples)
 * - `overlay`: Para operações bloqueantes (Tela cheia)
 *
 * @example
 * ```tsx
 * // Usar em listas
 * {loading && <LoadingState variant="skeleton" rows={5} />}
 *
 * // Usar em formulários
 * {loading && <LoadingState variant="spinner" message="Salvando..." />}
 *
 * // Usar em operações críticas
 * {loading && <LoadingState variant="overlay" message="Processando..." />}
 * ```
 *
 * @param props - Props do componente
 * @returns JSX do estado de loading
 */
export function LoadingState({
  variant = 'skeleton',
  message,
  rows = 3,
  className = '',
}: LoadingStateProps) {
  // Variant: skeleton - Para placeholder de conteúdo
  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Variant: spinner - Para feedback simples
  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <span className="ml-3 text-muted-foreground">{message}</span>
        )}
      </div>
    );
  }

  // Variant: overlay - Para operações bloqueantes
  if (variant === 'overlay') {
    return <LoadingOverlay message={message} />;
  }

  return null;
}
