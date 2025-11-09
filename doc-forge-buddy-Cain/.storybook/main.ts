import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/stories/**/*.stories.@(ts|tsx|mdx)',
    '../src/components/**/*.stories.@(ts|tsx|mdx)',
    '../src/components/ui-stories/**/*.stories.@(ts|tsx|mdx)',
    '../src/**/*.stories.@(ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-mdx-gfm',
    '@storybook/addon-design-tokens',
    'storybook-addon-designs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        fsCache: true,
        fastRefresh: true,
      },
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      shouldExtractValuesFromUnion: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
      savePropsDescription: true,
    },
  },
  staticDirs: [
    '../public',
    { from: '../public', to: '/' },
  ],
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentação',
  },
  viteFinal: async (config, { configType }) => {
    // Adiciona aliases para o projeto
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/src',
      '@components': '/src/components',
      '@lib': '/src/lib',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@types': '/src/types',
      '@/': '/src',
      '@/components': '/src/components',
      '@/lib': '/src/lib',
      '@/hooks': '/src/hooks',
      '@/utils': '/src/utils',
      '@/types': '/src/types',
    };

    // Configurações de build específicas
    if (configType === 'DEVELOPMENT') {
      config.server = {
        ...config.server,
        port: 6006,
        open: true,
        host: 'localhost',
      };
    }

    // Otimizações de performance
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        'react',
        'react-dom',
        '@storybook/react',
      ],
    };

    return config;
  },
  features: {
    experimentalRSC: false,
    storyStoreV7: true,
  },
  // Auto-generation de stories
  core: {
    disableTelemetry: true,
  },
  // Configurações de preview
  managerHead: (head) => `
    ${head}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  `,
  // Configurações de tratamento de arquivos
  webpackFinal: async (config) => {
    // Adiciona tratamento para arquivos CSS
    if (config.module?.rules) {
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      });
    }

    return config;
  },
};

export default config;