import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
          ],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          supabase: ['@supabase/supabase-js'],
          openai: ['openai'],
          pdf: ['html2pdf.js', 'docx'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-raw'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
  },
  server: {
    // @ts-expect-error - Vite types don't include allowedHosts but it's supported
    allowedHosts: process.env.TEMPO === 'true' ? true : undefined,
    ...(mode === 'development'
      ? {
          host: '::',
          port: 8080,
        }
      : {}),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
}));
