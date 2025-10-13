import jsPDF from 'jspdf';

export const exportSummaryToPDF = async (
  summary: string,
  userName: string,
  date: string
): Promise<void> => {
  try {
    // Criar novo documento PDF (formato A4)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Header - Logo/Título
    doc.setFillColor(59, 130, 246); // primary-500
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DocForge', margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Gestão Imobiliária', margin, 28);

    currentY = 55;

    // Título do documento
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Diário de Atividades', margin, currentY);
    currentY += 10;

    // Informações do gestor e data
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Gestor: ${userName}`, margin, currentY);
    currentY += 7;
    doc.text(`Data: ${date}`, margin, currentY);
    currentY += 12;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Conteúdo do resumo
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    // Quebrar texto em linhas que cabem na página
    const lines = doc.splitTextToSize(summary, contentWidth);

    lines.forEach((line: string) => {
      // Verificar se precisa de nova página
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }

      doc.text(line, margin, currentY);
      currentY += 6;
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado por DocForge em ${new Date().toLocaleString('pt-BR')}`,
      margin,
      footerY
    );

    // Salvar PDF
    const fileName = `Resumo_Diario_${date.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Erro ao exportar o resumo para PDF');
  }
};
