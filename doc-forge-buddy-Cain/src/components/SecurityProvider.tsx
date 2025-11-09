import React, { useEffect } from 'react';
import { useSecurityHeaders, useSecurityTokens, useSecurityMonitoring } from '@/hooks/useSecurity';

interface SecurityProviderProps {
  children: React.ReactNode;
  enableCSP?: boolean;
  enableHTTPSRedirect?: boolean;
  enableSecurityHeaders?: boolean;
  sessionTimeout?: number;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  enableCSP = true,
  enableHTTPSRedirect = true,
  enableSecurityHeaders = true,
  sessionTimeout = 24 * 60 * 60 * 1000 // 24 horas
}) => {
  // Aplicar headers de segurança
  useSecurityHeaders({
    enableCSP,
    enableHTTPSRedirect,
    enableSecurityHeaders
  });

  // Gerenciar tokens de segurança
  const { csrfToken, sessionToken, refreshTokens, clearTokens } = useSecurityTokens();
  
  // Monitoramento de segurança
  const { addSecurityEvent } = useSecurityMonitoring();

  useEffect(() => {
    // Monitorar mudanças na URL (possíveis tentativas de manipulação)
    const handlePopState = () => {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        addSecurityEvent('insecure_protocol_attempt', {
          protocol: window.location.protocol,
          hostname: window.location.hostname
        });
      }
    };

    // Monitorar tentativas de abrir developer tools
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          addSecurityEvent('devtools_opened');
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Monitorar alterações de foco (possível inspeção)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addSecurityEvent('page_hidden');
      } else {
        addSecurityEvent('page_visible');
      }
    };

    // Monitorar cliques direitos (tentativas de context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addSecurityEvent('context_menu_attempt', {
        x: e.clientX,
        y: e.clientY
      });
    };

    // Monitorar teclas de desenvolvimento
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        addSecurityEvent('devtools_key_combination', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey
        });
      }
    };

    // Monitorar erros JavaScript
    const handleError = (e: ErrorEvent) => {
      addSecurityEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    };

    // Monitorar rejeições de promises
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      addSecurityEvent('unhandled_promise_rejection', {
        reason: e.reason
      });
    };

    // Event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('resize', detectDevTools);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Verificar periodicamente ferramentas de desenvolvimento
    const devtoolsInterval = setInterval(detectDevTools, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', detectDevTools);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearInterval(devtoolsInterval);
    };
  }, [addSecurityEvent]);

  // Refresh tokens antes de expirarem
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshTokens();
      addSecurityEvent('tokens_refreshed');
    }, sessionTimeout / 2); // Refresh na metade do tempo

    return () => clearInterval(refreshInterval);
  }, [sessionTimeout, refreshTokens, addSecurityEvent]);

  // Log de inicialização de segurança
  useEffect(() => {
    addSecurityEvent('security_provider_initialized', {
      enableCSP,
      enableHTTPSRedirect,
      enableSecurityHeaders,
      hasTokens: !!(csrfToken && sessionToken)
    });
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;