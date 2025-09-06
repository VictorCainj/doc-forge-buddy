import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Download, FileText, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2pdf from "html2pdf.js";

interface SavedTerm {
  id: string;
  title: string;
  content: string;
  form_data: any;
  document_type: string;
  created_at: string;
  updated_at: string;
}

const SavedTerms = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<SavedTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<SavedTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    filterTerms();
  }, [searchTerm, terms]);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Erro ao carregar termos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTerms = () => {
    if (!searchTerm) {
      setFilteredTerms(terms);
      return;
    }

    const filtered = terms.filter(term => 
      term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(term.form_data).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredTerms(filtered);
  };

  const handleDownload = async (term: SavedTerm) => {
    // Create temporary element with document content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        ${term.content}
      </div>
    `;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    const opt = {
      margin: 0.5,
      filename: `${term.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(tempDiv).save();
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'termo-inquilino':
        return 'Termo de Recebimento de Chaves';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando termos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <header className="bg-card shadow-card border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Termos Salvos</h1>
              <p className="text-sm text-muted-foreground">Visualize e baixe seus documentos salvos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filters */}
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, tipo ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms Grid */}
          <div className="grid gap-6">
            {filteredTerms.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm ? 'Nenhum termo encontrado' : 'Nenhum termo salvo'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando um novo documento'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => navigate('/')} className="bg-gradient-primary">
                      Criar Novo Documento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTerms.map((term) => (
                <Card key={term.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground mb-2">
                          {term.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {getDocumentTypeLabel(term.document_type)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(term.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(term)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-3">Dados do Documento:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        {Object.entries(term.form_data as Record<string, any>)
                          .filter(([key]) => !key.includes('Term') && !key.includes('Pronoun') && !key.includes('FieldTitle'))
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="text-foreground font-medium truncate" title={String(value)}>
                                {String(value) || '-'}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SavedTerms;