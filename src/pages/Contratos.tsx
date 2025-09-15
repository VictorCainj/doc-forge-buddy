import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  FileText,
  Users,
  Building,
  Briefcase,
  Download,
  Eye,
  Search,
  Trash2,
  MessageCircle,
  Edit,
  Calendar,
  Clock,
  MapPin,
  User,
  UserCheck,
  FileCheck,
  FileX,
  NotebookPen,
  Handshake,
  AlertCircle,
  CheckCircle,
  Timer,
  Home,
  User2,
  Building2,
  CalendarDays,
  Phone,
  Mail,
  Receipt,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import {
  DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_TEMPLATE,
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_COMERCIAL_TEMPLATE,
  DEVOLUTIVA_CADERNINHO_TEMPLATE,
  DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
  DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
} from '@/templates/documentos';
import {
  formatDateBrazilian,
  convertDateToBrazilian,
} from '@/utils/dateFormatter';
import {
  gerarDocumentosSolicitados,
  ConfiguracaoDocumentos,
} from '@/utils/documentosSolicitados';

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
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [dataVistoria, setDataVistoria] = useState('');
  const [horaVistoria, setHoraVistoria] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppType, setWhatsAppType] = useState<
    'locador' | 'locatario' | null
  >(null);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [deletingContract, setDeletingContract] = useState<string | null>(null);
  const [generatingDocument, setGeneratingDocument] = useState<string | null>(
    null
  );
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    // Filtrar contratos baseado no termo de busca
    if (searchTerm.trim() === '') {
      setFilteredContracts(contracts);
    } else {
      const filtered = contracts.filter(
        (contract) =>
          contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.form_data.nomeLocatario
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.form_data.nomeProprietario
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contract.form_data.numeroContrato
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
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
      const contracts: Contract[] = (data || []).map((row) => ({
        ...row,
        form_data:
          typeof row.form_data === 'string'
            ? JSON.parse(row.form_data)
            : (row.form_data as Record<string, string>) || {},
      }));

      setContracts(contracts);
    } catch (error) {
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
  const generateMesesComprovantes = () => {
    const hoje = new Date();
    const meses = [];
    const nomesMeses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
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
    return formData.qualificacaoCompletaLocatarios || '[TEXTOLIVRE]';
  };

  // Função para obter qualificação completa dos proprietários (texto livre)
  const getProprietarioQualificacao = (formData: Record<string, string>) => {
    return formData.qualificacaoCompletaLocadores || '[TEXTOLIVRE]';
  };

  // Função para aplicar conjunções verbais
  const applyConjunctions = (formData: Record<string, string>) => {
    const enhancedData = { ...formData };

    // Obter qualificação completa dos locatários (texto livre)
    enhancedData.qualificacaoCompletaLocatarios =
      getLocatarioQualificacao(formData);

    // Obter qualificação completa dos proprietários (texto livre)
    enhancedData.qualificacaoCompletaProprietario =
      getProprietarioQualificacao(formData);

    // Aplicar conjunções para locatários baseado na quantidade adicionada
    const isMultipleLocatarios = !!(
      formData.primeiroLocatario &&
      (formData.segundoLocatario ||
        formData.terceiroLocatario ||
        formData.quartoLocatario)
    );
    enhancedData.isMultipleLocatarios = isMultipleLocatarios.toString();

    if (isMultipleLocatarios) {
      enhancedData.locatarioTerm = 'LOCATÁRIOS';
      enhancedData.locatarioComunicou = 'informaram';
      enhancedData.locatarioIra = 'irão';
      enhancedData.locatarioTermo = 'do locatário';
      enhancedData.locatarioPrezado = 'Prezado';
      enhancedData.locatarioDocumentacao = 'dos locatários';
      enhancedData.locatarioResponsabilidade = 'dos locatários';
    } else if (formData.primeiroLocatario) {
      // Usar o gênero do locatário para definir o termo correto
      const generoLocatario = formData.generoLocatario;
      if (generoLocatario === 'feminino') {
        enhancedData.locatarioTerm = 'LOCATÁRIA';
        enhancedData.locatarioDocumentacao = 'da locatária';
        enhancedData.locatarioResponsabilidade = 'da locatária';
      } else if (generoLocatario === 'masculino') {
        enhancedData.locatarioTerm = 'LOCATÁRIO';
        enhancedData.locatarioDocumentacao = 'do locatário';
        enhancedData.locatarioResponsabilidade = 'do locatário';
      } else {
        enhancedData.locatarioTerm = 'LOCATÁRIO'; // fallback
        enhancedData.locatarioDocumentacao = 'do locatário';
        enhancedData.locatarioResponsabilidade = 'do locatário';
      }
      enhancedData.locatarioComunicou = 'informou';
      enhancedData.locatarioIra = 'irá';
      enhancedData.locatarioTermo = 'do locatário';
      enhancedData.locatarioPrezado = 'Prezado';
    }

    // Usar os dados dos locatários adicionados manualmente
    enhancedData.primeiroLocatario = formData.primeiroLocatario || '';
    enhancedData.segundoLocatario = formData.segundoLocatario || '';
    enhancedData.terceiroLocatario = formData.terceiroLocatario || '';
    enhancedData.quartoLocatario = formData.quartoLocatario || '';

    // Aplicar conjunções para proprietários baseado na quantidade adicionada
    const isMultipleProprietarios =
      formData.nomeProprietario && formData.nomeProprietario.includes(' e ');
    if (isMultipleProprietarios) {
      enhancedData.proprietarioTerm = 'os proprietários';
      enhancedData.locadorTerm = 'LOCADORES';
      enhancedData.proprietarioPrezado = 'Prezado';
    } else if (formData.nomeProprietario) {
      // Usar o gênero do proprietário para definir o termo correto
      const generoProprietario = formData.generoProprietario;
      if (generoProprietario === 'feminino') {
        enhancedData.proprietarioTerm = 'a proprietária';
        enhancedData.locadorTerm = 'LOCADORA';
      } else if (generoProprietario === 'masculino') {
        enhancedData.proprietarioTerm = 'o proprietário';
        enhancedData.locadorTerm = 'LOCADOR';
      } else {
        enhancedData.proprietarioTerm = 'o proprietário'; // fallback
        enhancedData.locadorTerm = 'LOCADOR'; // fallback
      }
      enhancedData.proprietarioPrezado = 'Prezado';
    }

    // Gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
    const mesesComprovantes = generateMesesComprovantes();
    enhancedData.mesesComprovantes = mesesComprovantes;

    // Extrair primeiro nome do locatário e capitalizar apenas a primeira letra
    const nomeLocatarioCompleto =
      formData.nomeLocatario || formData.primeiroLocatario || '[PRIMEIRO NOME]';
    const primeiroNome =
      nomeLocatarioCompleto?.split(' ')[0] ||
      nomeLocatarioCompleto ||
      '[PRIMEIRO NOME]';
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();
    enhancedData.primeiroNomeLocatario = primeiroNomeCapitalizado;

    // Extrair primeiro nome do proprietário e capitalizar apenas a primeira letra
    const nomeProprietarioCompleto =
      formData.nomeProprietario ||
      formData.nomesResumidosLocadores ||
      '[PRIMEIRO NOME]';
    const primeiroNomeProprietario =
      nomeProprietarioCompleto?.split(' ')[0] ||
      nomeProprietarioCompleto ||
      '[PRIMEIRO NOME]';
    const primeiroNomeProprietarioCapitalizado =
      primeiroNomeProprietario.charAt(0).toUpperCase() +
      primeiroNomeProprietario.slice(1).toLowerCase();
    enhancedData.primeiroNomeProprietario =
      primeiroNomeProprietarioCapitalizado;

    // Gerar saudação para devolutiva do proprietário (usando gênero correto)
    const generoProprietario = formData.generoProprietario;
    const nomeProprietarioCompletoSaudacao =
      formData.nomeProprietario || formData.nomesResumidosLocadores || '';
    const isMultipleProprietariosSaudacao =
      nomeProprietarioCompletoSaudacao.includes(' e ') ||
      nomeProprietarioCompletoSaudacao.includes(' E ');

    // Determinar tratamento baseado na quantidade e gênero
    let tratamentoProprietario;
    if (isMultipleProprietariosSaudacao) {
      tratamentoProprietario =
        generoProprietario === 'feminino' ? 'Prezadas' : 'Prezados';
    } else {
      tratamentoProprietario =
        generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
    }

    // Para múltiplos proprietários, incluir apenas o primeiro nome de cada pessoa na saudação
    if (isMultipleProprietariosSaudacao) {
      const nomesProprietariosSaudacao = nomeProprietarioCompletoSaudacao
        .split(/ e | E /)
        .map((nome) => nome.trim());
      const primeirosNomes = nomesProprietariosSaudacao.map((nome) => {
        const primeiroNome = nome.split(' ')[0];
        return (
          primeiroNome.charAt(0).toUpperCase() +
          primeiroNome.slice(1).toLowerCase()
        );
      });
      const nomesFormatados =
        primeirosNomes.length > 1
          ? primeirosNomes
              .slice(0, -1)
              .map((nome) => `<strong>${nome}</strong>`)
              .join(', ') +
            ' e ' +
            `<strong>${primeirosNomes[primeirosNomes.length - 1]}</strong>`
          : `<strong>${primeirosNomes[0]}</strong>`;
      enhancedData.saudacaoProprietario = `${tratamentoProprietario} ${nomesFormatados}`;
    } else {
      enhancedData.saudacaoProprietario = `${tratamentoProprietario} <strong>${primeiroNomeProprietarioCapitalizado}</strong>`;
    }

    // Gerar saudação para devolutiva do locatário (usando gênero correto)
    const generoLocatario = formData.generoLocatario;
    const nomeLocatarioCompletoSaudacao =
      formData.nomeLocatario || formData.primeiroLocatario || '';
    const isMultipleLocatariosSaudacao =
      nomeLocatarioCompletoSaudacao.includes(' e ') ||
      nomeLocatarioCompletoSaudacao.includes(' E ');

    // Determinar tratamento baseado na quantidade e gênero
    let tratamentoLocatario;
    if (isMultipleLocatariosSaudacao) {
      tratamentoLocatario =
        generoLocatario === 'feminino' ? 'Prezadas' : 'Prezados';
    } else {
      tratamentoLocatario =
        generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
    }

    // Para múltiplos locatários, incluir apenas o primeiro nome de cada pessoa na saudação
    if (isMultipleLocatariosSaudacao) {
      const nomesLocatariosSaudacao = nomeLocatarioCompletoSaudacao
        .split(/ e | E /)
        .map((nome) => nome.trim());
      const primeirosNomes = nomesLocatariosSaudacao.map((nome) => {
        const primeiroNome = nome.split(' ')[0];
        return (
          primeiroNome.charAt(0).toUpperCase() +
          primeiroNome.slice(1).toLowerCase()
        );
      });
      const nomesFormatados =
        primeirosNomes.length > 1
          ? primeirosNomes
              .slice(0, -1)
              .map((nome) => `<strong>${nome}</strong>`)
              .join(', ') +
            ' e ' +
            `<strong>${primeirosNomes[primeirosNomes.length - 1]}</strong>`
          : `<strong>${primeirosNomes[0]}</strong>`;
      enhancedData.saudacaoLocatario = `${tratamentoLocatario} ${nomesFormatados}`;
    } else {
      enhancedData.saudacaoLocatario = `${tratamentoLocatario} <strong>${primeiroNomeCapitalizado}</strong>`;
    }

    // Gerar saudação para WhatsApp do proprietário (com Sr/Sra)
    enhancedData.proprietarioPrezadoWhatsapp = tratamentoProprietario;

    // Gerar saudação para WhatsApp do locatário (com Sr/Sra)
    enhancedData.locatarioPrezadoWhatsapp = tratamentoLocatario;

    // Gerar saudação para devolutiva comercial (bom dia/boa tarde)
    const agora = new Date();
    const hora = agora.getHours();
    const saudacaoComercial = hora < 12 ? 'bom dia' : 'boa tarde';
    enhancedData.saudacaoComercial = saudacaoComercial;

    // Formatar nome do locatário com negrito apenas nos nomes, seguindo gramática portuguesa
    const nomeLocatario =
      formData.nomeLocatario ||
      formData.primeiroLocatario ||
      '[NOME DO LOCATÁRIO]';
    const nomesLocatarioArray = nomeLocatario
      .split(/ e | E /)
      .map((nome) => nome.trim());
    const nomeLocatarioFormatado =
      nomesLocatarioArray.length > 1
        ? nomesLocatarioArray.slice(0, -1).join(', ') +
          ' e ' +
          nomesLocatarioArray[nomesLocatarioArray.length - 1]
        : nomesLocatarioArray[0];
    enhancedData.nomeLocatarioFormatado = nomeLocatarioFormatado;

    // Formatar nome do proprietário com negrito apenas nos nomes, seguindo gramática portuguesa
    const nomeProprietario =
      formData.nomeProprietario ||
      formData.nomesResumidosLocadores ||
      '[NOME DO PROPRIETÁRIO]';
    const nomesProprietarioArray = nomeProprietario
      .split(/ e | E /)
      .map((nome) => nome.trim());
    const nomeProprietarioFormatado =
      nomesProprietarioArray.length > 1
        ? nomesProprietarioArray
            .slice(0, -1)
            .map((nome) => `<strong>${nome}</strong>`)
            .join(', ') +
          ' e ' +
          `<strong>${nomesProprietarioArray[nomesProprietarioArray.length - 1]}</strong>`
        : `<strong>${nomesProprietarioArray[0]}</strong>`;
    enhancedData.nomeProprietarioFormatado = nomeProprietarioFormatado;

    // Adicionar variáveis de data padrão
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataComunicacao =
      formData.dataComunicacao || formatDateBrazilian(new Date());
    enhancedData.dataInicioDesocupacao =
      formData.dataInicioDesocupacao || formatDateBrazilian(new Date());
    enhancedData.dataTerminoDesocupacao =
      formData.dataTerminoDesocupacao || formatDateBrazilian(new Date());
    enhancedData.prazoDias = formData.prazoDias || '30';

    // Adicionar variáveis de endereço e contrato
    enhancedData.enderecoImovel =
      formData.endereco || formData.enderecoImovel || '[ENDEREÇO]';
    enhancedData.numeroContrato =
      formData.numeroContrato || '[NÚMERO DO CONTRATO]';
    enhancedData.nomeProprietario =
      formData.nomesResumidosLocadores ||
      formData.nomeProprietario ||
      '[NOME DO PROPRIETÁRIO]';
    enhancedData.nomeLocatario =
      formData.nomeLocatario || '[NOME DO LOCATÁRIO]';

    // Adicionar campos de gênero para uso nos termos
    enhancedData.generoProprietario = formData.generoProprietario;
    enhancedData.generoLocatario = formData.generoLocatario;

    // Adicionar variáveis de tratamento para pronomes de gênero
    const generoProp = formData.generoProprietario;
    const generoLoc = formData.generoLocatario;

    // Tratamento para proprietário (senhor/senhora)
    if (generoProp === 'feminino') {
      enhancedData.tratamentoProprietarioGenero = 'a senhora';
    } else {
      enhancedData.tratamentoProprietarioGenero = 'o senhor';
    }

    // Tratamento para locatário (sua/seu)
    if (generoLoc === 'feminino') {
      enhancedData.tratamentoLocatarioGenero = 'sua';
      enhancedData.tratamentoLocatarioGeneroPlural = 'suas';
    } else if (generoLoc === 'masculino') {
      enhancedData.tratamentoLocatarioGenero = 'seu';
      enhancedData.tratamentoLocatarioGeneroPlural = 'seus';
    } else {
      // Fallback para casos não definidos - usar masculino como padrão
      enhancedData.tratamentoLocatarioGenero = 'seu';
      enhancedData.tratamentoLocatarioGeneroPlural = 'seus';
    }

    // Tratamento para locador (ao locador/à locadora)
    if (generoProp === 'feminino') {
      enhancedData.tratamentoLocadorGenero = 'à locadora';
    } else {
      enhancedData.tratamentoLocadorGenero = 'ao locador';
    }

    // Tratamento para notificação (V.Sa/V.S)
    if (generoLoc === 'feminino') {
      enhancedData.tratamentoLocatarioNotificacao = 'V.Sa';
    } else {
      enhancedData.tratamentoLocatarioNotificacao = 'V.S';
    }

    // Adicionar campos de nomes resumidos para uso nos termos
    enhancedData.nomesResumidosLocadores = formData.nomesResumidosLocadores;

    // Adicionar variáveis específicas dos termos
    enhancedData.dataFirmamentoContrato =
      formData.dataFirmamentoContrato || formatDateBrazilian(new Date());
    enhancedData.dataVistoria =
      formData.dataVistoria || formatDateBrazilian(new Date());
    enhancedData.cpflDaev = formData.cpflDaev || '[CPFL/DAEV]';
    enhancedData.quantidadeChaves =
      formData.quantidadeChaves || '[QUANTIDADE DE CHAVES]';

    // Adicionar campos de energia e água para o template de cobrança
    enhancedData.cpfl = formData.cpfl || 'SIM';
    enhancedData.statusAgua = formData.statusAgua || 'SIM';
    enhancedData.tipoAgua = formData.tipoAgua || 'DAEV';

    // Adicionar variáveis específicas do distrato
    enhancedData.dataLiquidacao =
      formData.dataLiquidacao || formatDateBrazilian(new Date());

    // Gerar lista personalizada de documentos solicitados para devolutiva locatário
    const configDocumentos: ConfiguracaoDocumentos = {
      solicitarCondominio: formData.solicitarCondominio,
      solicitarAgua: formData.solicitarAgua,
      solicitarEnergia: 'sim', // Energia sempre deve ser solicitada
      solicitarGas: formData.solicitarGas,
      solicitarCND: formData.solicitarCND,
    };

    enhancedData.documentosSolicitados =
      gerarDocumentosSolicitados(configDocumentos);

    // Manter os campos individuais para uso em condicionais do template
    enhancedData.solicitarCondominio = formData.solicitarCondominio;
    enhancedData.solicitarAgua = formData.solicitarAgua;
    enhancedData.solicitarEnergia = 'sim'; // Energia sempre deve ser solicitada
    enhancedData.solicitarGas = formData.solicitarGas;
    enhancedData.solicitarCND = formData.solicitarCND;

    return enhancedData;
  };

  const generateDocument = (
    contract: Contract,
    template: string,
    documentType: string
  ) => {
    setGeneratingDocument(`${contract.id}-${documentType}`);
    const formData = contract.form_data;

    if (documentType === 'Termo do Locador') {
      navigate('/termo-locador', {
        state: {
          contractData: formData,
        },
      });
    } else if (documentType === 'Termo do Locatário') {
      navigate('/termo-locatario', {
        state: {
          contractData: formData,
        },
      });
    } else if (documentType === 'Notificação de Agendamento') {
      // Abrir modal para preencher data e hora da vistoria
      setSelectedContract(contract);
      setShowAgendamentoModal(true);
    } else if (
      documentType === 'Devolutiva Locador WhatsApp' ||
      documentType === 'Devolutiva Locatário WhatsApp'
    ) {
      // Abrir modal para selecionar pessoa específica
      setSelectedContract(contract);
      setWhatsAppType(
        documentType === 'Devolutiva Locador WhatsApp' ? 'locador' : 'locatario'
      );
      setSelectedPerson('');
      setShowWhatsAppModal(true);
      setGeneratingDocument(null);
    } else if (documentType === 'Distrato de Contrato de Locação') {
      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);

      const processedTemplate = replaceTemplateVariables(
        template,
        enhancedData
      );
      const documentTitle = `${documentType} - ${contract.title}`;

      setTimeout(() => {
        navigate('/gerar-documento', {
          state: {
            title: documentTitle,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType,
          },
        });
        setGeneratingDocument(null);
      }, 800);
    } else {
      // Aplicar conjunções verbais antes de processar o template
      const enhancedData = applyConjunctions(formData);

      const processedTemplate = replaceTemplateVariables(
        template,
        enhancedData
      );

      // Personalizar título para devolutiva comercial
      let documentTitle = `${documentType} - ${contract.title}`;
      if (documentType === 'Devolutiva Comercial') {
        documentTitle = `${documentType} - Desocupação - ${contract.title}`;
      }

      setTimeout(() => {
        navigate('/gerar-documento', {
          state: {
            title: documentTitle,
            template: processedTemplate,
            formData: enhancedData,
            documentType: documentType,
          },
        });
        setGeneratingDocument(null);
      }, 800);
    }
  };

  const replaceTemplateVariables = (
    template: string,
    data: Record<string, string>
  ) => {
    let result = template;

    // Processar condicionais Handlebars {{#eq}} (igualdade)
    result = result.replace(
      /\{\{#eq\s+(\w+)\s+"([^"]+)"\}\}([\s\S]*?)\{\{\/eq\}\}/g,
      (match, variable, expectedValue, content) => {
        if (data[variable] === expectedValue) {
          return content;
        }
        return '';
      }
    );

    // Processar condicionais Handlebars com else
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{#else\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, ifContent, elseContent) => {
        if (data[variable] && data[variable].trim()) {
          return ifContent;
        }
        return elseContent;
      }
    );

    // Processar condicionais Handlebars simples (sem else)
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, content) => {
        if (data[variable] && data[variable].trim()) {
          return content;
        }
        return '';
      }
    );

    // Substituir variáveis
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      // Para observações vazias, não exibir placeholder
      let formattedValue =
        value || (key === 'observacao' ? '' : `[${key.toUpperCase()}]`);

      // Formatar datas automaticamente
      if (
        key.toLowerCase().includes('data') ||
        key.toLowerCase().includes('date')
      ) {
        if (value && value.trim() !== '') {
          formattedValue = convertDateToBrazilian(value);
        }
      }

      result = result.replace(new RegExp(placeholder, 'g'), formattedValue);
    });

    return result;
  };

  const handleDeleteContract = async (
    contractId: string,
    contractTitle: string
  ) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o contrato "${contractTitle}"? Esta ação não pode ser desfeita.`
      )
    ) {
      setDeletingContract(contractId);
      try {
        const { error } = await supabase
          .from('saved_terms')
          .delete()
          .eq('id', contractId);

        if (error) throw error;

        // Atualizar a lista local
        setContracts((prev) =>
          prev.filter((contract) => contract.id !== contractId)
        );
        toast.success('Contrato excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir contrato');
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
    enhancedData.enderecoImovel =
      formData.endereco || formData.enderecoImovel || '[ENDEREÇO]';
    enhancedData.numeroContrato =
      formData.numeroContrato || '[NÚMERO DO CONTRATO]';
    enhancedData.nomeProprietario =
      formData.nomesResumidosLocadores ||
      formData.nomeProprietario ||
      '[NOME DO PROPRIETÁRIO]';
    enhancedData.nomeLocatario =
      formData.nomeLocatario || '[NOME DO LOCATÁRIO]';

    // Adicionar versões formatadas para os templates
    const nomeProprietario =
      formData.nomesResumidosLocadores ||
      formData.nomeProprietario ||
      '[NOME DO PROPRIETÁRIO]';
    const nomesProprietarioArray = nomeProprietario
      .split(/ e | E /)
      .map((nome) => nome.trim());
    enhancedData.nomeProprietarioFormatado =
      nomesProprietarioArray.length > 1
        ? nomesProprietarioArray
            .slice(0, -1)
            .map((nome) => `<strong>${nome}</strong>`)
            .join(', ') +
          ' e ' +
          `<strong>${nomesProprietarioArray[nomesProprietarioArray.length - 1]}</strong>`
        : `<strong>${nomesProprietarioArray[0]}</strong>`;

    const nomeLocatario = formData.nomeLocatario || '[NOME DO LOCATÁRIO]';
    const nomesLocatarioArray = nomeLocatario
      .split(/ e | E /)
      .map((nome) => nome.trim());
    enhancedData.nomeLocatarioFormatado =
      nomesLocatarioArray.length > 1
        ? nomesLocatarioArray.slice(0, -1).join(', ') +
          ' e ' +
          nomesLocatarioArray[nomesLocatarioArray.length - 1]
        : nomesLocatarioArray[0];

    // Definir título para notificação de agendamento baseado na quantidade de locatários adicionados
    const isMultipleLocatarios =
      formData.primeiroLocatario &&
      (formData.segundoLocatario ||
        formData.terceiroLocatario ||
        formData.quartoLocatario);
    const generoLocatario = formData.generoLocatario;

    if (isMultipleLocatarios) {
      enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
    } else if (formData.primeiroLocatario) {
      // Para um único locatário, usar o gênero preenchido
      if (generoLocatario === 'masculino') {
        enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
      } else if (generoLocatario === 'feminino') {
        enhancedData.notificadoLocatarioTitulo = 'Notificada Locatária';
      } else {
        // Fallback para neutro ou não preenchido
        enhancedData.notificadoLocatarioTitulo = 'Notificado(a) Locatário(a)';
      }
    }

    const processedTemplate = replaceTemplateVariables(
      NOTIFICACAO_AGENDAMENTO_TEMPLATE,
      enhancedData
    );
    const documentTitle = `Notificação de Agendamento - ${selectedContract.title}`;

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: 'Notificação de Agendamento',
      },
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

  const handleGenerateWhatsApp = () => {
    if (!selectedContract || !selectedPerson || !whatsAppType) {
      toast.error('Por favor, selecione uma pessoa');
      return;
    }

    const formData = selectedContract.form_data;
    const enhancedData = applyConjunctions(formData);

    // Personalizar saudação para a pessoa selecionada
    const primeiroNome = selectedPerson.split(' ')[0];
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();

    if (whatsAppType === 'locador') {
      // Para WhatsApp, sempre é uma pessoa selecionada, então usar singular baseado no gênero
      const generoProprietario = formData.generoProprietario;
      const tratamento =
        generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
      enhancedData.saudacaoProprietario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
    } else {
      // Para WhatsApp, sempre é uma pessoa selecionada, então usar singular baseado no gênero
      const generoLocatario = formData.generoLocatario;
      const tratamento = generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
      enhancedData.saudacaoLocatario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
    }

    const template =
      whatsAppType === 'locador'
        ? DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE
        : DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE;
    const processedTemplate = replaceTemplateVariables(template, enhancedData);
    const documentTitle = `Devolutiva ${whatsAppType === 'locador' ? 'Locador' : 'Locatário'} WhatsApp - ${selectedContract.title}`;

    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: `Devolutiva ${whatsAppType === 'locador' ? 'Locador' : 'Locatário'} WhatsApp`,
      },
    });

    // Fechar modal e limpar campos
    setShowWhatsAppModal(false);
    setSelectedContract(null);
    setWhatsAppType(null);
    setSelectedPerson('');
  };

  const handleCancelWhatsApp = () => {
    setShowWhatsAppModal(false);
    setSelectedContract(null);
    setWhatsAppType(null);
    setSelectedPerson('');
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setEditFormData(contract.form_data);
    setShowEditModal(true);
  };

  const handleUpdateContract = async () => {
    if (!editingContract) return;

    setIsUpdating(true);
    try {
      // Adicionar campos automáticos
      const enhancedData = {
        ...editFormData,
        prazoDias: '30', // Sempre 30 dias
        dataComunicacao: editFormData.dataInicioDesocupacao, // Data de comunicação = data de início
      };

      const { error } = await supabase
        .from('saved_terms')
        .update({
          title: `Contrato ${editFormData.numeroContrato || '[NÚMERO]'} - ${editFormData.nomeLocatario || '[LOCATÁRIO]'}`,
          content: JSON.stringify(enhancedData),
          form_data: enhancedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingContract.id);

      if (error) throw error;

      // Atualizar a lista local
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === editingContract.id
            ? {
                ...contract,
                form_data: enhancedData,
                title: `Contrato ${editFormData.numeroContrato || '[NÚMERO]'} - ${editFormData.nomeLocatario || '[LOCATÁRIO]'}`,
                updated_at: new Date().toISOString(),
              }
            : contract
        )
      );

      toast.success('Contrato atualizado com sucesso!');
      setShowEditModal(false);
      setEditingContract(null);
      setEditFormData({});
    } catch (error) {
      toast.error('Erro ao atualizar contrato');
      console.error('Erro ao atualizar contrato:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingContract(null);
    setEditFormData({});
  };

  // Função auxiliar para renderizar ícone com loading
  const renderIconWithLoading = (
    icon: React.ReactNode,
    contractId: string,
    documentType: string
  ) => {
    const isGenerating = generatingDocument === `${contractId}-${documentType}`;
    return isGenerating ? (
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
    ) : (
      icon
    );
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        {/* Header da Página */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Contratos Cadastrados
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {filteredContracts.length}
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie e monitore todos os contratos de locação.
              </p>
            </div>
            <Link to="/cadastrar-contrato">
              <Button
                size="lg"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 h-12 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Plus className="h-5 w-5" />
                Novo Contrato
              </Button>
            </Link>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
          </div>
        </div>

        {/* Lista de Contratos */}
        <div>
          {loading ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="p-4 bg-slate-100 rounded-xl mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-600 animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-medium text-slate-700">
                Carregando contratos...
              </p>
              <p className="text-sm text-slate-500 mt-1">Aguarde um momento</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-slate-100 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-500" />
              </div>
              {searchTerm ? (
                <>
                  <p className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum contrato encontrado para "{searchTerm}"
                  </p>
                  <p className="text-slate-600">Tente outro termo de busca</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum contrato cadastrado ainda
                  </p>
                  <p className="text-slate-600">
                    Clique em "Novo Contrato" para começar
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredContracts.map((contract) => (
                <Card
                  key={contract.id}
                  className="border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white rounded-lg overflow-visible"
                >
                  <CardContent className="p-4">
                    {/* Header do Contrato */}
                    <div className="flex items-start gap-2 mb-4">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          Contrato{' '}
                          {contract.form_data.numeroContrato || '[NÚMERO]'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          ID: {contract.id}
                        </p>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-200 mb-4"></div>

                    {/* PARTES ENVOLVIDAS */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 uppercase mb-2">
                        PARTES ENVOLVIDAS
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <User2 className="h-3 w-3 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase">
                              LOCATÁRIO
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              {contract.form_data.nomeLocatario}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="h-3 w-3 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase">
                              PROPRIETÁRIO
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              {contract.form_data.nomeProprietario}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TERMOS DO CONTRATO */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 uppercase mb-2">
                        TERMOS DO CONTRATO
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Timer className="h-3 w-3 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-600 uppercase">
                              PRAZO
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              {contract.form_data.prazoDias} dias
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <CalendarDays className="h-3 w-3 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">
                                INÍCIO
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                {contract.form_data.dataInicioDesocupacao ||
                                  '01/09/2026'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="h-3 w-3 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">
                                TÉRMINO
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                {contract.form_data.dataTerminoDesocupacao ||
                                  '01/10/2026'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LOCALIZAÇÃO */}
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 uppercase mb-2">
                        LOCALIZAÇÃO
                      </h4>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase">
                            ENDEREÇO
                          </p>
                          <p className="text-xs font-bold text-gray-900">
                            {contract.form_data.endereco ||
                              contract.form_data.enderecoImovel ||
                              '460 - Rua Interna: Rua dos Sablas, Casa 421 - Condomínio Green Valley, Bairro Flores, Manaus - AM'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES RÁPIDAS */}
                    <div className="border-t border-gray-200 pt-4 relative overflow-visible flex justify-center">
                      <QuickActionsDropdown
                        contractId={contract.id}
                        contractNumber={
                          contract.form_data.numeroContrato || '[NÚMERO]'
                        }
                        onGenerateDocument={(contractId, template, title) => {
                          const contractData = contracts.find(
                            (c) => c.id === contractId
                          );
                          if (contractData) {
                            generateDocument(contractData, template, title);
                          }
                        }}
                        onNavigateToTerm={(contractId, termType) => {
                          // Implementar navegação para termos se necessário
                          console.log(
                            `Navigate to ${termType} for contract ${contractId}`
                          );
                        }}
                        onEditContract={(contractId) => {
                          const contractData = contracts.find(
                            (c) => c.id === contractId
                          );
                          if (contractData) {
                            handleEditContract(contractData);
                          }
                        }}
                        onDeleteContract={(contractId) => {
                          const contractData = contracts.find(
                            (c) => c.id === contractId
                          );
                          if (contractData) {
                            handleDeleteContract(
                              contractId,
                              contractData.title
                            );
                          }
                        }}
                        generatingDocument={generatingDocument}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal para Notificação de Agendamento */}
        <Dialog
          open={showAgendamentoModal}
          onOpenChange={setShowAgendamentoModal}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar Vistoria</DialogTitle>
              <DialogDescription>
                Preencha a data e hora da vistoria de saída para gerar a
                notificação.
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

        {/* Modal para Seleção de WhatsApp */}
        <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Selecionar Pessoa para WhatsApp</DialogTitle>
              <DialogDescription>
                Selecione para qual{' '}
                {whatsAppType === 'locador' ? 'locador' : 'locatário'} você
                deseja enviar a mensagem do WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="selectedPerson" className="text-right">
                  {whatsAppType === 'locador' ? 'Locador' : 'Locatário'}
                </Label>
                <Select
                  value={selectedPerson}
                  onValueChange={setSelectedPerson}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={`Selecione um ${whatsAppType === 'locador' ? 'locador' : 'locatário'}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsAppType === 'locador'
                      ? (() => {
                          const nomesLocadores =
                            selectedContract?.form_data
                              .nomesResumidosLocadores ||
                            selectedContract?.form_data.nomeProprietario;
                          if (nomesLocadores) {
                            const nomesArray = nomesLocadores
                              .split(/ e | E /)
                              .map((nome) => nome.trim())
                              .filter((nome) => nome);
                            return nomesArray.map((nome, index) => (
                              <SelectItem key={index} value={nome}>
                                {nome}
                              </SelectItem>
                            ));
                          }
                          return (
                            <SelectItem
                              value="Nenhum locador encontrado"
                              disabled
                            >
                              Nenhum locador encontrado
                            </SelectItem>
                          );
                        })()
                      : (() => {
                          const nomesLocatarios =
                            selectedContract?.form_data.nomeLocatario ||
                            selectedContract?.form_data.primeiroLocatario;
                          if (nomesLocatarios) {
                            const nomesArray = nomesLocatarios
                              .split(/ e | E /)
                              .map((nome) => nome.trim())
                              .filter((nome) => nome);
                            return nomesArray.map((nome, index) => (
                              <SelectItem key={index} value={nome}>
                                {nome}
                              </SelectItem>
                            ));
                          }
                          return (
                            <SelectItem
                              value="Nenhum locatário encontrado"
                              disabled
                            >
                              Nenhum locatário encontrado
                            </SelectItem>
                          );
                        })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelWhatsApp}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateWhatsApp}
                disabled={!selectedPerson}
              >
                Gerar WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para Edição de Contrato */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Contrato</DialogTitle>
              <DialogDescription>
                Edite as informações do contrato. Todos os campos são editáveis.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Dados do Contrato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Contrato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-numeroContrato">
                      Número do Contrato
                    </Label>
                    <Input
                      id="edit-numeroContrato"
                      value={editFormData.numeroContrato || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          numeroContrato: e.target.value,
                        }))
                      }
                      placeholder="Ex: 13734"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nomeLocatario">
                      Nome do Locatário
                    </Label>
                    <Input
                      id="edit-nomeLocatario"
                      value={editFormData.nomeLocatario || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          nomeLocatario: e.target.value,
                        }))
                      }
                      placeholder="Ex: Beatriz ou INSERVICE LIMPEZA E INFRA-ESTRUTURA LTDA"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-generoLocatario">
                      Gênero do Locatário
                    </Label>
                    <Select
                      value={editFormData.generoLocatario || ''}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          generoLocatario: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="neutro">
                          Neutro (múltiplos locatários)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-enderecoImovel">
                      Endereço do Imóvel
                    </Label>
                    <Input
                      id="edit-enderecoImovel"
                      value={editFormData.enderecoImovel || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          enderecoImovel: e.target.value,
                        }))
                      }
                      placeholder="Endereço completo do imóvel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataFirmamentoContrato">
                    Data de Firmamento do Contrato
                  </Label>
                  <Input
                    id="edit-dataFirmamentoContrato"
                    value={editFormData.dataFirmamentoContrato || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        dataFirmamentoContrato: e.target.value,
                      }))
                    }
                    placeholder="Ex: 15/10/2024 ou 15 de outubro de 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-incluirQuantidadeChaves">
                    Incluir quantidade de chaves no contrato?
                  </Label>
                  <Select
                    value={editFormData.incluirQuantidadeChaves || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        incluirQuantidadeChaves: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">
                        Sim - Incluir quantidade de chaves
                      </SelectItem>
                      <SelectItem value="nao">
                        Não - Não incluir quantidade de chaves
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editFormData.incluirQuantidadeChaves === 'sim' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantidadeChaves">
                      Quantidade e tipo de chaves
                    </Label>
                    <Textarea
                      id="edit-quantidadeChaves"
                      value={editFormData.quantidadeChaves || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          quantidadeChaves: e.target.value,
                        }))
                      }
                      placeholder="Ex: 04 chaves simples, 02 chaves tetra"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-qualificacaoCompletaLocatarios">
                    Qualificação Completa dos Locatários
                  </Label>
                  <Textarea
                    id="edit-qualificacaoCompletaLocatarios"
                    value={editFormData.qualificacaoCompletaLocatarios || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        qualificacaoCompletaLocatarios: e.target.value,
                      }))
                    }
                    placeholder="Ex: DIOGO VIEIRA ORLANDO, brasileiro, divorciado, engenheiro ambiental..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Dados dos Locadores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Qualificação dos Locadores
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nomesResumidosLocadores">
                      Nomes dos Locadores
                    </Label>
                    <Input
                      id="edit-nomesResumidosLocadores"
                      value={editFormData.nomesResumidosLocadores || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          nomesResumidosLocadores: e.target.value,
                        }))
                      }
                      placeholder="Ex: JOÃO SILVA SANTOS e MARIA SILVA SANTOS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-generoProprietario">
                      Gênero dos Locadores
                    </Label>
                    <Select
                      value={editFormData.generoProprietario || ''}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          generoProprietario: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="neutro">
                          Neutro (múltiplos locadores)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-qualificacaoCompletaLocadores">
                    Qualificação Completa dos Locadores
                  </Label>
                  <Textarea
                    id="edit-qualificacaoCompletaLocadores"
                    value={editFormData.qualificacaoCompletaLocadores || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        qualificacaoCompletaLocadores: e.target.value,
                      }))
                    }
                    placeholder="Ex: JOÃO SILVA SANTOS, brasileiro, casado, empresário..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Dados de Desocupação */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados de Desocupação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dataInicioDesocupacao">
                      Data de Início da Desocupação
                    </Label>
                    <Input
                      id="edit-dataInicioDesocupacao"
                      value={editFormData.dataInicioDesocupacao || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          dataInicioDesocupacao: e.target.value,
                        }))
                      }
                      placeholder="DD/MM/AAAA - Ex: 23/06/2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dataTerminoDesocupacao">
                      Data de Término da Desocupação
                    </Label>
                    <Input
                      id="edit-dataTerminoDesocupacao"
                      value={editFormData.dataTerminoDesocupacao || ''}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          dataTerminoDesocupacao: e.target.value,
                        }))
                      }
                      placeholder="DD/MM/AAAA - Ex: 22/07/2025"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateContract} disabled={isUpdating}>
                {isUpdating ? 'Atualizando...' : 'Atualizar Contrato'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Contratos;
