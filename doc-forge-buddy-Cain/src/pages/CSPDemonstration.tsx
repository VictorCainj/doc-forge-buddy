/**
 * Content Security Policy (CSP) - Demonstracão Completa
 * Arquivo de referencia para todos os componentes implementados
 */

import React from 'react';
import DynamicContentCSP from '../examples/DynamicContentCSP';

// Arquivo de referência - demonstrar todas as funcionalidades CSP
const CSPDemonstration: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🛡️ Content Security Policy (CSP)
          </h1>
          <p className="text-xl text-gray-600">
            Implementação completa e robusta para proteção contra XSS
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              ✅ Produção Ready
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              🔒 OWASP Compliant
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              📊 Monitoramento Ativo
            </span>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">🛡️ Proteção XSS</h3>
            <p className="text-sm text-gray-600">
              Scripts maliciosos são bloqueados automaticamente. 
              Nonce system implementado para elementos seguros.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">📊 Monitoramento</h3>
            <p className="text-sm text-gray-600">
              Violações detectadas em tempo real. 
              Dashboard visual e relatórios automatizados.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">🔧 Configuração</h3>
            <p className="text-sm text-gray-600">
              Ambientes separados (dev/prod). 
              Scripts npm para validação automática.
            </p>
          </div>
        </div>

        {/* Implementation Details */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 Componentes Implementados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Core Libraries</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <code>src/lib/csp-config.ts</code> - Configuração CSP</li>
                <li>• <code>src/lib/csp-middleware.ts</code> - Middleware Express</li>
                <li>• <code>server.ts</code> - Servidor de demonstração</li>
                <li>• <code>scripts/csp-validator.ts</code> - Validador automatizado</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">React Components</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <code>src/hooks/useCSP.ts</code> - Hook para CSP</li>
                <li>• <code>src/components/CSPMonitor.tsx</code> - Monitor visual</li>
                <li>• <code>src/examples/DynamicContentCSP.tsx</code> - Exemplo prático</li>
                <li>• <code>e2e/csp.spec.ts</code> - Testes Playwright</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Examples */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ⚙️ Configurações CSP
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Desenvolvimento</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Produção (Restritivo)</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`default-src 'self';
script-src 'self' 'nonce-{unique-nonce}';
style-src 'self' 'nonce-{unique-nonce}';
img-src 'self' data: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;`}
              </pre>
            </div>
          </div>
        </div>

        {/* Scripts Available */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🚀 Scripts Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">NPM Scripts</h3>
              <div className="space-y-2 text-sm">
                <div><code>npm run csp:validate</code> - Validação completa</div>
                <div><code>npm run csp:test</code> - Testar localhost</div>
                <div><code>npm run csp:prod</code> - Testar produção</div>
                <div><code>npm run csp:server</code> - Servidor demo</div>
                <div><code>npm run csp:dev</code> - Dev + servidor</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Manual Validation</h3>
              <div className="space-y-2 text-sm">
                <div><code>npx tsx scripts/csp-validator.ts</code></div>
                <div><code>npx tsx scripts/csp-validator.ts &lt;url&gt;</code></div>
                <div><code>npx tsx scripts/csp-validator.ts &lt;url&gt; &lt;output&gt;</code></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🧪 Demonstração Interativa
          </h2>
          <p className="text-gray-600 mb-4">
            Componente de exemplo mostrando nonce, monitoramento e violações em tempo real:
          </p>
          <DynamicContentCSP />
        </div>

        {/* Testing URLs */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔍 URLs de Teste
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Portal Principal</h3>
              <ul className="space-y-2 text-sm">
                <li>• <a href="/" className="text-blue-600 hover:underline">Homepage CSP Demo</a></li>
                <li>• <a href="/security-headers" className="text-blue-600 hover:underline">Security Headers</a></li>
                <li>• <a href="/test-csp?type=script" className="text-blue-600 hover:underline">Test Script</a></li>
                <li>• <a href="/test-csp?type=iframe" className="text-blue-600 hover:underline">Test Iframe</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Relatórios</h3>
              <ul className="space-y-2 text-sm">
                <li>• <code>POST /csp-report</code> - Violação report</li>
                <li>• <code>csp-config.json</code> - Configuração gerada</li>
                <li>• <code>csp-validation-report.json</code> - Relatório de validação</li>
                <li>• Console do navegador - Violações em tempo real</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🛡️ Benefícios de Segurança
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-red-600 text-xl">🚫</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">XSS Prevention</h3>
              <p className="text-sm text-gray-600">
                Scripts maliciosos são bloqueados antes da execução
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Clickjacking Protection</h3>
              <p className="text-sm text-gray-600">
                Iframes maliciosos são bloqueados automaticamente
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time Monitoring</h3>
              <p className="text-sm text-gray-600">
                Violações detectadas e reportadas instantaneamente
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📚 Documentação
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Guias Completos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <code>CSP_IMPLEMENTATION_GUIDE.md</code> - Guia detalhado</li>
                <li>• <code>CSP_IMPLEMENTATION_SUMMARY.md</code> - Resumo executivo</li>
                <li>• Código fonte comentado em todos os arquivos</li>
                <li>• Exemplos práticos de uso</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Referências</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" 
                       className="text-blue-600 hover:underline" target="_blank">MDN CSP Guide</a></li>
                <li>• <a href="https://owasp.org/www-community/attacks/xss/" 
                       className="text-blue-600 hover:underline" target="_blank">OWASP XSS Prevention</a></li>
                <li>• <a href="https://www.w3.org/TR/CSP/" 
                       className="text-blue-600 hover:underline" target="_blank">W3C CSP Standard</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="text-center py-6 bg-gray-50 rounded-lg border">
          <div className="flex justify-center items-center space-x-2 mb-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="font-semibold text-gray-800">Implementação CSP Concluída</span>
          </div>
          <p className="text-sm text-gray-600">
            Status: <span className="font-medium text-green-600">Produção Ready</span> | 
            Versão: <span className="font-medium">1.0.0</span> | 
            Data: <span className="font-medium">09/11/2025</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CSPDemonstration;