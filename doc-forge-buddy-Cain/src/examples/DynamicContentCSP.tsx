/**
 * Exemplo prático de uso de Nonce com Content Security Policy (CSP)
 * Demonstra como aplicar CSP de forma segura em elementos dinâmicos
 */

import React, { useState, useEffect } from 'react';
import { useCSP } from '../hooks/useCSP';
import { generateNonce, applyNonceToElement } from '../lib/csp-config';

interface DynamicContentProps {
  children?: React.ReactNode;
}

const DynamicContent: React.FC<DynamicContentProps> = ({ children }) => {
  const { nonce, applyNonce, violations } = useCSP();
  const [injectedStyles, setInjectedStyles] = useState<string[]>([]);
  const [injectedScripts, setInjectedScripts] = useState<string[]>([]);

  // Exemplo 1: Aplicar nonce a script dinâmico
  const createSecureScript = (content: string) => {
    if (!nonce) {
      console.warn('Nonce não disponível para script dinâmico');
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('nonce', nonce);
    script.textContent = content;
    
    // Aplicar nonce
    applyNonce(script);
    
    // Executar script
    document.head.appendChild(script);
    
    setInjectedScripts(prev => [...prev, content.substring(0, 50) + '...']);
  };

  // Exemplo 2: Aplicar nonce a estilos dinâmicos
  const createSecureStyles = (cssContent: string) => {
    if (!nonce) {
      console.warn('Nonce não disponível para estilos dinâmicos');
      return;
    }

    const style = document.createElement('style');
    style.setAttribute('nonce', nonce);
    style.textContent = cssContent;
    
    // Aplicar nonce
    applyNonce(style);
    
    document.head.appendChild(style);
    
    setInjectedStyles(prev => [...prev, cssContent.substring(0, 50) + '...']);
  };

  // Exemplo 3: Injeção segura de HTML
  const secureHTMLInjection = (htmlContent: string) => {
    // AVISO: Esta função é para fins educacionais apenas
    // Em produção, use bibliotecas como DOMPurify
    const safeContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');

    const container = document.createElement('div');
    container.innerHTML = safeContent;
    return container.innerHTML;
  };

  // Demonstração automática
  useEffect(() => {
    if (nonce) {
      // Exemplo de script seguro
      createSecureScript(`
        console.log('Script executado com sucesso usando nonce:', '${nonce}');
        window.secureScriptExecuted = true;
      `);

      // Exemplo de estilos seguros
      createSecureStyles(`
        [nonce="${nonce}"] {
          --primary-color: #007bff;
          --secondary-color: #6c757d;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `);
    }
  }, [nonce]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        🛡️ Demonstração de Nonce CSP
      </h2>

      {/* Status do Nonce */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Status do Nonce</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Nonce Ativo:</span>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
              {nonce || 'Carregando...'}
            </code>
          </div>
          <div>
            <span className="font-medium">Scripts Injetados:</span> {injectedScripts.length}
          </div>
          <div>
            <span className="font-medium">Estilos Injetados:</span> {injectedStyles.length}
          </div>
          <div>
            <span className="font-medium">Violações Detectadas:</span>{' '}
            <span className={violations.length > 0 ? 'text-red-600' : 'text-green-600'}>
              {violations.length}
            </span>
          </div>
        </div>
      </div>

      {/* Scripts Injetados */}
      {injectedScripts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ Scripts Executados com Nonce
          </h3>
          <div className="space-y-2">
            {injectedScripts.map((script, index) => (
              <div key={index} className="text-sm">
                <code className="bg-green-100 px-2 py-1 rounded text-xs block">
                  {script}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos Injetados */}
      {injectedStyles.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-2">
            🎨 Estilos Aplicados com Nonce
          </h3>
          <div className="space-y-2">
            {injectedStyles.map((style, index) => (
              <div key={index} className="text-sm">
                <code className="bg-purple-100 px-2 py-1 rounded text-xs block">
                  {style}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violações Recentes */}
      {violations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">
            🚨 Violações CSP Recentes
          </h3>
          <div className="space-y-2">
            {violations.slice(-3).map((violation, index) => (
              <div key={index} className="text-sm bg-red-100 p-2 rounded">
                <div className="font-medium">{violation.violatedDirective}</div>
                <div className="text-xs text-red-700">
                  Bloqueado: {violation.blockedURI}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de Teste */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-4">🧪 Testes Manuais</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => createSecureScript('console.log("Teste manual executado!");')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Executar Script Seguro
          </button>
          
          <button
            onClick={() => createSecureStyles(`
              [nonce="${nonce}"] {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                padding: 10px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
              }
            `)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Aplicar Estilos Seguros
          </button>
          
          <button
            onClick={() => {
              try {
                // Tentativa de injeção insegura (deve ser bloqueada)
                const script = document.createElement('script');
                script.innerHTML = 'alert("XSS - deve ser bloqueado!");';
                document.head.appendChild(script);
              } catch (e) {
                console.log('Injeção insegura foi bloqueada:', e);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Testar XSS (Deve ser Bloqueado)
          </button>
        </div>
      </div>

      {/* Exemplos de Código */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-4">📖 Exemplos de Código</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">1. Script com Nonce</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const script = document.createElement('script');
script.setAttribute('nonce', '${nonce || '<nonce>'}');
script.textContent = 'console.log("Seguro!");';
document.head.appendChild(script);`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">2. Estilos com Nonce</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const style = document.createElement('style');
style.setAttribute('nonce', '${nonce || '<nonce>'}');
style.textContent = '.classe { color: red; }';
document.head.appendChild(style);`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">3. Aplicar Nonce a Elemento Existente</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const element = document.getElementById('meu-elemento');
if (element && '${nonce || '<nonce>'}') {
  element.setAttribute('nonce', '${nonce || '<nonce>'}');
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Dicas de Segurança */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Dicas de Segurança</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>Sempre use nonces únicos para cada requisição</li>
          <li>Aplique nonces apenas a elementos necessários</li>
          <li>Monitore violações CSP regularmente</li>
          <li>Em produção, evite 'unsafe-inline' e 'unsafe-eval'</li>
          <li>Use bibliotecas de sanitização como DOMPurify</li>
        </ul>
      </div>

      {children}
    </div>
  );
};

export default DynamicContent;