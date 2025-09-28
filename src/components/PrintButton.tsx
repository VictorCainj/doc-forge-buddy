import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePrint } from '@/hooks/usePrint';
import { toast } from 'sonner';

interface PrintButtonProps {
  content?: string;
  elementId?: string;
  title?: string;
  fontSize?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Componente de botão de impressão reutilizável
 * Centraliza a funcionalidade de impressão em toda a aplicação
 */
export const PrintButton: React.FC<PrintButtonProps> = ({
  content,
  elementId,
  title = 'Documento',
  fontSize = 14,
  variant = 'outline',
  size = 'default',
  className = '',
  children,
}) => {
  const { printContent, printElement } = usePrint();

  const handlePrint = () => {
    try {
      if (elementId) {
        printElement(elementId, { title, fontSize });
      } else if (content) {
        printContent(content, { title, fontSize });
      } else {
        toast.error('Nenhum conteúdo especificado para impressão.');
      }
    } catch {
      toast.error('Erro ao iniciar a impressão. Tente novamente.');
    }
  };

  return (
    <Button
      onClick={handlePrint}
      variant={variant}
      size={size}
      className={`print:hidden ${className}`}
      title={`Imprimir ${title}`}
    >
      <Printer className="h-4 w-4 mr-2" />
      {children || 'Imprimir'}
    </Button>
  );
};

interface DashboardPrintButtonProps {
  data: Record<string, unknown>;
  className?: string;
}

/**
 * Botão específico para impressão de relatórios do dashboard
 */
export const DashboardPrintButton: React.FC<DashboardPrintButtonProps> = ({
  data,
  className = '',
}) => {
  const { printDashboardReport } = usePrint();

  const handlePrintReport = () => {
    try {
      printDashboardReport(data, {
        title: 'Relatório do Dashboard',
        fontSize: 12,
        showHeader: true,
        showFooter: true,
      });
    } catch {
      toast.error('Erro ao gerar relatório. Tente novamente.');
    }
  };

  return (
    <Button
      onClick={handlePrintReport}
      variant="outline"
      size="default"
      className={`print:hidden ${className}`}
      title="Imprimir relatório do dashboard"
    >
      <Printer className="h-4 w-4 mr-2" />
      Imprimir Relatório
    </Button>
  );
};
