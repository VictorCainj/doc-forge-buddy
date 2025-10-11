#!/usr/bin/env node

/**
 * Script de Auditoria de Cores - Google Material Design 3
 * 
 * Detecta uso de cores Tailwind não-padronizadas no projeto.
 * Apenas cores da paleta Material Design devem ser usadas.
 */

const fs = require('fs');
const path = require('path');

// Cores Tailwind que NÃO devem ser usadas (não-Material)
const FORBIDDEN_COLORS = [
  'slate', 'gray', 'zinc', 'stone',
  'blue', 'green', 'red', 'yellow', 'orange',
  'emerald', 'teal', 'cyan', 'sky', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

// Cores Material Design permitidas
const ALLOWED_COLORS = [
  'neutral', 'primary', 'success', 'warning', 'error', 'info',
  'border', 'input', 'ring', 'background', 'foreground',
  'secondary', 'destructive', 'muted', 'accent', 'popover', 'card', 'sidebar'
];

// Padrão regex para detectar classes Tailwind de cores
const createColorPattern = (prefix) => {
  const forbiddenColorsPattern = FORBIDDEN_COLORS.join('|');
  return new RegExp(`${prefix}-(${forbiddenColorsPattern})-(\\d{2,3}|50|950)`, 'g');
};

const patterns = {
  bg: createColorPattern('bg'),
  text: createColorPattern('text'),
  border: createColorPattern('border'),
  from: createColorPattern('from'),
  to: createColorPattern('to'),
  via: createColorPattern('via'),
  ring: createColorPattern('ring'),
  decoration: createColorPattern('decoration'),
  outline: createColorPattern('outline'),
  divide: createColorPattern('divide'),
  accent: createColorPattern('accent'),
  caret: createColorPattern('caret'),
};

// Mapeamento de substituições sugeridas
const REPLACEMENT_MAP = {
  'slate': 'neutral',
  'gray': 'neutral',
  'zinc': 'neutral',
  'stone': 'neutral',
  'blue': 'primary',
  'green': 'success',
  'red': 'error',
  'yellow': 'warning',
  'orange': 'warning',
  'emerald': 'success',
  'teal': 'primary',
  'cyan': 'info',
  'sky': 'info',
  'indigo': 'primary',
  'violet': 'primary',
  'purple': 'primary',
  'fuchsia': 'primary',
  'pink': 'error',
  'rose': 'error',
};

let totalIssues = 0;
const issuesByFile = new Map();

/**
 * Verifica um arquivo em busca de cores não-Material
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileIssues = [];

  lines.forEach((line, index) => {
    Object.entries(patterns).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const fullMatch = match[0];
        const colorName = match[1];
        const shade = match[2];
        const replacement = REPLACEMENT_MAP[colorName];

        fileIssues.push({
          line: index + 1,
          type,
          match: fullMatch,
          suggestion: `${type}-${replacement}-${shade}`,
          context: line.trim(),
        });

        totalIssues++;
      }
    });
  });

  if (fileIssues.length > 0) {
    issuesByFile.set(filePath, fileIssues);
  }
}

/**
 * Percorre recursivamente os diretórios
 */
function walkDirectory(dir, fileExtensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar diretórios específicos
      if (
        file === 'node_modules' ||
        file === 'dist' ||
        file === 'build' ||
        file === '.git' ||
        file.includes('.backup')
      ) {
        return;
      }
      walkDirectory(filePath, fileExtensions);
    } else if (fileExtensions.some((ext) => file.endsWith(ext))) {
      auditFile(filePath);
    }
  });
}

/**
 * Exibe o relatório de auditoria
 */
function printReport() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AUDITORIA DE CORES - GOOGLE MATERIAL DESIGN 3             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (totalIssues === 0) {
    console.log('✅ Nenhuma cor não-Material encontrada! Projeto 100% em conformidade.\n');
    return;
  }

  console.log(`❌ Total de ocorrências: ${totalIssues}`);
  console.log(`📁 Arquivos afetados: ${issuesByFile.size}\n`);

  // Agrupar por tipo
  const byType = {};
  issuesByFile.forEach((issues) => {
    issues.forEach((issue) => {
      if (!byType[issue.type]) byType[issue.type] = 0;
      byType[issue.type]++;
    });
  });

  console.log('📊 POR TIPO:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} ocorrências`);
    });

  console.log('\n📄 DETALHES POR ARQUIVO:\n');

  // Ordenar por número de issues (maior primeiro)
  const sortedFiles = Array.from(issuesByFile.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  sortedFiles.forEach(([filePath, issues]) => {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\n${relativePath} (${issues.length} ocorrências)`);
    console.log('─'.repeat(60));

    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. Linha ${issue.line}:`);
      console.log(`     ❌ Encontrado: ${issue.match}`);
      console.log(`     ✅ Sugestão:   ${issue.suggestion}`);
      if (issue.context.length < 80) {
        console.log(`     📝 Contexto:   ${issue.context}`);
      }
      console.log('');
    });
  });

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   MAPEAMENTO DE CORES MATERIAL DESIGN                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('Substituições recomendadas:');
  console.log('  slate/gray/zinc/stone → neutral');
  console.log('  blue/indigo/violet    → primary');
  console.log('  green/emerald         → success');
  console.log('  red/pink/rose         → error');
  console.log('  yellow/orange         → warning');
  console.log('  cyan/sky/teal         → info');
  console.log('');
}

// Executar auditoria
const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error('❌ Diretório src/ não encontrado!');
  process.exit(1);
}

console.log('🔍 Analisando arquivos...');
walkDirectory(srcDir);
printReport();

// Exit code baseado no resultado
process.exit(totalIssues > 0 ? 1 : 0);
