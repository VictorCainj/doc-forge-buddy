import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Design Tokens definem as variáveis fundamentais do nosso design system, garantindo consistência visual e facilitando a manutenção.

## Características

- **Cores**: Paleta baseada no Google Material Design 3
- **Tipografia**: Inter para UI, Fira Code para código
- **Espaçamento**: Sistema baseado em múltiplos de 4px
- **Bordas**: Radius e width consistentes
- **Shadows**: Elevação Material Design
- **Breakpoints**: Sistema responsivo otimizado
        `,
      },
    },
  },
};

export default meta;

// Colors
export const Colors: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Cores Primárias</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Primary 50', value: '#eff6ff', hex: '#3b82f6' },
            { name: 'Primary 100', value: '#dbeafe', hex: '#3b82f6' },
            { name: 'Primary 200', value: '#bfdbfe', hex: '#3b82f6' },
            { name: 'Primary 300', value: '#93c5fd', hex: '#3b82f6' },
            { name: 'Primary 400', value: '#60a5fa', hex: '#3b82f6' },
            { name: 'Primary 500', value: '#3b82f6', hex: '#3b82f6' },
          ].map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <div className="text-xs font-medium">{color.name}</div>
              <div className="text-xs text-gray-500">{color.hex}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Cores Semânticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Success', value: '#10b981', description: 'Estados positivos' },
            { name: 'Warning', value: '#f59e0b', description: 'Atenção' },
            { name: 'Error', value: '#ef4444', description: 'Erros' },
            { name: 'Info', value: '#3b82f6', description: 'Informações' },
          ].map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="w-20 h-20 rounded-lg mx-auto mb-2 border shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <div className="text-sm font-medium">{color.name}</div>
              <div className="text-xs text-gray-500">{color.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Escala de Cinza</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: '50', value: '#f9fafb' },
            { name: '100', value: '#f3f4f6' },
            { name: '200', value: '#e5e7eb' },
            { name: '300', value: '#d1d5db' },
            { name: '400', value: '#9ca3af' },
            { name: '500', value: '#6b7280' },
            { name: '600', value: '#4b5563' },
            { name: '700', value: '#374151' },
            { name: '800', value: '#1f2937' },
            { name: '900', value: '#111827' },
          ].map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="w-16 h-16 rounded-lg mx-auto mb-2 border shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <div className="text-xs font-medium">Gray {color.name}</div>
              <div className="text-xs text-gray-500">{color.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Typography
export const Typography: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Família de Fontes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Interface (Inter)</h3>
            <p className="font-normal text-2xl">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
            <p className="font-normal text-lg">a b c d e f g h i j k l m n o p q r s t u v w x y z</p>
            <p className="font-normal">0 1 2 3 4 5 6 7 8 9</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Monospace (Fira Code)</h3>
            <code className="font-mono">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</code>
            <br />
            <code className="font-mono">a b c d e f g h i j k l m n o p q r s t u v w x y z</code>
            <br />
            <code className="font-mono">0 1 2 3 4 5 6 7 8 9</code>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Escala Tipográfica</h2>
        <div className="space-y-6">
          {[
            { name: 'Display Large', size: '2.25rem (36px)', weight: 700, class: 'text-4xl' },
            { name: 'Display Medium', size: '1.875rem (30px)', weight: 600, class: 'text-3xl' },
            { name: 'Display Small', size: '1.5rem (24px)', weight: 600, class: 'text-2xl' },
            { name: 'Heading Large', size: '1.25rem (20px)', weight: 600, class: 'text-xl' },
            { name: 'Heading Medium', size: '1.125rem (18px)', weight: 500, class: 'text-lg' },
            { name: 'Heading Small', size: '1rem (16px)', weight: 500, class: 'text-base' },
            { name: 'Body Large', size: '1rem (16px)', weight: 400, class: 'text-base' },
            { name: 'Body Medium', size: '0.875rem (14px)', weight: 400, class: 'text-sm' },
            { name: 'Body Small', size: '0.75rem (12px)', weight: 400, class: 'text-xs' },
          ].map((typography) => (
            <div key={typography.name} className="flex items-center space-x-4">
              <div className="w-32 text-xs text-gray-500">
                {typography.name}
              </div>
              <div className="flex-1">
                <p 
                  className={typography.class} 
                  style={{ fontSize: typography.size.split(' ')[0], fontWeight: typography.weight }}
                >
                  O quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="w-32 text-xs text-gray-500 text-right">
                {typography.size}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Spacing
export const Spacing: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Sistema de Espaçamento</h2>
        <div className="space-y-4">
          {[
            { name: '4xs (1px)', value: '0.25rem', pixels: '1px' },
            { name: '3xs (2px)', value: '0.5rem', pixels: '2px' },
            { name: '2xs (4px)', value: '1rem', pixels: '4px' },
            { name: 'xs (8px)', value: '0.5rem', pixels: '8px' },
            { name: 'sm (12px)', value: '0.75rem', pixels: '12px' },
            { name: 'md (16px)', value: '1rem', pixels: '16px' },
            { name: 'lg (24px)', value: '1.5rem', pixels: '24px' },
            { name: 'xl (32px)', value: '2rem', pixels: '32px' },
            { name: '2xl (48px)', value: '3rem', pixels: '48px' },
            { name: '3xl (64px)', value: '4rem', pixels: '64px' },
          ].map((spacing) => (
            <div key={spacing.name} className="flex items-center space-x-4">
              <div className="w-24 text-xs text-gray-500">
                {spacing.name}
              </div>
              <div
                className="bg-blue-500 rounded"
                style={{ 
                  width: spacing.pixels, 
                  height: '1rem',
                  minHeight: '16px'
                }}
              />
              <div className="text-sm">{spacing.value}</div>
              <div className="text-sm text-gray-500">({spacing.pixels})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Borders
export const Borders: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'None', radius: '0', class: 'rounded-none' },
            { name: 'Small (4px)', radius: '0.25rem', class: 'rounded-sm' },
            { name: 'Medium (8px)', radius: '0.5rem', class: 'rounded-md' },
            { name: 'Large (12px)', radius: '0.75rem', class: 'rounded-lg' },
            { name: 'Extra Large (16px)', radius: '1rem', class: 'rounded-xl' },
            { name: 'Full (9999px)', radius: '9999px', class: 'rounded-full' },
          ].map((border) => (
            <div key={border.name} className="text-center">
              <div
                className={`w-16 h-16 bg-gray-200 mx-auto mb-2 border-2 border-gray-300 ${border.class}`}
              />
              <div className="text-sm font-medium">{border.name}</div>
              <div className="text-xs text-gray-500">{border.radius}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Border Width</h2>
        <div className="space-y-4">
          {[
            { name: 'None', width: '0', class: 'border-0' },
            { name: 'Thin (1px)', width: '1px', class: 'border' },
            { name: 'Medium (2px)', width: '2px', class: 'border-2' },
            { name: 'Thick (4px)', width: '4px', class: 'border-4' },
          ].map((border) => (
            <div key={border.name} className="flex items-center space-x-4">
              <div className="w-32 text-sm">{border.name}</div>
              <div
                className={`w-16 h-16 bg-gray-200 border-gray-400 ${border.class}`}
              />
              <div className="text-sm text-gray-500">{border.width}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Shadows
export const Shadows: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Sistema de Sombras</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Elevation 1', description: 'Cards, botões', class: 'shadow-sm' },
            { name: 'Elevation 2', description: 'Dropdowns, menus', class: 'shadow-md' },
            { name: 'Elevation 3', description: 'Modais, popovers', class: 'shadow-lg' },
            { name: 'Elevation 4', description: 'Modais importantes', class: 'shadow-xl' },
            { name: 'Elevation 5', description: 'Alertas, banners', class: 'shadow-2xl' },
          ].map((shadow) => (
            <div key={shadow.name} className="text-center">
              <div
                className={`w-24 h-24 bg-white mx-auto mb-4 border ${shadow.class}`}
              />
              <div className="text-sm font-medium">{shadow.name}</div>
              <div className="text-xs text-gray-500">{shadow.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// Breakpoints
export const Breakpoints: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Breakpoints Responsivos</h2>
        <div className="space-y-4">
          {[
            { name: 'Mobile', min: '0px', max: '640px', description: 'Smartphones' },
            { name: 'Tablet', min: '641px', max: '1024px', description: 'Tablets' },
            { name: 'Desktop', min: '1025px', max: '1440px', description: 'Laptops' },
            { name: 'Large Desktop', min: '1441px', max: '∞', description: 'Monitores grandes' },
          ].map((breakpoint) => (
            <div key={breakpoint.name} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-32 text-sm font-medium">{breakpoint.name}</div>
              <div className="text-sm text-gray-500">
                {breakpoint.min} - {breakpoint.max}
              </div>
              <div className="text-sm text-gray-500">({breakpoint.description})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};