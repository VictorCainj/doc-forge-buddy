/**
 * Configuração do CSSnano para otimização de CSS
 * Maximiza a compressão para produção
 */

module.exports = {
  preset: [
    'default',
    {
      // Configurações específicas
      discardComments: {
        removeAll: true, // Remove todos os comentários em produção
       野兽: true, // Suporte a comentários especiais
      },
      
      // Otimizar z-index
      zindex: false, // Desabilita reordenação de z-index
      
      // Otimizar transformação de cores
      colormin: true,
      
      // Otimizar dimensões
      convertValues: true,
      
      // Converter unidades relativas
      convertLength: true,
      
      // Otimizar margens
      reduceTransforms: true,
      
      // Otimizar filtros CSS
      filters: false,
      
      // Otimizar font-weights
      fontWeights: false,
      
      // Otimizar selectores
      selectors: false,
      
      // Otimizar media queries
      mediaQuery: {
        exclude: ['print'], // Preservar media queries de impressão
      },
      
      // Otimizar clac()
      calc: false, // Preservar cálculos complexos
      
      // Normalizar
      normalizeWhitespace: true,
      
      // Reduzir overqualification
      reduceBackgroundRepeat: true,
      
      // Otimizar cores HSL
      hsl: false,
      
      // Otimizar display:none
      discardOverridden: true,
      
      // Otimizar at-rules
      minifyParams: true,
      
      // Otimizar functions
      minifySelectors: true,
      
      // Otimizar keyframes
      reduceIdents: true,
      
      // Otimizar contadores
      normalizePositions: true,
      
      // Otimizar supports
      supports: false,
      
      // Otimizar universidades
      uniqueSelectors: true,
      
      // Remover CSS não utilizado
      unusedCss: {
        // Configurações de detecção de CSS não utilizado
        onRemovable: ['*.jsx', '*.tsx', '*.js', '*.ts'],
        logRemoved: true,
      },
    }
  ],
  
  // Configurações adicionais por tipo de arquivo
  plugins: [
    // Plugin para otimizar CSS Grid
    require('cssnano-preset-advanced')({
      preset: ['default', {
        grid: 'autoplace',
      }],
    }),
    
    // Plugin para otimizar CSS Custom Properties
    require('postcss-custom-properties')({
      preserve: false, // Não preservar custom properties
    }),
    
    // Plugin para remover CSS duplicado
    require('postcss-discard-duplicates')(),
    
    // Plugin para otimizar CSS para produção
    require('postcss-combine-duplicated-selectors')({
      removeDuplicatedValues: true,
    }),
  ],
  
  // Configurações de entrada
  input: {
    // Arquivos de entrada a serem processados
    include: [
      'src/**/*.{css,scss,sass}',
      'public/**/*.css',
    ],
    exclude: [
      'node_modules/**/*',
      'dist/**/*',
      '.git/**/*',
    ],
  },
  
  // Configurações de saída
  output: {
    // Diretório de saída
    dir: 'dist/assets/css',
    
    // Nome dos arquivos de saída
    name: '[name]-[hash].min.css',
    
    // Preservar estrutura de diretórios
    preserveFolders: false,
  },
  
  // Configurações de cache
  cache: {
    // Habilitar cache
    enabled: true,
    
    // Diretório do cache
    dir: '.cssnano-cache',
    
    // TTL do cache (em ms)
    ttl: 24 * 60 * 60 * 1000, // 24 horas
  },
  
  // Configurações de minificação
  minify: {
    // Nível de minificação (1-5)
    level: 5,
    
    // Preservar licenças
    preserveLicenses: false,
    
    // Preservar source maps
    sourceMap: false,
  },
};