import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'Introdução',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Introduction story
export const Welcome = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Component Library
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Doc Forge Buddy - Documentação Visual de Componentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">UI Components</h3>
          <p className="text-gray-600 mb-4">
            Componentes fundamentais reutilizáveis com design system consistente
          </p>
          <div className="text-sm text-blue-600">
            15+ componentes disponíveis →
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Components</h3>
          <p className="text-gray-600 mb-4">
            Campos de formulário com validação e acessibilidade
          </p>
          <div className="text-sm text-blue-600">
            Inputs, selects, validação →
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Layout</h3>
          <p className="text-gray-600 mb-4">
            Componentes de layout e containers responsivos
          </p>
          <div className="text-sm text-blue-600">
            Sidebar, modais, grids →
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cards & Data</h3>
          <p className="text-gray-600 mb-4">
            Componentes para exibir dados e informações
          </p>
          <div className="text-sm text-blue-600">
            Cards, tables, charts →
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Accessibility</h3>
          <p className="text-gray-600 mb-4">
            Componentes com foco em acessibilidade e UX
          </p>
          <div className="text-sm text-blue-600">
            ARIA, keyboard navigation →
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
          <p className="text-gray-600 mb-4">
            Componentes otimizados para performance
          </p>
          <div className="text-sm text-blue-600">
            Lazy loading, virtualization →
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recursos do Design System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Design Tokens</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Cores baseadas no Google Material Design 3</li>
              <li>• Tipografia com Inter e Fira Code</li>
              <li>• Espaçamento consistente (4px base)</li>
              <li>• Shadows e borders padronizados</li>
              <li>• Breakpoints responsivos</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Acessibilidade</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• WCAG 2.1 AA compliant</li>
              <li>• Keyboard navigation completa</li>
              <li>• Screen reader support</li>
              <li>• Focus management</li>
              <li>• ARIA attributes</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-8 shadow-sm border mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Como usar esta biblioteca</h2>
        
        <div className="space-y-4 text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Navegação</h3>
            <p>Use a barra lateral para navegar entre categorias de componentes. Cada componente tem múltiplas variações e estados demonstrados.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Controls</h3>
            <p>Use o painel de controles para testar diferentes props e configurações em tempo real.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Documentation</h3>
            <p>Cada story inclui documentação completa com exemplos de uso, APIs e design tokens.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Code</h3>
            <p>Clique na aba "Code" para ver o código-fonte e copiar exemplos de implementação.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Construído com React, TypeScript, Tailwind CSS e Storybook
        </p>
      </div>
    </div>
  </div>
);