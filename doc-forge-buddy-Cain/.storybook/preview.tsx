import type { Preview } from '@storybook/react';
import '../src/index.css';
import { withThemeByClassName } from '@storybook/addon-styling';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { withTests } from '@storybook/addon-jest';

// MSW Configuration
initialize({
  onUnhandledRequest: 'bypass',
});

// Storybook Addon Jest
withTests({ resultsPath: '../coverage' });

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      theme: 'light',
      extractComponentDescription: (component, { notes }) => {
        if (notes) {
          return typeof notes === 'string' ? notes : notes.markdown || notes.text;
        }
        return null;
      },
    },
    a11y: {
      element: '#storybook-root',
      manual: false,
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', ['Welcome', 'Theming'], 'Components', 'UI', ['Atoms', 'Molecules', 'Organisms'], 'Layout', 'Forms', 'Modals', '*'],
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'gray',
          value: '#f3f4f6',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '320px',
            height: '568px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
      },
    },
  },
  loaders: [mswLoader],
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <div id="storybook-root" style={{ 
        minHeight: '100vh', 
        padding: '20px',
        backgroundColor: 'var(--background)',
        transition: 'background-color 0.3s ease'
      }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;