import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X, FileText, Download } from '@/utils/iconMapper';
import SkeletonDocument from '@/components/SkeletonDocument';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { validateHTML } from '@/utils/securityValidators';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { useSafeHTML } from '@/hooks/useSafeHTML';

export default function DocumentoPublico() {
  const { id } = useParams<{ id: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    '404' | '403' | '500' | 'network' | null
  >(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) {
        setError('ID do documento não fornecido');
        setErrorType('404');
        setLoading(false);
        logger.error('DocumentoPublico: ID não fornecido');
        return;
      }

      try {
        logger.info('DocumentoPublico: Carregando documento', {
          documentId: id,
        });

        const { data, error: fetchError } = await supabase
          .from('public_documents')
          .select('html_content, title')
          .eq('id', id)
          .single();

        if (fetchError) {
          logger.error('DocumentoPublico: Erro ao buscar documento', {
            error: fetchError,
            documentId: id,
          });

          if (fetchError.code === 'PGRST116') {
            setError('Documento não encontrado');
            setErrorType('404');
          } else if (fetchError.code === '42501') {
            setError('Você não tem permissão para acessar este documento');
            setErrorType('403');
          } else {
            setError('Erro interno do servidor');
            setErrorType('500');
          }
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Documento não encontrado');
          setErrorType('404');
          setLoading(false);
          logger.warn('DocumentoPublico: Documento não encontrado', {
            documentId: id,
          });
          return;
        }

        // Sanitizar HTML para segurança
        const sanitizedContent = validateHTML(data.html_content);
        setHtmlContent(sanitizedContent);
        setDocumentTitle(data.title || 'Documento');
        document.title = data.title || 'Documento';

        // Meta tags para compartilhamento social
        updateMetaTags(data.title || 'Documento');

        logger.info('DocumentoPublico: Documento carregado com sucesso', {
          documentId: id,
          title: data.title,
        });
      } catch (err) {
        logger.error('DocumentoPublico: Erro inesperado', {
          error: err,
          documentId: id,
        });
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
        setErrorType('network');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  // Adicionar event listeners para zoom nas imagens
  useEffect(() => {
    if (!contentRef.current) return;

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        setZoomedImage(img.src);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleImageClick);

    return () => {
      contentElement.removeEventListener('click', handleImageClick);
    };
  }, [htmlContent]);

  // Função para atualizar meta tags
  const updateMetaTags = (title: string) => {
    // Open Graph tags
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', `Documento: ${title}`);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute('content', window.location.href);

    // Twitter tags
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute('content', title);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute('content', `Documento: ${title}`);
  };

  // Função para download em PDF
  const downloadPDF = async () => {
    if (!contentRef.current) return;

    setIsDownloading(true);
    try {
      logger.info('DocumentoPublico: Iniciando download PDF', {
        documentId: id,
      });

      const opt = {
        margin: 1,
        filename: `documento-${id}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait' as const,
        },
      };

      await html2pdf().set(opt).from(contentRef.current).save();

      toast.success('PDF baixado com sucesso!');
      logger.info('DocumentoPublico: PDF baixado com sucesso', {
        documentId: id,
      });
    } catch (error) {
      logger.error('DocumentoPublico: Erro ao gerar PDF', {
        error,
        documentId: id,
      });
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para download em DOCX
  const downloadDOCX = async () => {
    if (!contentRef.current) return;

    setIsDownloading(true);
    try {
      logger.info('DocumentoPublico: Iniciando download DOCX', {
        documentId: id,
      });

      // Extrair texto do HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';

      // Criar documento DOCX
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: textContent.split('\n').map(
              (line) =>
                new Paragraph({
                  children: [new TextRun(line.trim())],
                })
            ),
          },
        ],
      });

      // Baixar arquivo
      const buffer = await Packer.toBuffer(doc);
      const arrayBuffer =
        buffer.buffer instanceof ArrayBuffer
          ? buffer.buffer
          : new ArrayBuffer(buffer.buffer.byteLength);
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `documento-${id}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('DOCX baixado com sucesso!');
      logger.info('DocumentoPublico: DOCX baixado com sucesso', {
        documentId: id,
      });
    } catch (error) {
      logger.error('DocumentoPublico: Erro ao gerar DOCX', {
        error,
        documentId: id,
      });
      toast.error('Erro ao gerar DOCX. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para tentar novamente
  const retryLoad = () => {
    setError(null);
    setErrorType(null);
    setLoading(true);
    // Recarregar a página
    window.location.reload();
  };

  if (loading) {
    return (
      <main role="main" aria-label="Carregando documento">
        <div className="min-h-screen bg-neutral-50">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <SkeletonDocument />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main role="main" aria-label="Erro ao carregar documento">
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">
              {errorType === '404' && '📄'}
              {errorType === '403' && '🔒'}
              {errorType === '500' && '⚠️'}
              {errorType === 'network' && '🌐'}
            </div>

            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              {errorType === '404' && 'Documento não encontrado'}
              {errorType === '403' && 'Acesso negado'}
              {errorType === '500' && 'Erro do servidor'}
              {errorType === 'network' && 'Erro de conexão'}
            </h1>

            <p className="text-neutral-600 mb-6">{error}</p>

            <div className="space-y-3">
              {errorType === 'network' && (
                <Button
                  onClick={retryLoad}
                  variant="default"
                  className="w-full"
                >
                  Tentar novamente
                </Button>
              )}

              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="w-full"
              >
                Voltar ao início
              </Button>

              {errorType === '404' && (
                <p className="text-sm text-neutral-500">
                  Verifique se o link está correto ou entre em contato com o
                  suporte.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main role="main" aria-label="Documento público">
      <div className="min-h-screen bg-white">
        {/* Header com botões de download */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">
                  {documentTitle}
                </h1>
                <p className="text-sm text-neutral-600">Documento ID: {id}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {isDownloading ? 'Gerando...' : 'PDF'}
                </Button>

                <Button
                  onClick={downloadDOCX}
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Gerando...' : 'DOCX'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo do documento */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <SafeDocumentContent html={htmlContent} contentRef={contentRef} />
        </div>

        {/* Modal de Zoom de Imagem */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Imagem ampliada"
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <style>{`
        .document-public-content {
          line-height: 1.6;
          color: #1f2937;
        }
        
        .document-public-content h1,
        .document-public-content h2,
        .document-public-content h3,
        .document-public-content h4,
        .document-public-content h5,
        .document-public-content h6 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #111827;
        }
        
        .document-public-content p {
          margin-bottom: 1rem;
          text-align: justify;
        }
        
        .document-public-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .document-public-content img:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        
        .document-public-content img:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .document-public-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .document-public-content th,
        .document-public-content td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        
        .document-public-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .document-public-content strong {
          font-weight: 600;
          color: #111827;
        }
        
        .document-public-content ul,
        .document-public-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        .document-public-content li {
          margin-bottom: 0.25rem;
        }
        
        /* Melhorias de acessibilidade */
        @media (prefers-reduced-motion: reduce) {
          .document-public-content img {
            transition: none;
          }
          
          .document-public-content img:hover {
            transform: none;
          }
        }
        
        @media print {
          .document-public-content {
            max-width: 100%;
            color: black !important;
          }
          
          .document-public-content img {
            cursor: default;
            box-shadow: none;
          }
          
          .document-public-content img:hover {
            transform: none;
            box-shadow: none;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .document-public-content {
            color: #e5e7eb;
          }
          
          .document-public-content h1,
          .document-public-content h2,
          .document-public-content h3,
          .document-public-content h4,
          .document-public-content h5,
          .document-public-content h6 {
            color: #f9fafb;
          }
          
          .document-public-content strong {
            color: #f9fafb;
          }
          
          .document-public-content th {
            background-color: #374151;
          }
          
          .document-public-content th,
          .document-public-content td {
            border-color: #4b5563;
          }
        }
      `}</style>
      </div>
    </main>
  );
}

// Componente para renderizar conteúdo de forma segura
const SafeDocumentContent = ({
  html,
  contentRef,
}: {
  html: string;
  contentRef: React.RefObject<HTMLDivElement>;
}) => {
  const safeHTML = useSafeHTML(html);
  return (
    <div
      ref={contentRef}
      className="document-public-content"
      dangerouslySetInnerHTML={{ __html: safeHTML }}
    />
  );
};
