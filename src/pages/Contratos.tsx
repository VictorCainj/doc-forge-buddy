import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, FileText, Users, Building, Briefcase, Download, Eye, Search, Trash2, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEVOLUTIVA_PROPRIETARIO_TEMPLATE, DEVOLUTIVA_LOCATARIO_TEMPLATE, NOTIFICACAO_AGENDAMENTO_TEMPLATE, DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE, DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE, DEVOLUTIVA_COMERCIAL_TEMPLATE, DEVOLUTIVA_CADERNINHO_TEMPLATE } from "@/templates/documentos";
import { formatDateBrazilian } from "@/utils/dateFormatter";

interface Contract {
  id: string;
  title: string;
  form_data: Record<string, string>;
  created_at: string;
  content: string;
  document_type: string;
  updated_at: string;
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
  const [deletingContract, setDeletingContract] = useState<string | null>(null);
  const [generatingDocument, setGeneratingDocument] = useState<string | null>(null);
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
      
      // Converter os dados do Supabase para o formato esperado
      const contracts: Contract[] = (data || []).map(row => ({
        ...row,
        form_data: typeof row.form_data === 'string' 
          ? JSON.parse(row.form_data) 
          : (row.form_data as Record<string, string>) || {}
      }));
      
      setContracts(contracts);
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

  // Função para obter qualificação completa dos locatários (texto livre)
  const getLocatarioQualificacao = (formData: Record<string, string>) => {
    return formData.qualificacaoCompletaLocatarios || "[TEXTOLIVRE]";
  };

  // Função para aplicar conjunções verbais
  const applyConjunctions = (formData: Record<string, string>) => {
    const enhancedData = { ...formData };
    
    // Obter qualificação completa dos locatários (texto livre)
    enhancedData.qualificacaoCompletaLocatarios = getLocatarioQualificacao(formData);
    
    // Aplicar conjunções para locatários
    const isMultipleLocatarios = isMultiplePeople(formData.nomeLocatario);
    if (isMultipleLocatarios) {
      enhancedData.locatarioTerm = "os inquilinos";
      enhancedData.locatarioComunicou = "informaram";
      enhancedData.locatarioIra = "irão";
      enhancedData.locatarioTermo = "do locatário";
      enhancedData.locatarioPrezado = "Prezado";
    } else {
      enhancedData.locatarioTerm = "o inquilino";
      enhancedData.locatarioComunicou = "informou";
      enhancedData.locatarioIra = "irá";
      enhancedData.locatarioTermo = "do locatário";
      enhancedData.locatarioPrezado = "Prezado";
    }
    
    // Aplicar conjunções para proprietários
    const isMultipleProprietarios = isMultiplePeople(formData.nomeProprietario);
    if (isMultipleProprietarios) {
      enhancedData.proprietarioTerm = "os proprietários";
      enhancedData.proprietarioPrezado = "Prezado";
    } else {
      enhancedData.proprietarioTerm = "o proprietário";
      enhancedData.proprietarioPrezado = "Prezado";
    }
    
    // Gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
    const mesesComprovantes = generateMesesComprovantes();
    enhancedData.mesesComprovantes = mesesComprovantes;
    
    // Extrair primeiro nome do locatário e capitalizar apenas a primeira letra
    const primeiroNome = formData.nomeLocatario?.split(' ')[0] || formData.nomeLocatario || "[PRIMEIRO NOME]";
    const primeiroNomeCapitalizado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
    enhancedData.primeiroNomeLocatario = primeiroNomeCapitalizado;
    
    // Extrair primeiro nome do proprietário e capitalizar apenas a primeira letra
    const primeiroNomeProprietario = formData.nomeProprietario?.split(' ')[0] || formData.nomeProprietario || "[PRIMEIRO NOME]";
    const primeiroNomeProprietarioCapitalizado = primeiroNomeProprietario.charAt(0).toUpperCase() + primeiroNomeProprietario.slice(1).toLowerCase();
    enhancedData.primeiroNomeProprietario = primeiroNomeProprietarioCapitalizado;
    
    // Gerar saudação para devolutiva do proprietário
    enhancedData.saudacaoProprietario = `Prezado Sr <strong>${primeiroNomeProprietarioCapitalizado}</strong>`;
    
    // Gerar saudação para devolutiva do locatário
    enhancedData.saudacaoLocatario = `Prezado Sr <strong>${primeiroNomeCapitalizado}</strong>`;
    
    // Gerar saudação para WhatsApp do proprietário (com Sr/Sra)
    const generoProprietario = formData.generoProprietario;
    const tratamentoProprietario = generoProprietario === "feminino" ? "Prezada Sra" : "Prezado Sr";
    enhancedData.proprietarioPrezadoWhatsapp = tratamentoProprietario;
    
    // Gerar saudação para WhatsApp do locatário (com Sr/Sra)
    const generoLocatario = formData.generoLocatario;
    const tratamentoLocatario = generoLocatario === "feminino" ? "Prezada Sra" : "Prezado Sr";
    enhancedData.locatarioPrezadoWhatsapp = tratamentoLocatario;
    
    // Gerar saudação para devolutiva comercial (bom dia/boa tarde)
    const agora = new Date();
    const hora = agora.getHours();
    const saudacaoComercial = hora < 12 ? "bom dia" : "boa tarde";
    enhancedData.saudacaoComercial = saudacaoComercial;
    
    // Formatar nome do locatário com negrito apenas nos nomes, não na preposição "e"
    const nomeLocatario = formData.nomeLocatario || "[NOME DO LOCATÁRIO]";
    const nomeLocatarioFormatado = nomeLocatario
      .split(' e ')
      .map(nome => `<strong>${nome.trim()}</strong>`)
      .join(' e ');
    enhancedData.nomeLocatarioFormatado = nomeLocatarioFormatado;
    
    // Formatar nome do proprietário com negrito apenas nos nomes, não na preposição "e"
    const nomeProprietario = formData.nomeProprietario || "[NOME DO PROPRIETÁRIO]";
    const nomeProprietarioFormatado = nomeProprietario
      .split(' e ')
      .map(nome => `<strong>${nome.trim()}</strong>`)
      .join(' e ');
    enhancedData.nomeProprietarioFormatado = nomeProprietarioFormatado;
    
    // Adicionar variáveis de data padrão
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataComunicacao = formData.dataComunicacao || formatDateBrazilian(new Date());
    enhancedData.dataInicioDesocupacao = formData.dataInicioDesocupacao || formatDateBrazilian(new Date());
    enhancedData.dataTerminoDesocupacao = formData.dataTerminoDesocupacao || formatDateBrazilian(new Date());
    enhancedData.prazoDias = formData.prazoDias || "30";
    
    // Adicionar variáveis de endereço e contrato
    enhancedData.enderecoImovel = formData.endereco || formData.enderecoImovel || "[ENDEREÇO]";
    enhancedData.numeroContrato = formData.numeroContrato || "[NÚMERO DO CONTRATO]";
    enhancedData.nomeProprietario = formData.nomeProprietario || "[NOME DO PROPRIETÁRIO]";
    enhancedData.nomeLocatario = formData.nomeLocatario || "[NOME DO LOCATÁRIO]";
    
    // Adicionar variáveis específicas dos termos
    enhancedData.dataFirmamentoContrato = formData.dataFirmamentoContrato || formatDateBrazilian(new Date());
    enhancedData.dataVistoria = formData.dataVistoria || formatDateBrazilian(new Date());
    enhancedData.cpflDaev = formData.cpflDaev || "[CPFL/DAEV]";
    enhancedData.quantidadeChaves = formData.quantidadeChaves || "[QUANTIDADE DE CHAVES]";
    
    return enhancedData;
  };

  const generateDocument = (contract: Contract, template: string, documentType: string) => {
    setGeneratingDocument(`${contract.id}-${documentType}`);
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
    } else if (documentType === "Devolutiva Locador WhatsApp" || documentType === "Devolutiva Locatário WhatsApp") {
      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);
      
      const processedTemplate = replaceTemplateVariables(template, enhancedData);
      const documentTitle = `${documentType} - ${contract.title}`;
      
      setTimeout(() => {
        navigate('/gerar-documento', {
          state: {
            title: documentTitle,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType
          }
        });
        setGeneratingDocument(null);
      }, 800);
    } else {
      
      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);
      
      const processedTemplate = replaceTemplateVariables(template, enhancedData);
      
      // Personalizar título para devolutiva comercial
      let documentTitle = `${documentType} - ${contract.title}`;
      if (documentType === "Devolutiva Comercial") {
        documentTitle = `${documentType} - Desocupação - ${contract.title}`;
      }
      
      setTimeout(() => {
        navigate('/gerar-documento', {
          state: {
            title: documentTitle,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType
          }
        });
        setGeneratingDocument(null);
      }, 800);
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
      setDeletingContract(contractId);
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
      } finally {
        setDeletingContract(null);
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
    
    // Definir título para notificação de agendamento baseado no gênero e quantidade de locatários
    const isMultipleLocatarios = isMultiplePeople(formData.nomeLocatario);
    const generoLocatario = formData.generoLocatario;
    
    if (isMultipleLocatarios) {
      enhancedData.notificadoLocatarioTitulo = "Notificados Locatários";
    } else {
      // Para um único locatário, usar o gênero preenchido
      if (generoLocatario === "masculino") {
        enhancedData.notificadoLocatarioTitulo = "Notificado Locatário";
      } else if (generoLocatario === "feminino") {
        enhancedData.notificadoLocatarioTitulo = "Notificada Locatária";
      } else {
        // Fallback para neutro ou não preenchido
        enhancedData.notificadoLocatarioTitulo = "Notificado(a) Locatário(a)";
      }
    }
    
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
    <TooltipProvider>
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
              <div className="space-y-3">
                {filteredContracts.map((contract) => (
                  <Card key={contract.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">{contract.title}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {formatDateBrazilian(new Date(contract.created_at))}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-500">Locatário:</span> 
                              <span className="text-gray-900">{contract.form_data.nomeLocatario}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-500">Proprietário:</span> 
                              <span className="text-gray-900">{contract.form_data.nomeProprietario}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-500">Prazo:</span> 
                              <span className="text-gray-900">{contract.form_data.prazoDias} dias</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-500">Endereço:</span> 
                              <span className="text-gray-900 truncate">{contract.form_data.endereco || contract.form_data.enderecoImovel || 'Não informado'}</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="text-center">
                                <div className="font-medium text-gray-500 mb-1">Data Início</div>
                                <div className="text-gray-900">{contract.form_data.dataInicioDesocupacao || 'Não definida'}</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-500 mb-1">Data Fim</div>
                                <div className="text-gray-900">{contract.form_data.dataTerminoDesocupacao || 'Não definida'}</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-500 mb-1">Status</div>
                                <div className="text-gray-900">Em andamento</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-500 mb-1">Última Atualização</div>
                                <div className="text-gray-900">{formatDateBrazilian(new Date(contract.updated_at))}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="grid grid-cols-2 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, "", "Termo do Locador")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Termo do Locador`}
                                >
                                  {generatingDocument === `${contract.id}-Termo do Locador` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Locador</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Termo do Locador</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, "", "Termo do Locatário")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Termo do Locatário`}
                                >
                                  {generatingDocument === `${contract.id}-Termo do Locatário` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Locatário</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Termo do Locatário</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_PROPRIETARIO_TEMPLATE, "Devolutiva Proprietário")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Proprietário`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Proprietário` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <Building className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Dev. Prop.</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Proprietário</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_LOCATARIO_TEMPLATE, "Devolutiva Locatário")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Locatário`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Locatário` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <Users className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Dev. Loc.</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Locatário</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, NOTIFICACAO_AGENDAMENTO_TEMPLATE, "Notificação de Agendamento")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Notificação de Agendamento`}
                                >
                                  {generatingDocument === `${contract.id}-Notificação de Agendamento` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Agendamento</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Notificação de Agendamento</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_COMERCIAL_TEMPLATE, "Devolutiva Comercial")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Comercial`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Comercial` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <Briefcase className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Comercial</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Comercial</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE, "Devolutiva Locador WhatsApp")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Locador WhatsApp`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Locador WhatsApp` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                  ) : (
                                    <MessageCircle className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">WA Prop.</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Locador WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE, "Devolutiva Locatário WhatsApp")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Locatário WhatsApp`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Locatário WhatsApp` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                  ) : (
                                    <MessageCircle className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">WA Loc.</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Locatário WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateDocument(contract, DEVOLUTIVA_CADERNINHO_TEMPLATE, "Devolutiva Caderninho")}
                                  className="h-8 text-xs"
                                  disabled={generatingDocument === `${contract.id}-Devolutiva Caderninho`}
                                >
                                  {generatingDocument === `${contract.id}-Devolutiva Caderninho` ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Caderninho</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Devolutiva Caderninho</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteContract(contract.id, contract.title)}
                                  className="h-8 text-xs"
                                  disabled={deletingContract === contract.id}
                                >
                                  {deletingContract === contract.id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Excluir</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Excluir Contrato</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
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
    </TooltipProvider>
  );
};

export default Contratos;