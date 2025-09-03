import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Key, Calendar, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const documentTypes = [
    {
      id: "termo-inquilino",
      title: "Termo de Entrega de Chaves - Inquilino",
      description: "Documento para formalizar a entrega de chaves ao inquilino",
      icon: Key,
      color: "bg-primary",
      route: "/documento/termo-inquilino"
    },
    {
      id: "termo-proprietario", 
      title: "Termo de Entrega de Chaves - Proprietário",
      description: "Documento para formalizar a entrega de chaves ao proprietário",
      icon: Building2,
      color: "bg-secondary",
      route: "/documento/termo-proprietario"
    },
    {
      id: "notificacao-vistoria",
      title: "Notificação de Agendamento de Vistoria",
      description: "Notificação oficial para agendamento de vistoria no imóvel",
      icon: Calendar,
      color: "bg-accent",
      route: "/documento/notificacao-vistoria"
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
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-8">
            Funcionalidades do Sistema
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-2">Documentos Padronizados</h4>
              <p className="text-sm text-muted-foreground">
                Templates profissionais prontos para uso
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-2">Personalização Rápida</h4>
              <p className="text-sm text-muted-foreground">
                Preencha apenas os campos necessários
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-2">Impressão Profissional</h4>
              <p className="text-sm text-muted-foreground">
                Documentos prontos para impressão e assinatura
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;