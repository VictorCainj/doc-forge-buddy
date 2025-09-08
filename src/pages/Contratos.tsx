import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Users, Building, Briefcase, Download, Eye, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEVOLUTIVA_PROPRIETARIO_TEMPLATE, DEVOLUTIVA_LOCATARIO_TEMPLATE, NOTIFICACAO_AGENDAMENTO_TEMPLATE } from "@/templates/documentos";
import { formatDateBrazilian } from "@/utils/dateFormatter";

interface Contract {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
}

const Contratos = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dataVistoria, setDataVistoria] = useState('');
  const [horaVistoria, setHoraVistoria] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    // Filtrar contratos baseado no termo de busca
    if (searchTerm.trim() === '') {
      setFilteredContracts(contracts);
    } else {
      const filtered = contracts.filter(contract => 
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.form_data.nomeLocatario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.form_data.nomeProprietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.form_data.numeroContrato?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContracts(filtered);
    }
  }, [contracts, searchTerm]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('document_type', 'contrato')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  // Função para detectar múltiplas pessoas
  const isMultiplePeople = (name: string) => {
    if (!name) return false;
    return name.includes(',') || 
           name.includes(' e ') || 
           name.includes(' E ');
  };

  // Função para gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
  const generateMesesComprovantes = () => {
    const hoje = new Date();
    const meses = [];
    const nomesMeses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    // Pegar os 3 últimos meses
    for (let i = 2; i >= 0; i--) {
      const mes = new Date(hoje);
      mes.setMonth(hoje.getMonth() - i);
      meses.push(nomesMeses[mes.getMonth()]);
    }
    
    // Adicionar ano atual
    const ano = hoje.getFullYear();
    
    return `${meses.join(', ')} de ${ano}`;
  };

  // Função para aplicar conjunções verbais
  const applyConjunctions = (formData: Record<string, string>) => {
    const enhancedData = { ...formData };
    
    // Aplicar conjunções para locatários
    const isMultipleLocatarios = isMultiplePeople(formData.nomeLocatario);
    if (isMultipleLocatarios) {
      enhancedData.locatarioTerm = "os inquilinos";
      enhancedData.locatarioComunicou = "comunicaram";
      enhancedData.locatarioIra = "irão";
      enhancedData.locatarioTermo = "do locatário";
    } else {
      enhancedData.locatarioTerm = "o inquilino";
      enhancedData.locatarioComunicou = "comunicou";
      enhancedData.locatarioIra = "irá";
      enhancedData.locatarioTermo = "do locatário";
    }
    
    // Aplicar conjunções para proprietários
    const isMultipleProprietarios = isMultiplePeople(formData.nomeProprietario);
    if (isMultipleProprietarios) {
      enhancedData.proprietarioTerm = "os proprietários";
      enhancedData.proprietarioPrezado = "Prezados";
    } else {
      enhancedData.proprietarioTerm = "o proprietário";
      enhancedData.proprietarioPrezado = "Prezado";
    }
    
    // Gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
    const mesesComprovantes = generateMesesComprovantes();
    enhancedData.mesesComprovantes = mesesComprovantes;
    
    return enhancedData;
  };

  const generateDocument = (contract: Contract, template: string, documentType: string) => {
    const formData = contract.form_data;
    
    if (documentType === "Termo do Locador") {
      navigate('/termo-locador', {
        state: {
          contractData: formData
        }
      });
    } else if (documentType === "Termo do Locatário") {
      navigate('/termo-locatario', {
        state: {
          contractData: formData
        }
      });
    } else if (documentType === "Notificação de Agendamento") {
      // Abrir modal para preencher data e hora da vistoria
      setSelectedContract(contract);
      setShowAgendamentoModal(true);
    } else {
      
      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);
      
      const processedTemplate = replaceTemplateVariables(template, enhancedData);
      const documentTitle = `${documentType} - ${contract.title}`;
      
      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: documentType
        }
      });
    }
  };

  const replaceTemplateVariables = (template: string, data: Record<string, string>) => {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || `[${key.toUpperCase()}]`);
    });
    return result;
  };

  const handleDeleteContract = async (contractId: string, contractTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o contrato "${contractTitle}"? Esta ação não pode ser desfeita.`)) {
      try {
        const { error } = await supabase
          .from('saved_terms')
          .delete()
          .eq('id', contractId);

        if (error) throw error;

        // Atualizar a lista local
        setContracts(prev => prev.filter(contract => contract.id !== contractId));
        toast.success("Contrato excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir contrato");
      }
    }
  };

  const handleGenerateAgendamento = () => {
    if (!selectedContract || !dataVistoria || !horaVistoria) {
      toast.error('Por favor, preencha a data e hora da vistoria');
      return;
    }

    const formData = selectedContract.form_data;
    
    // Aplicar conjunções verbais antes de processar o template
    const enhancedData = applyConjunctions(formData);
    
    // Adicionar campos específicos para notificação de agendamento
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataVistoria = formatDateBrazilian(new Date(dataVistoria));
    enhancedData.horaVistoria = horaVistoria;
    enhancedData.enderecoImovel = formData.endereco || formData.enderecoImovel || "[ENDEREÇO]";
    enhancedData.numeroContrato = formData.numeroContrato || "[NÚMERO DO CONTRATO]";
    enhancedData.nomeProprietario = formData.nomeProprietario || "[NOME DO PROPRIETÁRIO]";
    enhancedData.nomeLocatario = formData.nomeLocatario || "[NOME DO LOCATÁRIO]";
    
    const processedTemplate = replaceTemplateVariables(NOTIFICACAO_AGENDAMENTO_TEMPLATE, enhancedData);
    const documentTitle = `Notificação de Agendamento - ${selectedContract.title}`;
    
    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: "Notificação de Agendamento"
      }
    });

    // Fechar modal e limpar campos
    setShowAgendamentoModal(false);
    setSelectedContract(null);
    setDataVistoria('');
    setHoraVistoria('');
  };

  const handleCancelAgendamento = () => {
    setShowAgendamentoModal(false);
    setSelectedContract(null);
    setDataVistoria('');
    setHoraVistoria('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gestão de Contratos
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie contratos e processos de desocupação
              </p>
            </div>
            <Link to="/cadastrar-contrato">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Novo Contrato
              </Button>
            </Link>
          </div>
        </header>


        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contratos Cadastrados</CardTitle>
                <CardDescription>
                  Lista dos contratos cadastrados no sistema - Clique nos botões para gerar documentos
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar contratos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {searchTerm ? (
                  <>
                    <p>Nenhum contrato encontrado para "{searchTerm}"</p>
                    <p className="text-sm">Tente outro termo de busca</p>
                  </>
                ) : (
                  <>
                    <p>Nenhum contrato cadastrado ainda</p>
                    <p className="text-sm">Clique em "Novo Contrato" para começar</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContracts.map((contract) => (
                  <Card key={contract.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{contract.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Cadastrado em: {formatDateBrazilian(new Date(contract.created_at))}
                          </p>
                          <div className="mt-2 text-sm">
                            <p><strong>Locatário:</strong> {contract.form_data.nomeLocatario}</p>
                            <p><strong>Proprietário:</strong> {contract.form_data.nomeProprietario}</p>
                            <p><strong>Prazo:</strong> {contract.form_data.prazoDias} dias</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateDocument(contract, "", "Termo do Locador")}
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Termo do Locador
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateDocument(contract, "", "Termo do Locatário")}
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Termo do Locatário
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteContract(contract.id, contract.title)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateDocument(contract, DEVOLUTIVA_PROPRIETARIO_TEMPLATE, "Devolutiva Proprietário")}
                            className="gap-2"
                          >
                            <Building className="h-4 w-4" />
                            Devolutiva Proprietário
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateDocument(contract, DEVOLUTIVA_LOCATARIO_TEMPLATE, "Devolutiva Locatário")}
                            className="gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Devolutiva Locatário
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateDocument(contract, NOTIFICACAO_AGENDAMENTO_TEMPLATE, "Notificação de Agendamento")}
                            className="gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Notificação de Agendamento
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para Notificação de Agendamento */}
      <Dialog open={showAgendamentoModal} onOpenChange={setShowAgendamentoModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Vistoria</DialogTitle>
            <DialogDescription>
              Preencha a data e hora da vistoria de saída para gerar a notificação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataVistoria" className="text-right">
                Data da Vistoria
              </Label>
              <Input
                id="dataVistoria"
                type="date"
                value={dataVistoria}
                onChange={(e) => setDataVistoria(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="horaVistoria" className="text-right">
                Hora da Vistoria
              </Label>
              <Input
                id="horaVistoria"
                type="time"
                value={horaVistoria}
                onChange={(e) => setHoraVistoria(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAgendamento}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateAgendamento}>
              Gerar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;