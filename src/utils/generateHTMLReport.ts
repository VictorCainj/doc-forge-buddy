// @ts-nocheck
import {
  ContratoDesocupacao,
  MotivoStats,
  DashboardStats,
} from '@/types/dashboardDesocupacao';

interface HTMLReportData {
  contratos: ContratoDesocupacao[];
  motivosStats: MotivoStats[];
  stats: DashboardStats;
  periodo: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Gera relatório HTML profissional para impressão
 */
export function generateHTMLReport(data: HTMLReportData): string {
  const { contratos, motivosStats, stats, periodo, dataInicio, dataFim } = data;

  // Formatar período no formato 01/MM/YYYY até DD/MM/YYYY (sempre do dia 01 até o último dia do mês)
  // Usa o mês da data de fim como referência para garantir que ambas sejam do mesmo mês
  let periodoFormatado = periodo;
  if (dataInicio && dataFim) {
    try {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
        // Usar o mês e ano da data de fim como referência para garantir consistência
        const mesReferencia = fim.getMonth();
        const anoReferencia = fim.getFullYear();
        
        // Data de início: sempre dia 01 do mês de referência
        const inicioCorrigido = new Date(anoReferencia, mesReferencia, 1);
        
        // Data de fim: sempre o último dia do mês de referência
        const fimCorrigido = new Date(anoReferencia, mesReferencia + 1, 0);
        
        periodoFormatado = `${inicioCorrigido.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })} até ${fimCorrigido.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`;
      }
    } catch (error) {
      console.error('Erro ao formatar período:', error);
    }
  }

  // Cores Material Design - Google Style (neutras e claras)
  const colors = {
    primary: '#1976D2', // Azul Google Material
    primaryLight: '#42A5F5',
    accent: '#00BCD4', // Cyan
    success: '#4CAF50', // Verde Google
    warning: '#FF9800', // Laranja
    danger: '#F44336', // Vermelho
    background: '#FFFFFF', // Branco puro
    surface: '#FAFAFA', // Cinza muito claro
    text: '#212121', // Cinza escuro
    textSecondary: '#757575', // Cinza médio
    divider: '#E0E0E0', // Linha divisória
  };

  // Cores do gráfico - Material Design harmonioso
  const chartColors = [
    '#1976D2', // Azul principal
    '#00BCD4', // Cyan
    '#4CAF50', // Verde
    '#FF9800', // Laranja
    '#9C27B0', // Roxo
    '#00ACC1', // Teal
  ];

  // Gerar HTML do gráfico de barras
  const barChartHTML = generateBarChartHTML(motivosStats, chartColors, colors);

  // Gerar HTML da tabela de contratos
  const contractsTableHTML = generateContractsTableHTML(contratos);

  // Gerar HTML do relatório de entrega de chaves
  const keyDeliveryTableHTML = generateKeyDeliveryReportHTML(contratos);

  // Data de geração
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Desocupações - ${periodo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 2cm 2.5cm;
      @top-center {
        content: element(header);
      }
      @bottom-center {
        content: element(footer);
      }
    }
  </style>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

     body {
       font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
       background: ${colors.background};
       color: ${colors.text};
       padding: 20px;
       max-width: 1200px;
       margin: 0 auto;
       line-height: 1.6;
       -webkit-font-smoothing: antialiased;
       -moz-osx-font-smoothing: grayscale;
       text-rendering: optimizeLegibility;
     }

    /* Header */
    .header {
      background: ${colors.primary};
      color: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.08);
      position: relative;
    }


    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.3px;
      position: relative;
      z-index: 1;
      line-height: 1.3;
    }

    .header p {
      font-size: 13px;
      opacity: 0.95;
      position: relative;
      z-index: 1;
      margin-bottom: 6px;
      font-weight: 400;
    }

    .header-info {
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
      font-weight: 400;
    }

    .header-periodo {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      z-index: 1;
      letter-spacing: 0.2px;
    }

     /* Card de Total */
      .total-card {
       background: ${colors.surface};
       border: 1px solid ${colors.divider};
       border-radius: 8px;
       padding: 24px;
       margin-bottom: 20px;
       text-align: center;
       box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
       position: relative;
     }

     .total-card h2 {
       font-size: 12px;
       color: ${colors.textSecondary};
       margin-bottom: 10px;
       font-weight: 600;
       position: relative;
       z-index: 1;
       text-transform: uppercase;
       letter-spacing: 0.8px;
     }

     .total-card .value {
       font-size: 52px;
       font-weight: 800;
       color: ${colors.primary};
       position: relative;
       z-index: 1;
       letter-spacing: -1.5px;
       margin: 12px 0;
       line-height: 1;
     }

     .total-card .subtitle {
       font-size: 13px;
       color: ${colors.textSecondary};
       margin-top: 6px;
       position: relative;
       z-index: 1;
       font-weight: 400;
       line-height: 1.4;
     }

     /* Dashboard */
     .dashboard {
       display: block;
       margin-bottom: 20px;
       padding: 15px;
       background: white;
       border-radius: 12px;
       box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
       border: 1px solid #e8eaed;
     }

    /* Gráfico de Pizza */
    .pie-section {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      text-align: center;
    }

    .pie-section h3 {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 15px;
      color: ${colors.text};
      text-align: center;
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 8px;
    }

     .pie-chart {
       width: 300px;
       height: 300px;
       border-radius: 50%;
       margin: 15px auto;
       position: relative;
       background: #E8EAED;
       box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
     }

     .pie-chart svg {
       width: 100%;
       height: 100%;
       page-break-inside: avoid;
     }

     .pie-chart svg path {
       transition: all 0.3s ease;
       cursor: pointer;
     }

     .pie-chart svg path:hover {
       opacity: 0.8;
       filter: brightness(1.1);
       stroke-width: 3;
     }

     .pie-chart svg text {
       pointer-events: none;
       user-select: none;
     }

     .pie-segment {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       border-radius: 50%;
       clip-path: polygon(50% 50%, 50% 0%, var(--end-x, 100%) var(--end-y, 0%));
       transform-origin: 50% 50%;
     }

     /* Estilos específicos para impressão */
     @media print {
       .pie-chart {
         background: white !important;
         border: 2px solid #333 !important;
         page-break-inside: avoid !important;
         break-inside: avoid !important;
       }
       
       .pie-chart svg {
         filter: none !important;
         page-break-inside: avoid !important;
         break-inside: avoid !important;
       }

       .pie-chart svg path {
         -webkit-print-color-adjust: exact !important;
         print-color-adjust: exact !important;
         color-adjust: exact !important;
       }

       .pie-chart svg text {
         -webkit-print-color-adjust: exact !important;
         print-color-adjust: exact !important;
         color-adjust: exact !important;
       }
       
       .pie-segment {
         display: none !important;
       }
     }

    /* Legenda */
    .legend {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .legend h3 {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
      color: ${colors.text};
      text-align: center;
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid ${colors.background};
    }

    .legend-item:last-child {
      border-bottom: none;
    }

    .legend-label {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-text {
      font-size: 11px;
      color: ${colors.text};
      display: inline;
    }

    .legend-value {
      font-size: 11px;
      font-weight: 600;
      color: ${colors.primary};
      font-family: 'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      margin-left: 6px;
      display: inline;
    }

    .legend-count {
      font-size: 11px;
      font-weight: 600;
      color: ${colors.text};
      margin-left: 2px;
      display: inline;
    }

    /* Seção de Contratos */
    .contracts-section {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      margin-bottom: 15px;
    }

    /* Quebra de página */
    .page-break-before {
      page-break-before: always;
    }

    /* Sistema de paginação inteligente */
    @media print {
      .print-page {
        page-break-after: always;
        page-break-inside: avoid;
        break-inside: avoid;
        min-height: calc(100vh - 2cm);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      .print-page:last-child {
        page-break-after: auto;
      }

      .page-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: 40px;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Ajuste dinâmico para Página 1 */
      .print-page-1 .header {
        margin-bottom: 50px;
      }

      .print-page-1 .total-card {
        margin-top: 0;
        margin-bottom: 0;
      }

      .print-page-1 .total-card .value {
        font-size: 85px;
      }

      .print-page-1 .total-card h2 {
        margin-bottom: 20px;
      }

      .print-page-1 .total-card .subtitle {
        margin-top: 20px;
      }

      /* Ajuste dinâmico para Página 2 (Dashboard) */
      .print-page-2 .dashboard h3 {
        font-size: 18px;
        margin-bottom: 30px;
        text-align: center;
        font-weight: 700;
        color: ${colors.text};
        border-bottom: 2px solid ${colors.primary};
        padding-bottom: 12px;
      }

      .print-page-2 .dashboard {
        height: auto;
        min-height: 400px;
      }

      .print-page-2 .bar-chart {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 20px;
      }

      /* Ajuste dinâmico para Página 3 e 4 (Tabelas) */
      .print-page-3 h3 {
        font-size: 18px;
        margin: 20px auto 24px auto;
        text-align: center !important;
        font-weight: 700;
        color: ${colors.text};
        border-bottom: 2px solid ${colors.primary};
        padding-bottom: 12px;
        display: block;
        width: 100%;
      }

      .print-page-4 h3 {
        font-size: 18px;
        margin: 60px auto 24px auto;
        text-align: center !important;
        font-weight: 700;
        color: ${colors.text};
        border-bottom: 2px solid ${colors.primary};
        padding-bottom: 12px;
        display: block;
        width: 100%;
      }

      .print-page-3 table,
      .print-page-4 table {
        width: 100%;
        font-size: clamp(7px, 1vw, 10px);
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .print-page-3 thead th,
      .print-page-4 thead th {
        font-size: clamp(8px, 1.2vw, 12px);
        padding: 6px 4px;
      }

      .print-page-3 tbody td,
      .print-page-4 tbody td {
        font-size: clamp(7px, 0.9vw, 10px);
        padding: 6px 4px;
      }

      .print-page-3 tbody tr,
      .print-page-4 tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Evitar que dashboard quebre */
      .print-page-2 .dashboard {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .print-page-2 .bar-chart {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    @media screen {
      .print-page {
        min-height: auto;
      }
    }

    .contracts-section h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      color: ${colors.text};
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 6px;
      text-align: center;
    }

    /* Tabela */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: ${colors.primary};
      color: white;
    }

      th {
        padding: 8px 6px;
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }

     tbody tr {
       border-bottom: 1px solid #E8EAED;
     }

     tbody tr:nth-child(even) {
       background: ${colors.background};
     }

     tbody tr:hover {
       background: #E8F0FE;
     }

      td {
        padding: 8px 6px;
        font-size: 10px;
        color: ${colors.text};
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        word-wrap: break-word;
        hyphens: manual;
        line-height: 1.5;
      }

     td:first-child {
       max-width: 100px;
       font-weight: 600;
     }

     td:nth-child(2), td:nth-child(3) {
       max-width: 120px;
     }

     td:nth-child(4) {
       max-width: 200px;
       white-space: normal;
       line-height: 1.4;
       font-size: 11px;
     }

     td:nth-child(5), td:nth-child(6) {
       max-width: 110px;
       font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
       font-size: 11px;
     }

     td:last-child {
       max-width: 280px;
       white-space: normal;
       line-height: 1.4;
       font-size: 11px;
     }

     /* Tooltips */
     .tooltip {
       position: relative;
       cursor: help;
       overflow: visible !important;
     }

    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      color: ${colors.textSecondary};
      font-size: 12px;
      border-top: 1px solid #E8EAED;
      margin-top: 30px;
    }

    /* Botão de Impressão e Copiar */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors.primary};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      z-index: 1000;
    }

    .print-button:hover {
      background: #1967D2;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }

    .copy-button {
      position: fixed;
      top: 20px;
      right: 180px;
      background: ${colors.success};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      z-index: 1000;
    }

    .copy-button:hover {
      background: #45A049;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }

    .copy-button.copied {
      background: ${colors.success};
    }

    .copy-button.copying {
      opacity: 0.7;
      cursor: not-allowed;
    }

     /* Estilos de Impressão */
     @media print {
       * {
         -webkit-print-color-adjust: exact !important;
         color-adjust: exact !important;
         print-color-adjust: exact !important;
       }

       body {
         padding: 0 !important;
         margin: 0 !important;
         max-width: 100% !important;
         font-size: 12px !important;
         line-height: 1.4 !important;
         -webkit-font-smoothing: antialiased !important;
         -moz-osx-font-smoothing: grayscale !important;
         text-rendering: optimizeLegibility !important;
       }
      
      /* Quebras de página entre cada conteúdo */
      .print-page {
        page-break-after: always !important;
        page-break-inside: avoid !important;
      }
      
      /* Garantir que conteúdo não quebre */
      .content-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Evitar quebra no meio de tabelas */
      tbody tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Cabeçalho e rodapé fixos em todas as páginas */
      @page {
        margin: 2cm 2.5cm 2cm 2.5cm;
      }
      
      thead {
        display: table-header-group !important;
      }
      
      tfoot {
        display: table-footer-group !important;
      }
      
      .page-header {
        position: running(header);
        text-align: center;
        font-size: 10px;
        color: #666;
        padding: 5px 0;
        border-bottom: 1px solid #ddd;
      }
      
      .page-footer {
        position: running(footer);
        text-align: center;
        font-size: 9px;
        color: #999;
        padding: 5px 0;
        border-top: 1px solid #ddd;
        position: fixed;
        bottom: 0;
        width: 100%;
      }

       .print-button, .copy-button, .print-instructions {
         display: none !important;
       }

       .header {
         border-radius: 0 !important;
         margin-bottom: 15px !important;
         padding: 20px !important;
         background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%) !important;
         color: white !important;
         box-shadow: none !important;
       }

       .header h1 {
         font-size: 24px !important;
         margin-bottom: 5px !important;
       }

       .header p {
         font-size: 14px !important;
       }

       .header-info {
         font-size: 12px !important;
       }

       .total-card {
         background: ${colors.background} !important;
         border: 2px solid ${colors.primary} !important;
         border-radius: 8px !important;
         padding: 15px !important;
         margin-bottom: 20px !important;
         text-align: center !important;
       }

       .total-card h2 {
         font-size: 16px !important;
         margin-bottom: 5px !important;
       }

       .total-card .value {
         font-size: 36px !important;
         color: ${colors.primary} !important;
       }

       .dashboard {
         display: block !important;
         page-break-inside: avoid !important;
         margin-bottom: 20px !important;
         grid-template-columns: 1fr !important;
       }

       .pie-section, .legend {
         background: white !important;
         border: 1px solid #E8EAED !important;
         border-radius: 8px !important;
         padding: 15px !important;
         margin-bottom: 15px !important;
         box-shadow: none !important;
         width: 100% !important;
         display: block !important;
       }

       .pie-section h3, .legend h3 {
         font-size: 16px !important;
         margin-bottom: 15px !important;
       }

       .pie-chart {
         width: 280px !important;
         height: 280px !important;
         margin: 10px auto !important;
         page-break-inside: avoid !important;
         break-inside: avoid !important;
       }

       .pie-chart svg {
         width: 280px !important;
         height: 280px !important;
         page-break-inside: avoid !important;
         break-inside: avoid !important;
       }

       .pie-chart svg path,
       .pie-chart svg text {
         -webkit-print-color-adjust: exact !important;
         print-color-adjust: exact !important;
         color-adjust: exact !important;
       }

       .legend-item {
         padding: 5px 0 !important;
         font-size: 12px !important;
       }

       .legend-value {
         font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace !important;
         font-variant-numeric: tabular-nums !important;
         letter-spacing: -0.02em !important;
         white-space: nowrap !important;
       }

       .legend-color {
         width: 12px !important;
         height: 12px !important;
       }

       .contracts-section {
         background: white !important;
         border: 1px solid #E8EAED !important;
         border-radius: 8px !important;
         padding: 15px !important;
         margin-bottom: 20px !important;
         box-shadow: none !important;
         page-break-inside: auto !important;
       }

       .contracts-section h3 {
         font-size: 18px !important;
         margin-bottom: 15px !important;
         border-bottom: 2px solid ${colors.primary} !important;
         padding-bottom: 8px !important;
         text-align: center !important;
       }

       table {
         width: 100% !important;
         border-collapse: collapse !important;
         font-size: 10px !important;
         page-break-inside: auto !important;
       }

       thead {
         background: ${colors.primary} !important;
         color: white !important;
         display: table-header-group !important;
       }

       th {
         padding: 6px !important;
         font-size: 10px !important;
         font-weight: 600 !important;
         text-align: left !important;
         border: 1px solid #ddd !important;
       }

       tbody tr {
         border-bottom: 1px solid #E8EAED !important;
         page-break-inside: avoid !important;
       }

       tbody tr:nth-child(even) {
         background: ${colors.background} !important;
       }

       td {
         padding: 6px !important;
         font-size: 10px !important;
         color: ${colors.text} !important;
         border: 1px solid #ddd !important;
         max-width: none !important;
         overflow: visible !important;
         text-overflow: initial !important;
         white-space: normal !important;
         word-wrap: break-word !important;
         hyphens: manual !important;
         text-align: left !important;
         line-height: 1.4 !important;
       }

       .footer {
         text-align: center !important;
         padding: 15px !important;
         color: ${colors.textSecondary} !important;
         font-size: 10px !important;
         border-top: 1px solid #E8EAED !important;
         margin-top: 20px !important;
         page-break-before: avoid !important;
       }

       /* Quebras de página */
       .header, .total-card {
         page-break-after: avoid !important;
       }

       .dashboard {
         page-break-inside: avoid !important;
       }

       .contracts-section {
         page-break-before: auto !important;
       }
     }

    @media screen and (max-width: 768px) {
      body {
        padding: 20px;
      }

      .dashboard {
        grid-template-columns: 1fr;
      }

      .pie-chart {
        width: 350px;
        height: 350px;
      }

      .pie-chart svg {
        width: 350px;
        height: 350px;
      }

      .header h1 {
        font-size: 22px;
      }

      .total-card .value {
        font-size: 36px;
      }

      .copy-button {
        right: 140px;
        padding: 10px 16px;
        font-size: 12px;
      }

      .print-button {
        right: 10px;
        padding: 10px 16px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
   <button class="copy-button no-print" id="copyButton" onclick="copyReport()">
     <span id="copyText">Copiar</span>
   </button>
   <button class="print-button no-print" onclick="printReport()">Imprimir / Baixar PDF</button>
   
   
   <script>
     async function copyReport() {
       const copyButton = document.getElementById('copyButton');
       const copyText = document.getElementById('copyText');
       
       try {
         copyButton.classList.add('copying');
         copyText.textContent = 'Copiando...';
         
         // Obter o conteúdo HTML do body (sem os botões)
         const bodyContent = document.body.cloneNode(true);
         
         // Remover botões de ação e scripts
         const buttons = bodyContent.querySelectorAll('.print-button, .copy-button, .no-print, script');
         buttons.forEach(btn => btn.remove());
         
         // Criar um container temporário para processar o HTML
         const tempContainer = document.createElement('div');
         tempContainer.innerHTML = bodyContent.innerHTML;
         
         // Adicionar estilos inline aos elementos principais para garantir formatação ao colar
         const mainElements = tempContainer.querySelectorAll('.header, .total-card, .dashboard, .contracts-section, table, .pie-section, .legend, .footer');
         mainElements.forEach(el => {
           const computedStyle = window.getComputedStyle(el);
           if (!el.getAttribute('style')) {
             el.setAttribute('style', '');
           }
         });
         
         // Obter HTML limpo (apenas o conteúdo visual, sem tags html/head/body)
         const htmlContent = tempContainer.innerHTML;
         
         // Extrair texto simples para fallback
         const textContent = tempContainer.innerText || tempContainer.textContent || '';
         
         // Copiar usando método que preserva formatação HTML
         try {
           // Criar elemento temporário invisível com o conteúdo
           const hiddenDiv = document.createElement('div');
           hiddenDiv.style.position = 'fixed';
           hiddenDiv.style.left = '-999999px';
           hiddenDiv.style.top = '0';
           hiddenDiv.style.opacity = '0';
           hiddenDiv.style.pointerEvents = 'none';
           hiddenDiv.innerHTML = htmlContent;
           
           document.body.appendChild(hiddenDiv);
           
           // Selecionar e copiar
           const selection = window.getSelection();
           const range = document.createRange();
           range.selectNodeContents(hiddenDiv);
           selection?.removeAllRanges();
           selection?.addRange(range);
           
           // Tentar copiar com Clipboard API primeiro
           if (navigator.clipboard && navigator.clipboard.write) {
             try {
               const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
               const textBlob = new Blob([textContent], { type: 'text/plain' });
               
               await navigator.clipboard.write([
                 new ClipboardItem({
                   'text/html': htmlBlob,
                   'text/plain': textBlob
                 })
               ]);
               
               selection?.removeAllRanges();
               document.body.removeChild(hiddenDiv);
               
               copyButton.classList.remove('copying');
               copyButton.classList.add('copied');
               copyText.textContent = 'Copiado!';
               
               setTimeout(() => {
                 copyButton.classList.remove('copied');
                 copyText.textContent = 'Copiar';
               }, 2000);
               return;
             } catch (clipboardErr) {
               // Continuar para fallback
             }
           }
           
           // Fallback: usar execCommand
           const success = document.execCommand('copy');
           
           selection?.removeAllRanges();
           document.body.removeChild(hiddenDiv);
           
           if (success) {
             copyButton.classList.remove('copying');
             copyButton.classList.add('copied');
             copyText.textContent = 'Copiado!';
             
             setTimeout(() => {
               copyButton.classList.remove('copied');
               copyText.textContent = 'Copiar';
             }, 2000);
           } else {
             throw new Error('execCommand falhou');
           }
         } catch (err) {
           // Último fallback: copiar apenas texto
           try {
             await navigator.clipboard.writeText(textContent);
             
             copyButton.classList.remove('copying');
             copyButton.classList.add('copied');
             copyText.textContent = 'Copiado!';
             
             setTimeout(() => {
               copyButton.classList.remove('copied');
               copyText.textContent = 'Copiar';
             }, 2000);
           } catch (finalErr) {
             throw finalErr;
           }
         }
       } catch (error) {
         console.error('Erro ao copiar:', error);
         copyButton.classList.remove('copying');
         copyText.textContent = 'Erro';
         
         setTimeout(() => {
           copyText.textContent = 'Copiar';
         }, 2000);
       }
     }
     // Melhorar tooltips com posicionamento baseado no mouse
     document.addEventListener('DOMContentLoaded', function() {
       // Limpar tooltips existentes
       const existingTooltips = document.querySelectorAll('.dynamic-tooltip');
       existingTooltips.forEach(tooltip => tooltip.remove());
       
       const tooltips = document.querySelectorAll('.tooltip');
       let currentTooltip = null;
       
       tooltips.forEach(function(tooltip) {
         tooltip.addEventListener('mouseenter', function(e) {
           // Remover tooltip anterior se existir
           if (currentTooltip) {
             currentTooltip.remove();
             currentTooltip = null;
           }
           
           const tooltipText = this.getAttribute('data-tooltip');
           if (!tooltipText || tooltipText.trim() === '') return;
           
           // Criar tooltip dinâmico
           const tooltipElement = document.createElement('div');
           tooltipElement.className = 'dynamic-tooltip';
           tooltipElement.textContent = tooltipText;
           
           // Estilos do tooltip dinâmico
           tooltipElement.style.cssText = \`
             position: fixed;
             background: rgba(0, 0, 0, 0.95);
             color: white;
             padding: 10px 14px;
             border-radius: 8px;
             font-size: 13px;
             z-index: 99999;
             max-width: 350px;
             min-width: 200px;
             word-wrap: break-word;
             text-align: center;
             line-height: 1.4;
             box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
             border: 1px solid rgba(255, 255, 255, 0.1);
             backdrop-filter: blur(10px);
             pointer-events: none;
             opacity: 0;
             transition: opacity 0.2s ease-out;
           \`;
           
           document.body.appendChild(tooltipElement);
           currentTooltip = tooltipElement;
           
           // Posicionar tooltip
           const rect = this.getBoundingClientRect();
           const tooltipRect = tooltipElement.getBoundingClientRect();
           
           let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
           let top = rect.top - tooltipRect.height - 10;
           
           // Ajustar se sair da tela
           if (left < 10) left = 10;
           if (left + tooltipRect.width > window.innerWidth - 10) {
             left = window.innerWidth - tooltipRect.width - 10;
           }
           if (top < 10) {
             top = rect.bottom + 10;
           }
           
           tooltipElement.style.left = left + 'px';
           tooltipElement.style.top = top + 'px';
           
           // Mostrar tooltip
           setTimeout(() => {
             if (tooltipElement.parentNode) {
               tooltipElement.style.opacity = '1';
             }
           }, 10);
           
           // Remover tooltip ao sair do hover
           const removeTooltip = function() {
             if (tooltipElement && tooltipElement.parentNode) {
               tooltipElement.style.opacity = '0';
               setTimeout(() => {
                 if (tooltipElement.parentNode) {
                   tooltipElement.parentNode.removeChild(tooltipElement);
                   if (currentTooltip === tooltipElement) {
                     currentTooltip = null;
                   }
                 }
               }, 200);
             }
           };
           
           this.addEventListener('mouseleave', removeTooltip, { once: true });
           
           // Remover tooltip ao sair da janela
           document.addEventListener('mouseleave', removeTooltip, { once: true });
         });
       });

       // Tooltips para o gráfico de pizza SVG
       const piePaths = document.querySelectorAll('.pie-chart svg path');
       piePaths.forEach(function(path) {
         path.addEventListener('mouseenter', function(e) {
           // Remover tooltip anterior se existir
           if (currentTooltip) {
             currentTooltip.remove();
             currentTooltip = null;
           }
           
           const tooltipText = this.getAttribute('title');
           if (!tooltipText || tooltipText.trim() === '') return;
           
           // Criar tooltip dinâmico para o gráfico
           const tooltipElement = document.createElement('div');
           tooltipElement.className = 'dynamic-tooltip pie-tooltip';
           tooltipElement.textContent = tooltipText;
           
           // Estilos específicos para tooltip do gráfico
           tooltipElement.style.cssText = \`
             position: fixed;
             background: rgba(0, 0, 0, 0.95);
             color: white;
             padding: 12px 16px;
             border-radius: 10px;
             font-size: 14px;
             font-weight: 500;
             z-index: 99999;
             max-width: 300px;
             word-wrap: break-word;
             text-align: center;
             line-height: 1.4;
             box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
             border: 2px solid rgba(255, 255, 255, 0.2);
             backdrop-filter: blur(10px);
             pointer-events: none;
             opacity: 0;
             transition: opacity 0.3s ease-out;
             transform: translateX(-50%);
           \`;
           
           document.body.appendChild(tooltipElement);
           currentTooltip = tooltipElement;
           
           // Posicionar tooltip acima do cursor
           const rect = this.getBoundingClientRect();
           const tooltipRect = tooltipElement.getBoundingClientRect();
           
           let left = e.clientX;
           let top = e.clientY - tooltipRect.height - 15;
           
           // Ajustar se sair da tela
           if (left < 20) left = 20;
           if (left > window.innerWidth - 20) left = window.innerWidth - 20;
           if (top < 20) {
             top = e.clientY + 15;
           }
           
           tooltipElement.style.left = left + 'px';
           tooltipElement.style.top = top + 'px';
           
           // Mostrar tooltip
           setTimeout(() => {
             if (tooltipElement.parentNode) {
               tooltipElement.style.opacity = '1';
             }
           }, 10);
           
           // Remover tooltip ao sair do hover
           const removeTooltip = function() {
             if (tooltipElement && tooltipElement.parentNode) {
               tooltipElement.style.opacity = '0';
               setTimeout(() => {
                 if (tooltipElement.parentNode) {
                   tooltipElement.parentNode.removeChild(tooltipElement);
                   if (currentTooltip === tooltipElement) {
                     currentTooltip = null;
                   }
                 }
               }, 300);
             }
           };
           
           this.addEventListener('mouseleave', removeTooltip, { once: true });
         });
       });
     });

     function printReport() {
       // Criar uma nova janela para impressão com configurações otimizadas
       const printWindow = window.open('', '_blank', 'width=800,height=600');
       
       // HTML completo com configurações de impressão
       const printHTML = \`
                   <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Desocupações - Impressão</title>
             <link rel="preconnect" href="https://fonts.googleapis.com">
             <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
             <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
             @page {
               size: A4;
               margin: 2cm 2.5cm;
               @top-center {
                 content: element(header);
               }
               @bottom-center {
                 content: element(footer);
               }
             }
             
             * {
               -webkit-print-color-adjust: exact !important;
               color-adjust: exact !important;
               print-color-adjust: exact !important;
             }
             
                           body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
              }
             
             .header {
               background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%) !important;
               color: white !important;
               padding: 20px;
               margin-bottom: 15px;
               border-radius: 0;
             }
             
             .header h1 {
               font-size: 24px;
               margin-bottom: 5px;
               font-weight: 700;
             }
             
              .header p {
                font-size: 12px;
                opacity: 0.95;
              }

              .header-periodo {
                font-size: 12px;
                font-weight: 600;
                margin: 4px 0;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3);
              }
              
              .header-info {
                font-size: 11px;
                opacity: 0.9;
                margin-top: 6px;
              }
             
                           .total-card {
                background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%) !important;
                border: none !important;
                border-radius: 12px !important;
                padding: 20px !important;
                margin-bottom: 20px !important;
                text-align: center !important;
                box-shadow: 0 4px 16px rgba(66, 133, 244, 0.3) !important;
                position: relative !important;
                overflow: hidden !important;
                height: auto !important;
                max-height: none !important;
              }
             
               .total-card h2 {
                 font-size: 14px !important;
                 color: white !important;
                 margin-bottom: 6px !important;
                 font-weight: 600 !important;
                 opacity: 0.95 !important;
                 position: relative !important;
                 z-index: 1 !important;
               }
               
               .total-card .value {
                 font-size: 36px !important;
                 font-weight: 800 !important;
                 color: white !important;
                 text-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                 letter-spacing: -1px !important;
                 position: relative !important;
                 z-index: 1 !important;
               }
 
               .total-card .subtitle {
                 font-size: 10px !important;
                 color: white !important;
                 opacity: 0.8 !important;
                 margin-top: 4px !important;
                 position: relative !important;
                 z-index: 1 !important;
               }
             
             .dashboard {
               display: block;
               page-break-inside: avoid;
               margin-bottom: 20px;
             }
             
              .pie-section, .legend {
                background: white !important;
                border: 1px solid #E8EAED;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
                width: 100%;
                display: block;
              }
              
              .pie-section h3, .legend h3 {
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 10px;
                color: ${colors.text};
              }
              
              .pie-chart {
                width: 200px;
                height: 200px;
                margin: 8px auto;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .pie-chart svg {
                width: 200px;
                height: 200px;
                page-break-inside: avoid;
                break-inside: avoid;
              }

             .pie-chart svg path,
             .pie-chart svg text {
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
               color-adjust: exact !important;
             }
             
              .legend-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 3px 0;
                border-bottom: 1px solid ${colors.background};
                font-size: 9px;
              }
              
              .legend-item:last-child {
                border-bottom: none;
              }
              
              .legend-label {
                display: flex;
                align-items: center;
                gap: 6px;
                flex: 1;
              }
              
              .legend-color {
                width: 10px;
                height: 10px;
                border-radius: 2px;
                flex-shrink: 0;
              }
              
              .legend-text {
                font-size: 9px;
                color: ${colors.text};
              }
              
              .legend-value {
                font-size: 9px;
                font-weight: 600;
                color: ${colors.primary};
                font-family: 'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
                font-variant-numeric: tabular-nums;
                letter-spacing: -0.02em;
                margin-left: 2px;
                display: inline;
              }

              .legend-count {
                font-size: 9px;
                font-weight: 600;
                color: ${colors.text};
                margin-left: 2px;
                display: inline;
              }
             
             .contracts-section {
               background: white !important;
               border: 1px solid #E8EAED;
               border-radius: 8px;
               padding: 10px;
               margin-bottom: 15px;
               page-break-inside: auto;
             }

             .page-break-before {
               page-break-before: always !important;
             }
             
             .contracts-section h3 {
               font-size: 12px;
               font-weight: 600;
               margin-bottom: 8px;
               color: ${colors.text};
               border-bottom: 2px solid ${colors.primary};
               padding-bottom: 4px;
               text-align: center;
             }
             
             table {
               width: 100%;
               border-collapse: collapse;
               font-size: 7px;
               page-break-inside: auto;
             }
             
             thead {
               background: ${colors.primary} !important;
               color: white !important;
               display: table-header-group;
             }
             
             th {
               padding: 3px;
               font-size: 7px;
               font-weight: 600;
               text-align: left;
               border: 1px solid #ddd;
             }
             
             tbody tr {
               border-bottom: 1px solid #E8EAED;
               page-break-inside: avoid;
             }
             
             tbody tr:nth-child(even) {
               background: ${colors.background} !important;
             }
             
             td {
               padding: 3px;
               font-size: 7px;
               color: ${colors.text};
               border: 1px solid #ddd;
               max-width: none;
               overflow: visible;
               text-overflow: initial;
               white-space: normal;
               word-wrap: break-word;
               hyphens: manual;
               text-align: left;
               line-height: 1.2;
             }
             
             .footer {
               text-align: center;
               padding: 15px;
               color: ${colors.textSecondary};
               font-size: 10px;
               border-top: 1px solid #E8EAED;
               margin-top: 20px;
               page-break-before: avoid;
             }
             
                           .header, .total-card {
                page-break-after: avoid;
              }

              .total-card::before {
                display: none !important;
              }
             
             .dashboard {
               page-break-inside: avoid;
             }
             
             .contracts-section {
               page-break-before: auto;
             }
           </style>
         </head>
          <body onload="setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 1000); }, 500);">
            <!-- Página 1: Header + Total -->
            <div class="print-page print-page-1">
              <div class="page-content">
                <div class="header">
                  <h1>RELATÓRIO DE DESOCUPAÇÕES</h1>
                  <div class="header-periodo">Período: ${periodoFormatado}</div>
                  <div class="header-info">Gerado em: ${dataGeracao}</div>
                </div>

                <div class="total-card">
                  <h2>Total de Desocupações</h2>
                  <div class="value">${stats.totalDesocupacoes}</div>
                  <div class="subtitle">Contratos em processo de desocupação no período</div>
                </div>
              </div>
            </div>

           <!-- Página 2: Dashboard com Gráfico -->
           <div class="print-page print-page-2">
             <div class="page-content">
               <div class="dashboard">
                 <div class="pie-section">
                   <h3>Motivos de Desocupação</h3>
                   ${barChartHTML}
                 </div>
               </div>
             </div>
           </div>

           <!-- Página 3: Contratos em Desocupação -->
           <div class="print-page print-page-3">
             <div class="page-content">
               <h3>Contratos em Desocupação</h3>
               ${contractsTableHTML}
             </div>
           </div>

           <!-- Página 4: Relatório de Entrega de Chaves -->
           <div class="print-page print-page-4">
             <div class="page-content">
               <h3>Relatório de Entrega de Chaves</h3>
               ${keyDeliveryTableHTML}
             </div>
           </div>

           <div class="footer">
             <p>Relatório gerado automaticamente pelo Sistema de Gestão de Contratos</p>
             <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
           </div>
         </body>
         </html>
       \`;
       
       printWindow.document.write(printHTML);
       printWindow.document.close();
     }
   </script>

  <!-- Página 1: Header + Total -->
  <div class="print-page print-page-1">
    <div class="page-content">
      <div class="header">
        <h1>RELATÓRIO DE DESOCUPAÇÕES</h1>
        <div class="header-periodo">Período: ${periodoFormatado}</div>
        <div class="header-info">Gerado em: ${dataGeracao}</div>
      </div>

      <div class="total-card">
        <h2>Total de Desocupações</h2>
        <div class="value">${stats.totalDesocupacoes}</div>
        <div class="subtitle">Contratos em processo de desocupação no período</div>
      </div>
    </div>
  </div>

  <!-- Página 2: Dashboard com Gráfico -->
  <div class="print-page print-page-2">
    <div class="page-content">
      <div class="dashboard">
        <div class="pie-section">
          <h3>Motivos de Desocupação</h3>
          ${barChartHTML}
        </div>
      </div>
    </div>
  </div>

  <!-- Página 3: Contratos em Desocupação -->
  <div class="print-page print-page-3">
    <div class="page-content">
      <h3>Contratos em Desocupação</h3>
      ${contractsTableHTML}
    </div>
  </div>

  <!-- Página 4: Relatório de Entrega de Chaves -->
  <div class="print-page print-page-4">
    <div class="page-content">
      <h3>Relatório de Entrega de Chaves</h3>
      ${keyDeliveryTableHTML}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Relatório gerado automaticamente pelo Sistema de Gestão de Contratos</p>
    <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Gera HTML do gráfico de barras otimizado para impressão
 */
function generateBarChartHTML(
  motivosStats: MotivoStats[],
  chartColors: string[],
  colors: {
    primary: string;
    text: string;
    background: string;
    textSecondary: string;
  }
): string {
  if (motivosStats.length === 0) {
    return '<div class="bar-chart" style="background: #E8EAED; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 12px;"><p style="color: #5F6368;">Nenhum dado disponível</p></div>';
  }

  const maxValue = Math.max(...motivosStats.map((m) => m.count));

  const bars = motivosStats
    .map((motivo, index) => {
      const barWidth = (motivo.count / maxValue) * 100;

      return `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: ${colors.text}; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.1px;">
            ${motivo.motivo}
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="flex: 1; height: 40px; background: ${colors.surface}; border-radius: 8px; overflow: hidden; position: relative; box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);">
              <div style="width: ${barWidth}%; height: 100%; background: ${chartColors[index % chartColors.length]}; position: relative; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; box-shadow: inset 0 1px 2px rgba(255,255,255,0.25);">
                <span style="font-size: 11px; font-weight: 700; color: white; font-family: 'Inter', 'Roboto', monospace; text-shadow: 0 1px 3px rgba(0,0,0,0.3); letter-spacing: 0.2px;">
                  ${motivo.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div style="min-width: 70px; height: 40px; background: ${colors.surface}; border: 1px solid ${colors.divider}; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <span style="font-size: 13px; font-weight: 700; color: ${colors.text}; font-family: 'Inter', 'Roboto', monospace; letter-spacing: 0.1px;">
                ${motivo.count}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="bar-chart" style="padding: 15px;">
      ${bars}
    </div>
  `;
}

/**
 * Extrai o primeiro nome de um nome completo
 */
function getPrimeiroNome(nomeCompleto: string | undefined): string {
  if (!nomeCompleto) return '';
  return nomeCompleto.split(' ')[0];
}

/**
 * Simplifica o endereço removendo informações desnecessárias
 */
function simplificarEndereco(endereco: string | undefined): string {
  if (!endereco) return 'Não informado';

  try {
    // Remove informações como "Rua", "Avenida", "Nº", "Casa", etc.
    let enderecoSimplificado = endereco
      .replace(
        /^(Rua|Av\.|Avenida|R\.|Travessa|Alameda|Al\.|Praça|Pça\.)\s+/i,
        ''
      )
      .replace(/,\s*(Nº|nº|N|n)\s*\d+/i, '')
      .replace(/,\s*(Casa|Apto|Apartamento)\s*\d+/i, '')
      .replace(/,\s*(Bloco|Bl)\s*[A-Z0-9]+/i, '')
      .replace(/,\s*(Sala|Andar)\s*\d+/i, '')
      .replace(/,\s*(Edifício|Ed\.)\s*[A-Za-z0-9\s]+/i, '')
      .replace(/,\s*(Condomínio|Cond\.)\s*[A-Za-z0-9\s]+/i, '')
      .replace(/,\s*(Loteamento|Lote)\s*[A-Za-z0-9\s]+/i, '')
      .trim();

    // Limitar tamanho para evitar overflow
    if (enderecoSimplificado.length > 50) {
      enderecoSimplificado = enderecoSimplificado.substring(0, 47) + '...';
    }

    return enderecoSimplificado;
  } catch (error) {
    console.error('Erro ao simplificar endereço:', error);
    return endereco.length > 50 ? endereco.substring(0, 47) + '...' : endereco;
  }
}

/**
 * Gera HTML da tabela de contratos
 */
function generateContractsTableHTML(contratos: ContratoDesocupacao[]): string {
  if (contratos.length === 0) {
    return '<p style="text-align: center; color: #5F6368; padding: 40px;">Nenhum contrato em desocupação no período selecionado.</p>';
  }

  // Calcular tamanhos dinâmicos baseado na quantidade de contratos
  const rowsCount = contratos.length;
  const dynamicFontSize =
    rowsCount > 20 ? '9px' : rowsCount > 15 ? '10px' : '11px';
  const dynamicPadding =
    rowsCount > 20 ? '6px' : rowsCount > 15 ? '8px' : '10px';

  return `
    <table style="font-size: ${dynamicFontSize};">
       <thead>
         <tr>
           <th style="padding: ${dynamicPadding};">Nº Contrato</th>
           <th style="padding: ${dynamicPadding};">Locador</th>
           <th style="padding: ${dynamicPadding};">Locatário</th>
           <th style="padding: ${dynamicPadding};">Endereço</th>
           <th style="padding: ${dynamicPadding};">Data Início</th>
           <th style="padding: ${dynamicPadding};">Data Fim</th>
           <th style="padding: ${dynamicPadding};">Motivo</th>
         </tr>
       </thead>
       <tbody>
         ${contratos
           .map(
             (contrato) => `
           <tr>
             <td style="padding: ${dynamicPadding};"><strong>${contrato.numeroContrato}</strong></td>
             <td class="tooltip" data-tooltip="${contrato.nomeLocador || 'Não informado'}" style="padding: ${dynamicPadding};">${getPrimeiroNome(contrato.nomeLocador) || 'Não informado'}</td>
             <td class="tooltip" data-tooltip="${contrato.nomeLocatario || 'Não informado'}" style="padding: ${dynamicPadding};">${getPrimeiroNome(contrato.nomeLocatario) || 'Não informado'}</td>
             <td class="tooltip" data-tooltip="${contrato.enderecoImovel || 'Não informado'}" style="padding: ${dynamicPadding};">${simplificarEndereco(contrato.enderecoImovel)}</td>
             <td style="padding: ${dynamicPadding};">${contrato.dataInicioRescisao || 'Não informada'}</td>
             <td style="padding: ${dynamicPadding};">${contrato.dataTerminoRescisao || 'Não informada'}</td>
             <td class="tooltip" data-tooltip="${contrato.motivoDesocupacao || 'Não informado'}" style="padding: ${dynamicPadding};">${contrato.motivoDesocupacao || 'Não informado'}</td>
           </tr>
         `
           )
           .join('')}
       </tbody>
    </table>
  `;
}

/**
 * Gera HTML do relatório de entrega de chaves
 */
function generateKeyDeliveryReportHTML(
  contratos: ContratoDesocupacao[]
): string {
  if (contratos.length === 0) {
    return '<p style="text-align: center; color: #5F6368; padding: 40px;">Nenhum contrato no período selecionado.</p>';
  }

  // Calcular tamanhos dinâmicos baseado na quantidade de contratos
  const rowsCount = contratos.length;
  const dynamicFontSize =
    rowsCount > 20 ? '9px' : rowsCount > 15 ? '10px' : '11px';
  const dynamicPadding =
    rowsCount > 20 ? '6px' : rowsCount > 15 ? '8px' : '10px';

  // Contar chaves entregues e pendentes
  let chavesEntregues = 0;
  let chavesPendentes = 0;

  const rows = contratos
    .map((contrato) => {
      const { entregaChaves } = contrato;

      // Contar estatísticas
      if (!entregaChaves || !entregaChaves.entregue) {
        chavesPendentes++;
      } else {
        chavesEntregues++;
      }

      // Se não tem informação de entrega de chaves, mostrar como "Pendente"
      let statusHTML: string;
      let infoHTML: string;

      if (!entregaChaves) {
        statusHTML = `<span style="background: #FFEBEE; color: #C62828; padding: 6px 12px; border-radius: 16px; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Pendente</span>`;
        infoHTML = '-';
      } else if (entregaChaves.entregue) {
        statusHTML = `<span style="background: #E8F5E9; color: #2E7D32; padding: 6px 12px; border-radius: 16px; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Entregue</span>`;
        infoHTML = entregaChaves.dataEntrega || '-';
      } else {
        statusHTML = `<span style="background: #FFEBEE; color: #C62828; padding: 6px 12px; border-radius: 16px; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Pendente</span>`;
        infoHTML = '-';
      }

      return `
        <tr>
          <td style="padding: ${dynamicPadding};"><strong>${contrato.numeroContrato}</strong></td>
          <td class="tooltip" data-tooltip="${contrato.nomeLocatario || 'Não informado'}" style="padding: ${dynamicPadding};">${getPrimeiroNome(contrato.nomeLocatario) || 'Não informado'}</td>
          <td class="tooltip" data-tooltip="${contrato.enderecoImovel || 'Não informado'}" style="padding: ${dynamicPadding};">${simplificarEndereco(contrato.enderecoImovel)}</td>
          <td style="text-align: center; padding: ${dynamicPadding};">${statusHTML}</td>
          <td style="text-align: center; font-family: 'Roboto Mono', monospace; font-size: 10px; padding: ${dynamicPadding};">${infoHTML}</td>
        </tr>
      `;
    })
    .join('');

  // Gerar estatísticas minimalistas
  const statsHTML = `
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E0E0E0; text-align: center;">
      <span style="font-size: 12px; color: #5F6368; font-weight: 500; letter-spacing: 0.3px;">
        Chaves Entregues: <strong style="color: #2E7D32; font-weight: 700;">${chavesEntregues}</strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        Chaves Pendentes: <strong style="color: #C62828; font-weight: 700;">${chavesPendentes}</strong>
      </span>
    </div>
  `;

  return `
    <table style="font-size: ${dynamicFontSize};">
      <thead>
        <tr>
          <th style="padding: ${dynamicPadding};">Nº Contrato</th>
          <th style="padding: ${dynamicPadding};">Locatário</th>
          <th style="padding: ${dynamicPadding};">Endereço</th>
          <th style="padding: ${dynamicPadding};">Status</th>
          <th style="padding: ${dynamicPadding};">Data de Entrega de Chaves</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${statsHTML}
  `;
}
