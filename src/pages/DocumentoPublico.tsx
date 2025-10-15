import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X } from '@/utils/iconMapper';

export default function DocumentoPublico() {
  const { id } = useParams<{ id: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) {
        setError('ID do documento não fornecido');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('public_documents')
          .select('html_content, title')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Documento não encontrado');
          setLoading(false);
          return;
        }

        setHtmlContent(data.html_content);
        document.title = data.title || 'Documento';
      } catch (err) {
        console.error('Erro ao carregar documento:', err);
        setError('Erro ao carregar documento');
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

  if (loading) {
    return (
      <main role="main" aria-label="Carregando documento">
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-neutral-600">Carregando documento...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main role="main" aria-label="Erro ao carregar documento">
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Documento não encontrado
            </h1>
            <p className="text-neutral-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main role="main" aria-label="Documento público">
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div
            ref={contentRef}
            className="document-public-content"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
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
        .document-public-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .document-public-content img:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        
        @media print {
          .document-public-content {
            max-width: 100%;
          }
          
          .document-public-content img {
            cursor: default;
          }
          
          .document-public-content img:hover {
            transform: none;
            box-shadow: none;
          }
        }
      `}</style>
      </div>
    </main>
  );
}
