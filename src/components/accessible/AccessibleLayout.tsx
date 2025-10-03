/**
 * Layout Acessível com Estrutura Semântica
 * Implementa landmarks e navegação por teclado
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SkipLink } from './SkipLink';

export interface AccessibleLayoutProps {
  children: React.ReactNode;
  /** Título da página para screen readers */
  pageTitle: string;
  /** Descrição da página */
  pageDescription?: string;
  /** Mostrar skip links */
  showSkipLinks?: boolean;
  /** Classe CSS customizada */
  className?: string;
}

export const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  pageTitle,
  pageDescription,
  showSkipLinks = true,
  className,
}) => {
  const mainRef = useRef<HTMLElement>(null);

  // ✅ Anunciar mudanças de página para screen readers
  useEffect(() => {
    // Atualizar título da página
    document.title = `${pageTitle} - ContractPro`;
    
    // Focar no conteúdo principal quando a página muda
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [pageTitle]);

  return (
    <>
      {/* ✅ Skip Links para navegação rápida */}
      {showSkipLinks && (
        <>
          <SkipLink href="#main-content">Pular para o conteúdo principal</SkipLink>
          <SkipLink href="#navigation">Pular para a navegação</SkipLink>
        </>
      )}

      {/* ✅ Estrutura semântica com landmarks */}
      <div className={cn('min-h-screen bg-background', className)}>
        {/* ✅ Cabeçalho da aplicação */}
        <header 
          role="banner"
          className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {/* ✅ Título da página (oculto visualmente, mas acessível) */}
          <h1 className="sr-only">{pageTitle}</h1>
          
          {/* ✅ Descrição da página */}
          {pageDescription && (
            <p className="sr-only">{pageDescription}</p>
          )}
        </header>

        <div className="flex">
          {/* ✅ Navegação principal */}
          <nav 
            id="navigation"
            role="navigation"
            aria-label="Navegação principal"
            className="w-64 border-r border-border bg-background"
          >
            {/* Sidebar será renderizada aqui */}
          </nav>

          {/* ✅ Conteúdo principal */}
          <main 
            id="main-content"
            ref={mainRef}
            role="main"
            aria-label="Conteúdo principal"
            className="flex-1 overflow-hidden"
            tabIndex={-1} // Permite foco programático
          >
            {children}
          </main>
        </div>

        {/* ✅ Rodapé (se necessário) */}
        <footer 
          role="contentinfo"
          className="border-t border-border bg-background p-4 text-center text-sm text-muted-foreground"
        >
          <p>&copy; 2024 ContractPro - Gestão Imobiliária. Todos os direitos reservados.</p>
        </footer>
      </div>

      {/* ✅ Região para anúncios de screen reader */}
      <div
        id="announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ✅ Região para alertas urgentes */}
      <div
        id="alerts"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};

// ✅ Componente Skip Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className={cn(
        // ✅ Oculto por padrão, visível no foco
        'sr-only focus:not-sr-only',
        // ✅ Posicionamento e estilo quando visível
        'focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            (target as HTMLElement).focus();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }}
    >
      {children}
    </a>
  );
};
