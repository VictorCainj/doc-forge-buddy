import React, { useState } from 'react';
import { 
  LazyExcel, 
  LazyChart, 
  LazyPDF, 
  LazyDocx, 
  LazyBundle,
  FileSkeleton,
  ChartSkeleton,
  CardSkeleton 
} from '@/components/performance';

/**
 * Exemplo de uso dos componentes de Lazy Loading
 * Demonstra como integrar as bibliotecas pesadas com lazy loading
 */
export function LazyLoadingExample() {
  const [selectedLibrary, setSelectedLibrary] = useState<string>('excel');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dados de exemplo
  const chartData = {
    labels: ['Energia', 'Água', 'Condomínio', 'Gás', 'Notificação'],
    datasets: [{
      label: 'Contas Pagas',
      data: [12, 19, 8, 5, 2],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Status das Contas de Consumo',
      },
    },
  };

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      // Simula carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Exemplo de como seria a exportação
      const { exportContractsToExcel } = await import('@/utils/exportContractsToExcel');
      console.log('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { exportSummaryToPDF } = await import('@/utils/pdfExport');
      await exportSummaryToPDF(
        'Resumo das atividades do dia',
        'João Silva',
        new Date().toLocaleDateString('pt-BR')
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDocx = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { generateDocx, downloadDocx } = await import('@/utils/docxGenerator');
      const blob = await generateDocx({
        title: 'Relatório de Contratos',
        date: new Date().toLocaleDateString('pt-BR'),
        content: 'Este é o conteúdo do relatório de contratos.',
        signatures: {
          name1: 'João Silva',
          name2: 'Maria Santos',
        },
      });
      downloadDocx(blob, 'relatorio-contratos.docx');
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Componentes com Lazy Loading
        </h1>
        <p className="text-gray-600">
          Demonstração de como usar as bibliotecas pesadas com lazy loading para melhor performance
        </p>
      </div>

      {/* Seção de controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Controles</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleGenerateExcel}
            disabled={isGenerating}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            📄 Gerar PDF
          </button>
          <button
            onClick={handleGenerateDocx}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            📝 Criar DOCX
          </button>
        </div>
        {isGenerating && (
          <div className="mt-4 flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processando...</span>
          </div>
        )}
      </div>

      {/* Seção de componentes individuais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lazy Excel Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Componente Excel Lazy</h3>
          <LazyExcel
            type="contracts"
            className="h-32"
            onLoad={() => console.log('Excel carregado!')}
            onError={(error) => console.error('Erro Excel:', error)}
          />
        </div>

        {/* Lazy Chart Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Componente Chart Lazy</h3>
          <LazyChart
            type="bar"
            data={chartData}
            options={chartOptions}
            className="h-64"
            onLoad={() => console.log('Chart carregado!')}
            onError={(error) => console.error('Erro Chart:', error)}
          />
        </div>

        {/* Lazy PDF Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📄 Componente PDF Lazy</h3>
          <LazyPDF
            summary="Resumo das atividades realizadas hoje no sistema."
            userName="João Silva"
            date={new Date().toLocaleDateString('pt-BR')}
            className="h-32"
            onLoad={() => console.log('PDF carregado!')}
            onError={(error) => console.error('Erro PDF:', error)}
          />
        </div>

        {/* Lazy DOCX Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📝 Componente DOCX Lazy</h3>
          <LazyDocx
            data={{
              title: 'Relatório de Contratos',
              date: new Date().toLocaleDateString('pt-BR'),
              content: 'Conteúdo do relatório de contratos.',
              signatures: {
                name1: 'João Silva',
                name2: 'Maria Santos',
              },
            }}
            className="h-32"
            onLoad={() => console.log('DOCX carregado!')}
            onError={(error) => console.error('Erro DOCX:', error)}
          />
        </div>
      </div>

      {/* Seção de Bundle Loading */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Bundle Loading</h3>
        <LazyBundle
          libraries={['excel', 'chart', 'pdf', 'docx']}
          onLoad={(loadedLibs) => {
            console.log('Bibliotecas carregadas:', loadedLibs);
          }}
          onError={(error, library) => {
            console.error(`Erro ao carregar ${library}:`, error);
          }}
        >
          {(loadedLibs) => (
            <div className="space-y-4">
              <p className="text-green-600">
                ✅ {loadedLibs.length} bibliotecas carregadas com sucesso!
              </p>
              <div className="flex flex-wrap gap-2">
                {loadedLibs.map(lib => (
                  <span
                    key={lib}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {lib === 'excel' && '📊 Excel'}
                    {lib === 'chart' && '📈 Chart'}
                    {lib === 'pdf' && '📄 PDF'}
                    {lib === 'docx' && '📝 DOCX'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </LazyBundle>
      </div>

      {/* Seção de exemplos de Skeletons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">⏳ Loading States (Skeletons)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">File Skeleton</h4>
            <FileSkeleton type="excel" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Chart Skeleton</h4>
            <ChartSkeleton height="h-48" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Card Skeleton</h4>
            <CardSkeleton showHeader={true} contentLines={2} />
          </div>
        </div>
      </div>

      {/* Métricas de performance */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Métricas de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium">Tempo de Carregamento</h4>
            <p className="text-gray-600">ExcelJS: ~500ms</p>
            <p className="text-gray-600">jsPDF: ~200ms</p>
            <p className="text-gray-600">docx: ~300ms</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium">Tamanho dos Módulos</h4>
            <p className="text-gray-600">ExcelJS: ~1.2MB</p>
            <p className="text-gray-600">jsPDF: ~800KB</p>
            <p className="text-gray-600">docx: ~600KB</p>
          </div>
          <div className="bg-white p-4 rounded">
            <h4 className="font-medium">Benefícios</h4>
            <p className="text-gray-600">🚀 Carregamento mais rápido</p>
            <p className="text-gray-600">💾 Menor uso de memória</p>
            <p className="text-gray-600">📱 Melhor UX em mobile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LazyLoadingExample;