import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function DocumentoPublico() {
  const { id } = useParams<{ id: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Documento não encontrado
          </h1>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div
          className="document-public-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <style>{`
        .document-public-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        
        @media print {
          .document-public-content {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
