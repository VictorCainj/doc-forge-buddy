import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Key, Archive, Building2, Plus, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const documentTypes = [
    {
      id: "contratos",
      title: "Gestão de Contratos",
      description: "Gerenciar contratos e processos de desocupação",
      icon: Building2,
      color: "bg-primary",
      route: "/contratos"
    },
    {
      id: "termos-salvos",
      title: "Documentos Salvos",
      description: "Visualizar e editar documentos anteriores",
      icon: Archive,
      color: "bg-accent",
      route: "/termos-salvos"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">DocGen Imobiliário</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gerador profissional de documentos para administração imobiliária
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Selecione o tipo de documento
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha um dos documentos abaixo para gerar automaticamente com as informações personalizadas
          </p>
        </div>

        {/* Document Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {documentTypes.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <Card 
                key={doc.id} 
                className="hover:shadow-soft transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border"
                onClick={() => navigate(doc.route)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${doc.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {doc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(doc.route);
                    }}
                  >
                    Gerar Documento
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </main>
    </div>
  );
};

export default Index;