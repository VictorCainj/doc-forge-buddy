// @ts-nocheck
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

interface PrintOptions {
  title?: string;
  fontSize?: number;
  showHeader?: boolean;
  showFooter?: boolean;
  margin?: string;
}

interface PrintStyles {
  fontSize: number;
  margin: string;
  showHeader: boolean;
  showFooter: boolean;
}

interface DashboardReportData {
  metrics: {
    totalContracts: number;
    contractsOver30Days: number;
    contractsNear30Days: number;
    averageProcessingTime: number;
  };
  contracts: Array<{
    id: string;
    created_at: string;
    form_data: {
      nomeLocatario?: string;
      enderecoImovel?: string;
      dataTerminoRescisao?: string;
    };
  }>;
  chartData: {
    monthlyTrends: Array<{
      month: string;
      value: number;
    }>;
  };
}

/**
 * Hook customizado para gerenciar impressão de documentos
 * Centraliza toda a lógica de impressão e garante consistência
 */
export const usePrint = () => {
  const defaultOptions = useMemo(
    () => ({
      title: 'Documento',
      fontSize: 14,
      showHeader: false,
      showFooter: false,
      margin: '20mm',
    }),
    []
  );

  const generatePrintCSS = useCallback((options: PrintStyles): string => {
    return `
      <style>
        @media print {
          @page {
            size: A4;
            margin: ${options.margin};
          }
          
          body {
            font-family: Arial, sans-serif !important;
            font-size: ${options.fontSize}px !important;
            line-height: 1.6 !important;
            color: #000 !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          div, p, h1, h2, h3, h4, h5, h6 {
            margin: 0 0 15px 0 !important;
            padding: 0 !important;
          }
          
          h1, h2, h3 {
            letter-spacing: 1px !important;
            margin-bottom: 20px !important;
          }
          
          .page-break {
            page-break-before: always !important;
          }
          
          .no-page-break {
            page-break-inside: avoid !important;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #000;
          font-size: ${options.fontSize}px;
          margin: 0;
          padding: 20px;
        }
      </style>
    `;
  }, []);

  const printContent = useCallback(
    (content: string, options: PrintOptions = {}) => {
      const finalOptions = { ...defaultOptions, ...options };
      const printStyles = {
        fontSize: finalOptions.fontSize ?? 12,
        margin: finalOptions.margin ?? '1cm',
        showHeader: finalOptions.showHeader ?? true,
        showFooter: finalOptions.showFooter ?? true,
      };

      try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error(
            'Não foi possível abrir a janela de impressão. Verifique se o pop-up está bloqueado.'
          );
          return;
        }

        const printCSS = generatePrintCSS(printStyles);

        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${finalOptions.title}</title>
            ${printCSS}
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);

        printWindow.document.close();
        printWindow.focus();

        // Aguardar o conteúdo carregar antes de imprimir
        setTimeout(() => {
          printWindow.print();

          // Fechar a janela após impressão
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);

        toast.success('Impressão iniciada com sucesso!');
      } catch {
        toast.error('Erro ao iniciar a impressão. Tente novamente.');
      }
    },
    [defaultOptions, generatePrintCSS]
  );

  const printElement = useCallback(
    (elementId: string, options: PrintOptions = {}) => {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error('Elemento não encontrado para impressão.');
        return;
      }

      const content = element.innerHTML;
      printContent(content, options);
    },
    [printContent]
  );

  const printDashboardReport = useCallback(
    (reportData: DashboardReportData, options: PrintOptions = {}) => {
      const reportContent = generateDashboardReportHTML(reportData);
      printContent(reportContent, {
        ...options,
        title: 'Relatório do Dashboard',
        fontSize: 12,
      });
    },
    [printContent]
  );

  return {
    printContent,
    printElement,
    printDashboardReport,
  };
};

/**
 * Gera HTML para relatório do dashboard
 */
const generateDashboardReportHTML = (data: DashboardReportData): string => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `
    <div class="no-page-break">
      <h1 style="text-align: center; margin-bottom: 30px;">Relatório do Dashboard</h1>
      <p style="text-align: center; margin-bottom: 30px; color: #666;">
        Gerado em ${currentDate}
      </p>
    </div>

    <div class="no-page-break">
      <h2>Resumo Executivo</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Métrica</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Valor</th>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">Total de Contratos</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.totalContracts || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">Contratos Expirados</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.expiredContracts || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">Próximos do Vencimento</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.upcomingContracts || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">Contratos Este Mês</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.currentMonthContracts || 0}</td>
        </tr>
      </table>
    </div>

    ${
      data.chartData
        ? `
      <div class="page-break">
        <h2>Análise Mensal</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Mês</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Contratos</th>
          </tr>
          ${data.chartData
            .map(
              (item: { month: string; value: number }) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">${item.month}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${item.value}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>
    `
        : ''
    }

    <div class="page-break">
      <h2>Observações</h2>
      <p style="margin-bottom: 20px;">
        Este relatório foi gerado automaticamente pelo sistema DocForge.
        Para mais informações, acesse o dashboard principal.
      </p>
      <p style="color: #666; font-size: 12px;">
        DocForge - Sistema de Gestão de Contratos
      </p>
    </div>
  `;
};
