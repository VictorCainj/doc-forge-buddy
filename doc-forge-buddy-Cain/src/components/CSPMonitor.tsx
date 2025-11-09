/**
 * Componente de Monitoramento de Content Security Policy (CSP)
 * Exibe violações em tempo real e fornece ferramentas de diagnóstico
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { useCSP } from '../hooks/useCSP';

interface CSPMonitorProps {
  isVisible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const CSPMonitor: React.FC<CSPMonitorProps> = ({ 
  isVisible = process.env.NODE_ENV === 'development', 
  position = 'bottom-right' 
}) => {
  const {
    violations,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearViolations,
    getCSPConfig,
    validateCurrentCSP
  } = useCSP();

  const [isExpanded, setIsExpanded] = useState(false);
  const [cspConfig, setCSPConfig] = useState(getCSPConfig());
  const [validation, setValidation] = useState(validateCurrentCSP());

  useEffect(() => {
    setCSPConfig(getCSPConfig());
    setValidation(validateCurrentCSP());
  }, [getCSPConfig, validateCurrentCSP]);

  useEffect(() => {
    if (isVisible) {
      startMonitoring();
    }
  }, [isVisible, startMonitoring]);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getViolationColor = (directive: string) => {
    if (directive.includes('script')) return 'text-red-600 bg-red-50';
    if (directive.includes('style')) return 'text-orange-600 bg-orange-50';
    if (directive.includes('img')) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const getRecentViolations = () => {
    return violations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Widget de status */}
      <div className={`
        bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300
        ${isExpanded ? 'w-96' : 'w-80'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm text-gray-800">CSP Monitor</span>
            {violations.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                {violations.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Status indicator */}
            <div className={`
              w-2 h-2 rounded-full 
              ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}
            `} />
            
            {/* Botão expandir/colapsar */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Status summary */}
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Monitoramento:</span>
            <span className={`font-medium ${isMonitoring ? 'text-green-600' : 'text-gray-400'}`}>
              {isMonitoring ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {validation.warnings.length > 0 && (
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {validation.warnings.length} aviso{validation.warnings.length > 1 ? 's' : ''} de segurança
              </span>
            </div>
          )}

          {violations.length === 0 && isMonitoring && (
            <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Nenhuma violação detectada
              </span>
            </div>
          )}
        </div>

        {/* Violações recentes */}
        {isExpanded && (
          <div className="border-t border-gray-200">
            <div className="p-3 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm text-gray-800">Violações Recentes</h4>
                <div className="flex space-x-1">
                  <button
                    onClick={clearViolations}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Limpar violações"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    className="p-1 hover:bg-gray-100 rounded"
                    title={isMonitoring ? 'Parar monitoramento' : 'Iniciar monitoramento'}
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getRecentViolations().map((violation, index) => (
                  <div
                    key={`${violation.timestamp}-${index}`}
                    className={`p-2 rounded border text-xs ${getViolationColor(violation.violatedDirective)}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">
                        {violation.violatedDirective}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(violation.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-1 opacity-90">
                      <div>
                        <span className="font-medium">Bloqueado:</span>{' '}
                        <span className="font-mono break-all">{violation.blockedURI}</span>
                      </div>
                      {violation.sourceFile && (
                        <div>
                          <span className="font-medium">Arquivo:</span>{' '}
                          <span className="font-mono">{violation.sourceFile}</span>
                          {violation.lineNumber && (
                            <span>:{violation.lineNumber}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {getRecentViolations().length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhuma violação detectada
                  </div>
                )}
              </div>
            </div>

            {/* Configuração CSP */}
            {cspConfig && (
              <div className="border-t border-gray-200 p-3">
                <h4 className="font-medium text-sm text-gray-800 mb-2">Configuração CSP</h4>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(cspConfig).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium text-gray-600 min-w-20">{key}:</span>
                      <span className="font-mono text-gray-800 ml-2">
                        {Array.isArray(value) ? value.join(' ') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avisos de validação */}
            {validation.warnings.length > 0 && (
              <div className="border-t border-gray-200 p-3">
                <h4 className="font-medium text-sm text-gray-800 mb-2">Avisos de Segurança</h4>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CSPMonitor;