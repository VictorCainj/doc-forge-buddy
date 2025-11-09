/**
 * React Hook para Content Security Policy (CSP)
 * Gerencia nonce, monitoramento de violações e validação
 */

import { useEffect, useState, useCallback } from 'react';
import { generateNonce, validateCSP, type CSPConfig } from '../lib/csp-config';

interface CSPViolation {
  documentURI: string;
  blockedURI: string;
  violatedDirective: string;
  originalPolicy: string;
  sourceFile: string;
  lineNumber?: number;
  columnNumber?: number;
  disposition: 'enforce' | 'report';
  referrer: string;
  sample: string;
  statusCode: number;
  timestamp: number;
}

interface CSPHookReturn {
  nonce: string | null;
  violations: CSPViolation[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearViolations: () => void;
  reportViolation: (violation: CSPViolation) => void;
  getCSPConfig: () => CSPConfig | null;
  validateCurrentCSP: () => { isValid: boolean; warnings: string[] };
  applyNonce: (element: HTMLElement) => void;
}

export const useCSP = (): CSPHookReturn => {
  const [nonce, setNonce] = useState<string | null>(null);
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Inicializar nonce
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const headerNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
      if (headerNonce) {
        setNonce(headerNonce);
      } else {
        const newNonce = generateNonce();
        setNonce(newNonce);
        
        // Adicionar como meta tag
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'csp-nonce');
        metaTag.setAttribute('content', newNonce);
        document.head.appendChild(metaTag);
      }
    }
  }, []);

  // Monitorar violações CSP
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        documentURI: event.documentURI,
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        disposition: event.disposition,
        referrer: event.referrer,
        sample: event.sample,
        statusCode: 0, // Não disponível no navegador
        timestamp: Date.now()
      };

      setViolations(prev => [...prev, violation]);
      
      // Log da violação
      console.warn('CSP Violation detected:', violation);
      
      // Reportar para endpoint se disponível
      reportViolation(violation);
    };

    // Adicionar listener
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    setIsMonitoring(true);

    // Cleanup
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
      setIsMonitoring(false);
    };
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const clearViolations = useCallback(() => {
    setViolations([]);
  }, []);

  const reportViolation = useCallback(async (violation: CSPViolation) => {
    try {
      await fetch('/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }, []);

  const getCSPConfig = useCallback((): CSPConfig | null => {
    const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaTag) return null;

    const content = metaTag.getAttribute('content');
    if (!content) return null;

    // Parse básico do CSP (simplificado)
    const directives = content.split(';').reduce((acc, directive) => {
      const [key, ...values] = directive.trim().split(' ');
      if (key && values.length > 0) {
        acc[key] = values;
      }
      return acc;
    }, {} as Record<string, string[]>);

    return {
      defaultSrc: directives['default-src'] || ["'self'"],
      scriptSrc: directives['script-src'] || ["'self'"],
      styleSrc: directives['style-src'] || ["'self'"],
      imgSrc: directives['img-src'] || ["'self'"],
      fontSrc: directives['font-src'] || ["'self'"],
      connectSrc: directives['connect-src'] || ["'self'"],
      frameSrc: directives['frame-src'] || ["'none'"],
      objectSrc: directives['object-src'] || ["'none'"],
      baseUri: directives['base-uri']?.[0] || "'self'",
      formAction: directives['form-action']?.[0] || "'self'",
      upgradeInsecureRequests: content.includes('upgrade-insecure-requests')
    };
  }, []);

  const validateCurrentCSP = useCallback(() => {
    const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content');
    if (!cspHeader) {
      return {
        isValid: false,
        warnings: ['CSP meta tag não encontrada']
      };
    }
    return validateCSP(cspHeader);
  }, []);

  const applyNonce = useCallback((element: HTMLElement) => {
    if (nonce && (element.tagName === 'SCRIPT' || element.tagName === 'STYLE')) {
      element.setAttribute('nonce', nonce);
    }
  }, [nonce]);

  return {
    nonce,
    violations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearViolations,
    reportViolation,
    getCSPConfig,
    validateCurrentCSP,
    applyNonce
  };
};

export default useCSP;