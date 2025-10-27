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
}

/**
 * Gera relatório HTML profissional para impressão
 */
export function generateHTMLReport(data: HTMLReportData): string {
  const { contratos, motivosStats, stats, periodo } = data;

  // Cores do aplicativo
  const colors = {
    primary: '#4285F4',
    accent: '#34A853',
    warning: '#FBBC04',
    danger: '#EA4335',
    background: '#F8F9FA',
    text: '#202124',
    textSecondary: '#5F6368',
  };

  // Gerar cores do gráfico
  const chartColors = [
    colors.primary,
    colors.accent,
    colors.warning,
    colors.danger,
    '#8E24AA',
    '#00ACC1',
  ];

  // Gerar HTML do gráfico de pizza
  const pieChartHTML = generatePieChartHTML(motivosStats, chartColors);

  // Gerar HTML da tabela de contratos
  const contractsTableHTML = generateContractsTableHTML(contratos);

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
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
  </style>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      color: ${colors.text};
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%);
      color: white;
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(66, 133, 244, 0.25);
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }

    .header p {
      font-size: 16px;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }

    .header-info {
      margin-top: 12px;
      font-size: 14px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }

    /* Card de Total */
     .total-card {
       background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%);
       border: none;
       border-radius: 16px;
       padding: 32px;
       margin-bottom: 30px;
       text-align: center;
       box-shadow: 0 8px 32px rgba(66, 133, 244, 0.3);
       position: relative;
       overflow: hidden;
     }

     .total-card::before {
       content: '';
       position: absolute;
       top: -50%;
       left: -50%;
       width: 200%;
       height: 200%;
       background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
       animation: shimmer 3s ease-in-out infinite;
     }

     @keyframes shimmer {
       0%, 100% { transform: translateX(-100%) translateY(-100%); }
       50% { transform: translateX(100%) translateY(100%); }
     }

     .total-card h2 {
       font-size: 20px;
       color: white;
       margin-bottom: 12px;
       font-weight: 600;
       opacity: 0.95;
       position: relative;
       z-index: 1;
     }

     .total-card .value {
       font-size: 64px;
       font-weight: 800;
       color: white;
       text-shadow: 0 4px 8px rgba(0,0,0,0.2);
       position: relative;
       z-index: 1;
       letter-spacing: -2px;
     }

     .total-card .subtitle {
       font-size: 14px;
       color: white;
       opacity: 0.8;
       margin-top: 8px;
       position: relative;
       z-index: 1;
     }

    /* Dashboard */
    .dashboard {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 32px;
      margin-bottom: 40px;
      padding: 32px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #e8eaed;
    }

    /* Gráfico de Pizza */
    .pie-section {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      text-align: center;
    }

    .pie-section h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 30px;
      color: ${colors.text};
      text-align: center;
      border-bottom: 3px solid ${colors.primary};
      padding-bottom: 15px;
    }

     .pie-chart {
       width: 400px;
       height: 400px;
       border-radius: 50%;
       margin: 30px auto;
       position: relative;
       background: #E8EAED;
       box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
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
       }
       
       .pie-chart svg {
         filter: none !important;
       }
       
       .pie-segment {
         display: none;
       }
     }

    /* Legenda */
    .legend {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    }

    .legend h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 30px;
      color: ${colors.text};
      text-align: center;
      border-bottom: 3px solid ${colors.primary};
      padding-bottom: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
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
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-text {
      font-size: 14px;
      color: ${colors.text};
    }

    .legend-value {
      font-size: 14px;
      font-weight: 600;
      color: ${colors.primary};
    }

    /* Seção de Contratos */
    .contracts-section {
      background: white;
      border: 1px solid #E8EAED;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      margin-bottom: 30px;
    }

    /* Quebra de página */
    .page-break-before {
      page-break-before: always;
    }

    .contracts-section h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: ${colors.text};
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 10px;
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
       padding: 8px;
       text-align: left;
       font-size: 12px;
       font-weight: 600;
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
       padding: 8px;
       font-size: 12px;
       color: ${colors.text};
       max-width: 120px;
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
       word-wrap: break-word;
       hyphens: auto;
     }

     td:first-child {
       max-width: 80px;
       font-weight: 600;
     }

     td:nth-child(2), td:nth-child(3) {
       max-width: 100px;
     }

     td:nth-child(4) {
       max-width: 180px;
       white-space: normal;
       line-height: 1.3;
     }

     td:nth-child(5), td:nth-child(6) {
       max-width: 100px;
       font-family: monospace;
     }

     td:last-child {
       max-width: 250px;
       white-space: normal;
       line-height: 1.3;
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

    /* Botão de Impressão */
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
       }

       .print-button, .print-instructions {
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
       }

       .pie-chart svg {
         width: 280px !important;
         height: 280px !important;
       }

       .legend-item {
         padding: 5px 0 !important;
         font-size: 12px !important;
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
    }
  </style>
</head>
<body>
   <button class="print-button no-print" onclick="printReport()">🖨️ Imprimir / Baixar PDF</button>
   
   
   <script>
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
           <style>
             @page {
               size: A4;
               margin: 1cm;
             }
             
             * {
               -webkit-print-color-adjust: exact !important;
               color-adjust: exact !important;
               print-color-adjust: exact !important;
             }
             
             body {
               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
               font-size: 14px;
               opacity: 0.95;
             }
             
             .header-info {
               font-size: 12px;
               opacity: 0.9;
               margin-top: 8px;
             }
             
             .total-card {
               background: linear-gradient(135deg, ${colors.primary} 0%, #1967D2 100%) !important;
               border: none !important;
               border-radius: 12px;
               padding: 20px;
               margin-bottom: 20px;
               text-align: center;
               box-shadow: 0 4px 16px rgba(66, 133, 244, 0.3);
             }
             
             .total-card h2 {
               font-size: 18px;
               color: white !important;
               margin-bottom: 8px;
               font-weight: 600;
               opacity: 0.95;
             }
             
             .total-card .value {
               font-size: 48px;
               font-weight: 800;
               color: white !important;
               text-shadow: 0 2px 4px rgba(0,0,0,0.2);
               letter-spacing: -1px;
             }

             .total-card .subtitle {
               font-size: 12px;
               color: white !important;
               opacity: 0.8;
               margin-top: 6px;
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
               padding: 15px;
               margin-bottom: 15px;
               width: 100%;
               display: block;
             }
             
             .pie-section h3, .legend h3 {
               font-size: 16px;
               font-weight: 600;
               margin-bottom: 15px;
               color: ${colors.text};
             }
             
             .pie-chart {
               width: 280px;
               height: 280px;
               margin: 10px auto;
             }
             
             .pie-chart svg {
               width: 280px;
               height: 280px;
             }
             
             .legend-item {
               display: flex;
               align-items: center;
               justify-content: space-between;
               padding: 5px 0;
               border-bottom: 1px solid ${colors.background};
               font-size: 12px;
             }
             
             .legend-item:last-child {
               border-bottom: none;
             }
             
             .legend-label {
               display: flex;
               align-items: center;
               gap: 8px;
               flex: 1;
             }
             
             .legend-color {
               width: 12px;
               height: 12px;
               border-radius: 2px;
               flex-shrink: 0;
             }
             
             .legend-text {
               font-size: 12px;
               color: ${colors.text};
             }
             
             .legend-value {
               font-size: 12px;
               font-weight: 600;
               color: ${colors.primary};
             }
             
             .contracts-section {
               background: white !important;
               border: 1px solid #E8EAED;
               border-radius: 8px;
               padding: 15px;
               margin-bottom: 20px;
               page-break-inside: auto;
             }

             .page-break-before {
               page-break-before: always !important;
             }
             
             .contracts-section h3 {
               font-size: 18px;
               font-weight: 600;
               margin-bottom: 15px;
               color: ${colors.text};
               border-bottom: 2px solid ${colors.primary};
               padding-bottom: 8px;
             }
             
             table {
               width: 100%;
               border-collapse: collapse;
               font-size: 10px;
               page-break-inside: auto;
             }
             
             thead {
               background: ${colors.primary} !important;
               color: white !important;
               display: table-header-group;
             }
             
             th {
               padding: 6px;
               font-size: 10px;
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
               padding: 6px;
               font-size: 10px;
               color: ${colors.text};
               border: 1px solid #ddd;
               max-width: none;
               overflow: visible;
               text-overflow: initial;
               white-space: normal;
               word-wrap: break-word;
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
             
             .dashboard {
               page-break-inside: avoid;
             }
             
             .contracts-section {
               page-break-before: auto;
             }
           </style>
         </head>
         <body onload="setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 1000); }, 500);">
           <div class="header">
             <h1>RELATÓRIO DE DESOCUPAÇÕES</h1>
             <p>Período: ${periodo}</p>
             <div class="header-info">Gerado em: ${dataGeracao}</div>
           </div>

           <div class="total-card">
             <h2>Total de Desocupações</h2>
             <div class="value">${stats.totalDesocupacoes}</div>
             <div class="subtitle">Contratos em processo de desocupação no período</div>
           </div>

           <div class="dashboard">
             <div class="pie-section">
               <h3>Distribuição dos Motivos</h3>
               ${pieChartHTML}
             </div>

             <div class="legend">
               <h3>Motivos de Desocupação</h3>
               ${motivosStats
                 .map(
                   (motivo, index) => `
                 <div class="legend-item">
                   <div class="legend-label">
                     <div class="legend-color" style="background: ${chartColors[index % chartColors.length]}"></div>
                     <span class="legend-text">${motivo.motivo}</span>
                   </div>
                   <span class="legend-value">${motivo.count} (${motivo.percentage}%)</span>
                 </div>
               `
                 )
                 .join('')}
             </div>
           </div>

           <div class="contracts-section page-break-before">
             <h3>Contratos em Desocupação</h3>
             ${contractsTableHTML}
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

  <!-- Header -->
  <div class="header">
    <h1>RELATÓRIO DE DESOCUPAÇÕES</h1>
    <p>Período: ${periodo}</p>
    <div class="header-info">Gerado em: ${dataGeracao}</div>
  </div>

  <!-- Card de Total -->
  <div class="total-card">
    <h2>Total de Desocupações</h2>
    <div class="value">${stats.totalDesocupacoes}</div>
    <div class="subtitle">Contratos em processo de desocupação no período</div>
  </div>

  <!-- Dashboard com Gráfico e Legenda -->
  <div class="dashboard">
    <!-- Gráfico de Pizza -->
    <div class="pie-section">
      <h3>Distribuição dos Motivos</h3>
      ${pieChartHTML}
    </div>

    <!-- Legenda -->
    <div class="legend">
      <h3>Motivos de Desocupação</h3>
      ${motivosStats
        .map(
          (motivo, index) => `
        <div class="legend-item">
          <div class="legend-label">
            <div class="legend-color" style="background: ${chartColors[index % chartColors.length]}"></div>
            <span class="legend-text">${motivo.motivo}</span>
          </div>
          <span class="legend-value">${motivo.count} (${motivo.percentage}%)</span>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <!-- Contratos -->
  <div class="contracts-section page-break-before">
    <h3>Contratos em Desocupação</h3>
    ${contractsTableHTML}
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
 * Gera HTML do gráfico de pizza
 */
function generatePieChartHTML(
  motivosStats: MotivoStats[],
  chartColors: string[]
): string {
  if (motivosStats.length === 0) {
    return '<div class="pie-chart" style="background: #E8EAED;"></div>';
  }

  // Gerar segmentos usando SVG para melhor compatibilidade
  const segments = motivosStats
    .map((motivo, index) => {
      const startPercent = motivosStats
        .slice(0, index)
        .reduce((sum, m) => sum + m.percentage, 0);
      const endPercent = startPercent + motivo.percentage;

      // Converter percentuais para ângulos
      const startAngle = (startPercent / 100) * 360;
      const endAngle = (endPercent / 100) * 360;

      // Calcular coordenadas do arco
      const radius = 180; // 180px (metade de 360px)
      const centerX = 200;
      const centerY = 200;

      const startX =
        centerX + radius * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const startY =
        centerY + radius * Math.sin(((startAngle - 90) * Math.PI) / 180);
      const endX =
        centerX + radius * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const endY =
        centerY + radius * Math.sin(((endAngle - 90) * Math.PI) / 180);

      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z',
      ].join(' ');

      // Calcular posição do label no centro do segmento
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = radius * 0.6; // Posição mais próxima do centro
      const labelX =
        centerX + labelRadius * Math.cos(((midAngle - 90) * Math.PI) / 180);
      const labelY =
        centerY + labelRadius * Math.sin(((midAngle - 90) * Math.PI) / 180);

      return `<path d="${pathData}" fill="${chartColors[index % chartColors.length]}" stroke="white" stroke-width="2" title="${motivo.motivo} (${motivo.count} contratos - ${motivo.percentage.toFixed(1)}%)">
        <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="bold" fill="white" stroke="black" stroke-width="1">${motivo.count.toString().padStart(2, '0')} (${motivo.percentage.toFixed(0)}%)</text>
      </path>`;
    })
    .join('');

  return `
    <div class="pie-chart">
      <svg width="400" height="400" viewBox="0 0 400 400">
        ${segments}
      </svg>
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

  return `
    <table>
       <thead>
         <tr>
           <th>Nº Contrato</th>
           <th>Locador</th>
           <th>Locatário</th>
           <th>Endereço</th>
           <th>Data Início</th>
           <th>Data Fim</th>
           <th>Motivo</th>
         </tr>
       </thead>
       <tbody>
         ${contratos
           .map(
             (contrato) => `
           <tr>
             <td><strong>${contrato.numeroContrato}</strong></td>
             <td class="tooltip" data-tooltip="${contrato.nomeLocador || 'Não informado'}">${getPrimeiroNome(contrato.nomeLocador) || 'Não informado'}</td>
             <td class="tooltip" data-tooltip="${contrato.nomeLocatario || 'Não informado'}">${getPrimeiroNome(contrato.nomeLocatario) || 'Não informado'}</td>
             <td class="tooltip" data-tooltip="${contrato.enderecoImovel || 'Não informado'}">${simplificarEndereco(contrato.enderecoImovel)}</td>
             <td>${contrato.dataInicioRescisao || 'Não informada'}</td>
             <td>${contrato.dataTerminoRescisao || 'Não informada'}</td>
             <td class="tooltip" data-tooltip="${contrato.motivoDesocupacao || 'Não informado'}">${contrato.motivoDesocupacao || 'Não informado'}</td>
           </tr>
         `
           )
           .join('')}
       </tbody>
    </table>
  `;
}
