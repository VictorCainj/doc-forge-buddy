import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Users, Building, Briefcase, Download } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Contract {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
}

const ProcessoDesocupacao = () => {
  const { contratoId } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const processos = [
    {
      id: "termo-chaves",
      title: "Termo de Recebimento de Chaves",
      description: "Documento para formalizar a entrega das chaves",
      icon: <FileText className="h-6 w-6 text-primary" />,
      route: `/processo/${contratoId}/termo-chaves`,
      status: "pending"
    },
    {
      id: "devolutiva-inquilino",
      title: "Devolutiva para Inquilino",
      description: "Comunicação oficial para o inquilino",
      icon: <Users className="h-6 w-6 text-secondary" />,
      route: `/processo/${contratoId}/devolutiva-inquilino`,
      status: "pending"
    },
    {
      id: "devolutiva-proprietario",
      title: "Devolutiva para Proprietário",
      description: "Comunicação oficial para o proprietário",
      icon: <Building className="h-6 w-6 text-accent" />,
      route: `/processo/${contratoId}/devolutiva-proprietario`,
      status: "pending"
    },
    {
      id: "devolutiva-comercial",
      title: "Devolutiva Comercial",
      description: "Comunicação interna para o setor comercial",
      icon: <Briefcase className="h-6 w-6 text-destructive" />,
      route: `/processo/${contratoId}/devolutiva-comercial`,
      status: "pending"
    }
  ];

  useEffect(() => {
    const fetchContract = async () => {
      if (!contratoId) return;
      
      try {
        const { data, error } = await supabase
          .from('saved_terms')
          .select('*')
          .eq('id', contratoId)
          .eq('document_type', 'contrato')
          .single();

        if (error) throw error;
        
        // Converter os dados do Supabase para o formato esperado
        const contractData: Contract = {
          ...data,
          form_data: typeof data.form_data === 'string' 
            ? JSON.parse(data.form_data) 
            : (data.form_data as Record<string, string>) || {}
        };
        
        setContract(contractData);
      } catch (error) {
        toast.error("Erro ao carregar contrato");
        console.error("Erro ao carregar contrato:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contratoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/contratos">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Processo de Desocupação
            </h1>
            <p className="text-muted-foreground mt-2">
              Contrato #{contratoId} - Gerencie todos os documentos necessários
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {processos.map((processo) => (
            <Card key={processo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {processo.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{processo.title}</CardTitle>
                    <CardDescription>{processo.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link to={processo.route} className="flex-1">
                    <Button className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      Gerar Documento
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" disabled>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Contrato</CardTitle>
            <CardDescription>
              Dados básicos do contrato em processamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : contract ? (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Contrato:</span> {contract.form_data.numeroContrato || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Locatário:</span> {contract.form_data.nomeLocatario || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Proprietário:</span> {contract.form_data.nomeProprietario || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Endereço:</span> {contract.form_data.enderecoImovel || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Início da Desocupação:</span> {contract.form_data.dataInicioDesocupacao || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Término da Desocupação:</span> {contract.form_data.dataTerminoDesocupacao || 'N/A'}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Contrato não encontrado ou não é válido.</p>
                <Link to="/contratos">
                  <Button variant="outline" className="mt-4">
                    Voltar aos Contratos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessoDesocupacao;