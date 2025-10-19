import { useMemo } from 'react';
import { validateHTML } from '@/utils/securityValidators';

/**
 * Hook para sanitizar HTML de forma segura
 * Remove scripts maliciosos e elementos perigosos mantendo apenas tags permitidas
 *
 * @param html - String HTML a ser sanitizada
 * @returns HTML sanitizado e seguro para renderização
 *
 * @example
 * ```tsx
 * const MyComponent = ({ content }) => {
 *   const safeHTML = useSafeHTML(content);
 *   return <div dangerouslySetInnerHTML={{ __html: safeHTML }} />;
 * };
 * ```
 */
export const useSafeHTML = (html: string): string => {
  return useMemo(() => {
    if (!html) return '';
    return validateHTML(html);
  }, [html]);
};
