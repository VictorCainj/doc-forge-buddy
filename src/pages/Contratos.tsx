import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  // Tooltip,
  // TooltipContent,
  TooltipProvider,
  // TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  FileText,
  Clock,
  MapPin,
  User,
  Timer,
  User2,
  CalendarDays,
  Phone,
  Edit,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { useSearchContext } from '@/hooks/useSearchContext';
import { useOptimizedData } from '@/hooks/useOptimizedData';
import {
  // DEVOLUTIVA_PROPRIETARIO_TEMPLATE,
  // DEVOLUTIVA_LOCATARIO_TEMPLATE,
  NOTIFICACAO_AGENDAMENTO_TEMPLATE,
  DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE,
  DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE,
  // DEVOLUTIVA_COMERCIAL_TEMPLATE,
  // DEVOLUTIVA_CADERNINHO_TEMPLATE,
  // DISTRATO_CONTRATO_LOCACAO_TEMPLATE,
  // DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE,
  TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
  NPS_WHATSAPP_TEMPLATE,
  NPS_EMAIL_TEMPLATE,
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
  const { searchTerm, setSearchTerm } = useSearchContext();

  // Função para abrir Google Maps com o endereço
  const openGoogleMaps = (endereco: string) => {
    const enderecoEncoded = encodeURIComponent(endereco);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  }; // Usar busca da sidebar
  const {
    data: contracts,
    loading,
    hasMore,
    loadMore,
    totalCount,
  } = useOptimizedData({
    documentType: 'contrato',
    limit: 6,
    searchTerm: searchTerm,
  });

  const loadMoreContracts = async () => {
    await loadMore();
  };



  // Função para gerar meses dos comprovantes (sempre os 3 últimos meses da data atual)
  const generateMesesComprovantes = () => {
    const hoje = new Date();
    const meses: string[] = [];
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

    // O assinante será definido pelo usuário em cada geração de documento

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
      enhancedData.locatarioTermComercial = 'LOCATÁRIOS';
      enhancedData.locatarioTermNoArtigo = 'os locatários';
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
        enhancedData.locatarioTermComercial = 'LOCATÁRIA';
        enhancedData.locatarioTermNoArtigo = 'a locatária';
        enhancedData.locatarioDocumentacao = 'da locatária';
        enhancedData.locatarioResponsabilidade = 'da locatária';
      } else if (generoLocatario === 'masculino') {
        enhancedData.locatarioTerm = 'LOCATÁRIO';
        enhancedData.locatarioTermComercial = 'LOCATÁRIO';
        enhancedData.locatarioTermNoArtigo = 'o locatário';
        enhancedData.locatarioDocumentacao = 'do locatário';
        enhancedData.locatarioResponsabilidade = 'do locatário';
      } else {
        enhancedData.locatarioTerm = 'LOCATÁRIO'; // fallback
        enhancedData.locatarioTermComercial = 'LOCATÁRIO'; // fallback
        enhancedData.locatarioTermNoArtigo = 'o locatário';
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
      enhancedData.locadorTermComercial = 'LOCADORES';
      enhancedData.proprietarioPrezado = 'Prezado';
    } else if (formData.nomeProprietario) {
      // Usar o gênero do proprietário para definir o termo correto
      const generoProprietario = formData.generoProprietario;
      if (generoProprietario === 'feminino') {
        enhancedData.proprietarioTerm = 'a proprietária';
        enhancedData.locadorTerm = 'LOCADORA';
        enhancedData.locadorTermComercial = 'LOCADORA';
      } else if (generoProprietario === 'masculino') {
        enhancedData.proprietarioTerm = 'o proprietário';
        enhancedData.locadorTerm = 'LOCADOR';
        enhancedData.locadorTermComercial = 'LOCADOR';
      } else {
        enhancedData.proprietarioTerm = 'o proprietário'; // fallback
        enhancedData.locadorTerm = 'LOCADOR'; // fallback
        enhancedData.locadorTermComercial = 'LOCADOR'; // fallback
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

    // Gerar saudação para processo de rescisão (bom dia/boa tarde)
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
    enhancedData.dataInicioRescisao =
      formData.dataInicioRescisao || formatDateBrazilian(new Date());
    enhancedData.dataTerminoRescisao =
      formData.dataTerminoRescisao || formatDateBrazilian(new Date());
    enhancedData.prazoDias = formData.prazoDias || '30';

    // Adicionar variáveis específicas para Termo de Recusa de Assinatura - E-mail
    enhancedData.dataRealizacaoVistoria =
      formData.dataRealizacaoVistoria || formatDateBrazilian(new Date());
    enhancedData.assinanteSelecionado =
      formData.assinanteSelecionado || '[NOME DO ASSINANTE]';

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
    // Usar os dados cadastrados no contrato ou valores padrão
    enhancedData.cpfl = formData.cpfl || 'SIM';
    enhancedData.statusAgua = formData.statusAgua || 'SIM';
    enhancedData.tipoAgua = formData.tipoAgua || 'DAEV';

    // Adicionar variáveis específicas do distrato
    enhancedData.dataLiquidacao =
      formData.dataLiquidacao || formatDateBrazilian(new Date());

    // Gerar lista personalizada de documentos solicitados baseada nas contas cadastradas
    const configDocumentos: ConfiguracaoDocumentos = {
      solicitarCondominio: formData.solicitarCondominio || 'nao',
      solicitarAgua: formData.statusAgua === 'SIM' ? 'sim' : 'nao',
      solicitarEnergia: formData.cpfl === 'SIM' ? 'sim' : 'nao',
      solicitarGas: formData.solicitarGas || 'nao',
      solicitarCND: formData.solicitarCND || 'nao',
    };

    enhancedData.documentosSolicitados =
      gerarDocumentosSolicitados(configDocumentos);

    // Manter os campos individuais para uso em condicionais do template
    enhancedData.solicitarCondominio = formData.solicitarCondominio || 'nao';
    enhancedData.solicitarAgua = formData.statusAgua === 'SIM' ? 'sim' : 'nao';
    enhancedData.solicitarEnergia = formData.cpfl === 'SIM' ? 'sim' : 'nao';
    enhancedData.solicitarGas = formData.solicitarGas || 'nao';
    enhancedData.solicitarCND = formData.solicitarCND || 'nao';

    return enhancedData;
  };

  const generateDocumentWithAssinante = (
    contract: Contract,
    template: string,
    documentType: string,
    assinante: string
  ) => {
    const formData = contract.form_data;

    // Aplicar conjunções verbais antes de processar o template
    const enhancedData = applyConjunctions(formData);
    enhancedData.assinanteSelecionado = assinante;

    // Se for notificação de agendamento, adicionar dados específicos
    if (documentType.includes('Notificação de Agendamento')) {
      enhancedData.dataAtual = formatDateBrazilian(new Date());
      enhancedData.dataVistoria = dataVistoria || formatDateBrazilian(new Date());
      enhancedData.horaVistoria = horaVistoria || '';
      enhancedData.tipoVistoria = tipoVistoria;

      // Configurar tipo de vistoria
      const tipoVistoriaTexto =
        tipoVistoria === 'revistoria' ? 'Revistoria' : 'Vistoria Final';
      enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
      enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
      enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

      // Configurar tratamento do locatário para notificação
      const isMultipleLocatarios = !!(
        formData.primeiroLocatario &&
        (formData.segundoLocatario ||
          formData.terceiroLocatario ||
          formData.quartoLocatario)
      );
      const generoLocatario = formData.generoLocatario;

      if (isMultipleLocatarios) {
        enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
        enhancedData.tratamentoLocatarioNotificacao = 'dos locatários';
      } else if (formData.primeiroLocatario) {
        if (generoLocatario === 'masculino') {
          enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
          enhancedData.tratamentoLocatarioNotificacao = 'do locatário';
        } else if (generoLocatario === 'feminino') {
          enhancedData.notificadoLocatarioTitulo = 'Notificada Locatária';
          enhancedData.tratamentoLocatarioNotificacao = 'da locatária';
        } else {
          // Se não especificado, usar masculino como padrão
          enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
          enhancedData.tratamentoLocatarioNotificacao = 'do locatário';
        }
      }
    }

    // Se for WhatsApp, adicionar dados específicos
    if (documentType.includes('WhatsApp')) {
      const primeiroNome = selectedPerson.split(' ')[0];
      const primeiroNomeCapitalizado =
        primeiroNome.charAt(0).toUpperCase() +
        primeiroNome.slice(1).toLowerCase();

      if (whatsAppType === 'locador') {
        const generoProprietario = formData.generoProprietario;
        const tratamento =
          generoProprietario === 'feminino' ? 'Prezada' : 'Prezado';
        enhancedData.saudacaoProprietario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
      } else {
        const generoLocatario = formData.generoLocatario;
        const tratamento =
          generoLocatario === 'feminino' ? 'Prezada' : 'Prezado';
        enhancedData.saudacaoLocatario = `${tratamento} <strong>${primeiroNomeCapitalizado}</strong>`;
      }
    }

    // Processar fiadores para o distrato
    if (documentType === 'Distrato de Contrato de Locação') {
      const temFiadores = formData.temFiador === 'sim';
      const fiadores: string[] = [];

      if (temFiadores && formData.nomeFiador) {
        // Dividir os nomes dos fiadores (separados por " e " ou ",")
        const nomesFiadores = formData.nomeFiador
          .split(/ e | E |,/)
          .map((nome) => nome.trim())
          .filter((nome) => nome.length > 0);

        fiadores.push(...nomesFiadores);
      }

      // Adicionar dados dos fiadores ao enhancedData
      enhancedData.temFiadores = temFiadores ? 'sim' : 'nao';
      enhancedData.fiadores = fiadores;

      // Adicionar fiadores como variáveis individuais para o template
      enhancedData.fiador1 = fiadores[0] || '';
      enhancedData.fiador2 = fiadores[1] || '';
      enhancedData.fiador3 = fiadores[2] || '';
      enhancedData.fiador4 = fiadores[3] || '';

      // Adicionar variáveis booleanas para controlar a exibição
      enhancedData.temFiador2 = fiadores.length > 1 ? 'sim' : 'nao';
      enhancedData.temFiador3 = fiadores.length > 2 ? 'sim' : 'nao';
      enhancedData.temFiador4 = fiadores.length > 3 ? 'sim' : 'nao';

      // console.log('=== DEBUG FIADORES DISTRATO ===');
      // console.log('temFiador:', formData.temFiador);
      // console.log('nomeFiador:', formData.nomeFiador);
      // console.log('Array fiadores:', fiadores);
      // console.log('fiador1:', enhancedData.fiador1);
      // console.log('fiador2:', enhancedData.fiador2);
      // console.log('fiador3:', enhancedData.fiador3);
      // console.log('fiador4:', enhancedData.fiador4);
      // console.log('===============================');
    }

    const processedTemplate = replaceTemplateVariables(template, enhancedData);

    // Usar o título que já foi definido (já vem com formatação correta)
    const documentTitle = documentType;

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
  };

  const generateDocument = (
    contract: Contract,
    template: string,
    documentType: string
  ) => {
    setGeneratingDocument(`${contract.id}-${documentType}`);
    const formData = contract.form_data;

    // Documentos que não precisam de assinatura
    const documentosSemAssinatura = [
      'Devolutiva via E-mail - Locador',
      'Devolutiva via E-mail - Locatário',
      'Devolutiva Cobrança de Consumo',
      'Devolutiva Caderninho',
      'Caderninho',
      'WhatsApp - Comercial',
      'Distrato de Contrato de Locação',
      'Notificação de Agendamento',
    ];

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
    } else if (documentType === 'Termo de Recusa de Assinatura - E-mail') {
      // Abrir modal para preencher data da vistoria e selecionar assinante
      setSelectedContract(contract);
      setShowRecusaAssinaturaModal(true);
    } else if (documentType === 'Notificação de Agendamento') {
      // Abrir modal para preencher data e hora da vistoria
      setSelectedContract(contract);
      setShowAgendamentoModal(true);
    } else if (
      documentType === 'Devolutiva Locador WhatsApp' ||
      documentType === 'Devolutiva Locatário WhatsApp' ||
      documentType === 'WhatsApp - Proprietária' ||
      documentType === 'WhatsApp - Locatária'
    ) {
      // Abrir modal para selecionar pessoa específica
      setSelectedContract(contract);
      let whatsAppType: 'locador' | 'locatario' | null = 'locador';
      if (
        documentType === 'Devolutiva Locatário WhatsApp' ||
        documentType === 'WhatsApp - Locatária'
      ) {
        whatsAppType = 'locatario';
      }
      setWhatsAppType(whatsAppType);
      setSelectedPerson('');
      setShowWhatsAppModal(true);
      setGeneratingDocument(null);
    } else if (documentType === 'NPS WhatsApp') {
      // NPS WhatsApp - usar modal específico
      setSelectedNPSContract(contract);
      setNpsMethod('whatsapp');
      setNpsWhatsAppType(null);
      setSelectedNPSPerson('');
      setShowNPSModal(true);
      setGeneratingDocument(null);
    } else if (documentType === 'NPS E-mail') {
      // NPS E-mail - usar modal específico
      setSelectedNPSContract(contract);
      setNpsMethod('email');
      setShowNPSModal(true);
      setGeneratingDocument(null);
    } else if (documentosSemAssinatura.includes(documentType)) {
      // Documentos que não precisam de assinatura - gerar diretamente
      const enhancedData = applyConjunctions(formData);
      const processedTemplate = replaceTemplateVariables(
        template,
        enhancedData
      );

      let documentTitle = `${documentType} - ${contract.title}`;
      if (documentType === 'Devolutiva Comercial') {
        documentTitle = `${documentType} - Rescisão - ${contract.title}`;
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
    } else {
      // Para todos os outros documentos, mostrar modal de seleção de assinante
      setPendingDocumentData({ contract, template, documentType });
      setShowAssinanteModal(true);
      setGeneratingDocument(null);
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
        const value = data[variable];
        if (value) {
          if (typeof value === 'string' && value.trim()) {
            return ifContent;
          } else if (Array.isArray(value) && value.length > 0) {
            return ifContent;
          }
        }
        return elseContent;
      }
    );

    // Processar condicionais Handlebars simples (sem else)
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, content) => {
        const value = data[variable];
        // console.log(`Verificando condicional {{#if ${variable}}}:`, value, typeof value);

        // Verificar se a variável existe e não está vazia
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.trim() !== '') {
            // console.log(`Condicional ${variable} é verdadeira (string não vazia)`);
            return content;
          } else if (Array.isArray(value) && value.length > 0) {
            // console.log(`Condicional ${variable} é verdadeira (array não vazio)`);
            return content;
          }
        }
        // console.log(`Condicional ${variable} é falsa`);
        return '';
      }
    );

    // Debug específico para fiador2
    // console.log('=== DEBUG FIADOR2 ===');
    // console.log('Template contém {{#if fiador2}}?', template.includes('{{#if fiador2}}'));
    // console.log('Template contém {{/if}}?', template.includes('{{/if}}'));
    // console.log('Resultado final contém fiador2?', result.includes('fiador2'));
    // console.log('========================');

    // Processar loops Handlebars {{#each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayName, content) => {
        const array = data[arrayName];
        if (Array.isArray(array) && array.length > 0) {
          return array
            .map((item) => {
              return content.replace(/\{\{this\}\}/g, item);
            })
            .join('');
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

    // Limpeza final de símbolos indesejados (apenas chaves que não fazem parte de placeholders válidos)
    // Remover apenas chaves que não estão dentro de tags HTML válidas
    result = result.replace(/\{\{[^}]*\}\}/g, '');

    return result;
  };

  const handleDeleteContract = async (
    contractId: string,
    contractTitle: string
  ) => {
    if (
      // eslint-disable-next-line no-alert
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
      } catch {
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

    // Corrigir o processamento da data da vistoria para evitar problemas de fuso horário
    let dataVistoriaFormatada = dataVistoria;
    if (dataVistoria) {
      // Se a data está no formato YYYY-MM-DD (do input date), converter corretamente
      if (dataVistoria.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dataVistoria.split('-');
        const dateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        dataVistoriaFormatada = formatDateBrazilian(dateObj);
      } else {
        // Se já está em outro formato, usar convertDateToBrazilian
        dataVistoriaFormatada = convertDateToBrazilian(dataVistoria);
      }
    }
    enhancedData.dataVistoria = dataVistoriaFormatada;
    enhancedData.horaVistoria = horaVistoria;
    enhancedData.tipoVistoria = tipoVistoria;

    // Adicionar variáveis de texto formatadas para o template
    if (tipoVistoria === 'revistoria') {
      enhancedData.tipoVistoriaTexto = 'REVISTORIA';
      enhancedData.tipoVistoriaTextoMaiusculo = 'REVISTORIA';
      enhancedData.tipoVistoriaTextoMinusculo = 'revistoria';
    } else {
      enhancedData.tipoVistoriaTexto = 'VISTORIA FINAL';
      enhancedData.tipoVistoriaTextoMaiusculo = 'VISTORIA FINAL';
      enhancedData.tipoVistoriaTextoMinusculo = 'vistoria final';
    }
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
        // Se não especificado, usar masculino como padrão
        enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
      }
    }

    const tipoVistoriaTexto =
      tipoVistoria === 'revistoria' ? 'Revistoria' : 'Vistoria Final';
    const documentTitle = `Notificação de Agendamento - ${tipoVistoriaTexto} - ${selectedContract.title}`;

    // Adicionar dados específicos da vistoria
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataVistoria = dataVistoria;
    enhancedData.horaVistoria = horaVistoria;
    enhancedData.tipoVistoria = tipoVistoria;

    // Configurar tipo de vistoria
    enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;
    enhancedData.tipoVistoriaTextoMinusculo = tipoVistoriaTexto.toLowerCase();
    enhancedData.tipoVistoriaTextoMaiusculo = tipoVistoriaTexto.toUpperCase();

    // Configurar tratamento do locatário para notificação (usar variável já declarada)

    if (isMultipleLocatarios) {
      enhancedData.notificadoLocatarioTitulo = 'Notificados Locatários';
      enhancedData.tratamentoLocatarioNotificacao = 'dos locatários';
    } else if (formData.primeiroLocatario) {
      if (generoLocatario === 'masculino') {
        enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
        enhancedData.tratamentoLocatarioNotificacao = 'do locatário';
      } else if (generoLocatario === 'feminino') {
        enhancedData.notificadoLocatarioTitulo = 'Notificada Locatária';
        enhancedData.tratamentoLocatarioNotificacao = 'da locatária';
      } else {
        // Se não especificado, usar masculino como padrão
        enhancedData.notificadoLocatarioTitulo = 'Notificado Locatário';
        enhancedData.tratamentoLocatarioNotificacao = 'do locatário';
      }
    }

    const processedTemplate = replaceTemplateVariables(
      NOTIFICACAO_AGENDAMENTO_TEMPLATE,
      enhancedData
    );

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
    setTipoVistoria('final');
  };

  const handleGenerateRecusaAssinatura = () => {
    if (!selectedContract || !dataRealizacaoVistoria || !assinanteSelecionado) {
      toast.error(
        'Por favor, preencha a data da vistoria e selecione o assinante'
      );
      return;
    }

    const formData = selectedContract.form_data;
    const enhancedData = applyConjunctions(formData);

    // Adicionar dados específicos para recusa de assinatura
    enhancedData.dataAtual = formatDateBrazilian(new Date());
    enhancedData.dataRealizacaoVistoria = dataRealizacaoVistoria;
    enhancedData.assinanteSelecionado = assinanteSelecionado;

    // Configurar tipo de vistoria no texto
    const tipoVistoriaTexto =
      tipoVistoriaRecusa === 'revistoria' ? 'revistoria' : 'vistoria';
    enhancedData.tipoVistoriaTexto = tipoVistoriaTexto;

    // Processar o template
    const processedTemplate = replaceTemplateVariables(
      TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE,
      enhancedData
    );

    const documentTitle = `Termo de Recusa de Assinatura - E-mail - ${selectedContract.title}`;

    // Navegar para a página de geração do documento
    navigate('/gerar-documento', {
      state: {
        title: documentTitle,
        template: processedTemplate,
        formData: enhancedData,
        documentType: 'Termo de Recusa de Assinatura - E-mail',
      },
    });

    // Fechar modal e limpar campos
    setShowRecusaAssinaturaModal(false);
    setSelectedContract(null);
    setDataRealizacaoVistoria('');
    setAssinanteSelecionado('');
    setTipoVistoriaRecusa('vistoria');
  };

  const handleCancelRecusaAssinatura = () => {
    setShowRecusaAssinaturaModal(false);
    setSelectedContract(null);
    setDataRealizacaoVistoria('');
    setAssinanteSelecionado('');
    setTipoVistoriaRecusa('vistoria');
  };

  const handleGenerateWhatsApp = () => {
    if (
      !selectedContract ||
      !selectedPerson ||
      !whatsAppType ||
      !assinanteSelecionado
    ) {
      toast.error('Por favor, selecione uma pessoa e um assinante');
      return;
    }

    const formData = selectedContract.form_data;
    const enhancedData = {
      ...applyConjunctions(formData),
      assinanteSelecionado,
    } as Record<string, string>;

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
    setAssinanteSelecionado('');
  };

  const handleCancelWhatsApp = () => {
    setShowWhatsAppModal(false);
    setSelectedContract(null);
    setWhatsAppType(null);
    setSelectedPerson('');
    setAssinanteSelecionado('');
  };

  const handleGenerateWithAssinante = () => {
    if (!pendingDocumentData || !assinanteSelecionado) {
      toast.error('Por favor, selecione um assinante');
      return;
    }

    // Se for distrato, gerar diretamente (fiadores são puxados automaticamente do contrato)
    if (pendingDocumentData.documentType === 'Distrato') {
      generateDocumentWithAssinante(
        pendingDocumentData.contract,
        pendingDocumentData.template,
        pendingDocumentData.documentType,
        assinanteSelecionado
      );
      setShowAssinanteModal(false);
      setPendingDocumentData(null);
      setAssinanteSelecionado('');
      return;
    }

    generateDocumentWithAssinante(
      pendingDocumentData.contract,
      pendingDocumentData.template,
      pendingDocumentData.documentType,
      assinanteSelecionado
    );

    // Fechar modal e limpar campos
    setShowAssinanteModal(false);
    setPendingDocumentData(null);
    setAssinanteSelecionado('');
  };

  const handleCancelAssinante = () => {
    setShowAssinanteModal(false);
    setPendingDocumentData(null);
    setAssinanteSelecionado('');
  };

  // Função para detectar múltiplos locatários
  const isMultipleLocatarios = (nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return (
      nomeLocatario.includes(',') ||
      nomeLocatario.includes(' e ') ||
      nomeLocatario.includes(' E ')
    );
  };

  // Função para detectar múltiplos proprietários
  const isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return (
      nomeProprietario.includes(',') ||
      nomeProprietario.includes(' e ') ||
      nomeProprietario.includes(' E ')
    );
  };

  const handleUpdateContract = async () => {
    if (!editingContract) return;

    setIsUpdating(true);
    try {
      // Adicionar campos automáticos
      const enhancedData = {
        ...editFormData,
        prazoDias: '30', // Sempre 30 dias
        dataComunicacao: editFormData.dataInicioRescisao, // Data de comunicação = data de início
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
    } catch {
      toast.error('Erro ao atualizar contrato');
      // console.error('Erro ao atualizar contrato:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingContract(null);
    setEditFormData({});
  };

  const handleGenerateNPSWhatsApp = () => {
    if (!selectedNPSContract || !npsWhatsAppType || !selectedNPSPerson) {
      toast.error('Por favor, selecione uma pessoa');
      return;
    }

    const formData = selectedNPSContract.form_data;
    const primeiroNome = selectedNPSPerson.split(' ')[0];
    const primeiroNomeCapitalizado =
      primeiroNome.charAt(0).toUpperCase() +
      primeiroNome.slice(1).toLowerCase();

    const mensagem = `Olá ${primeiroNomeCapitalizado}, tudo bem? Posso enviar a você nossa pesquisa de satisfação? Seu feedback nos ajudará a aprimorar nossos processos internos`;

    // Aplicar conjunções verbais antes de processar o template
    const enhancedData = applyConjunctions(formData);

    // Adicionar dados específicos do NPS WhatsApp
    enhancedData.nomePessoaSelecionada = primeiroNomeCapitalizado;
    enhancedData.tipoPessoaNPS =
      npsWhatsAppType === 'locador' ? 'Locador' : 'Locatário';
    enhancedData.mensagemNPSWhatsApp = mensagem;

    const processedTemplate = replaceTemplateVariables(
      NPS_WHATSAPP_TEMPLATE,
      enhancedData
    );
    const documentTitle = `NPS WhatsApp - ${npsWhatsAppType === 'locador' ? 'Locador' : 'Locatário'} - ${selectedNPSContract.title}`;

    // Navegar para a página de geração de documento
    setTimeout(() => {
      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: 'NPS WhatsApp',
        },
      });
    }, 800);

    // Fechar modal e limpar campos
    setShowNPSModal(false);
    setSelectedNPSContract(null);
    setNpsMethod(null);
    setNpsWhatsAppType(null);
    setSelectedNPSPerson('');
  };

  const handleGenerateNPSEmail = () => {
    if (!selectedNPSContract) {
      toast.error('Erro ao gerar e-mail');
      return;
    }

    const formData = selectedNPSContract.form_data;
    const _numeroContrato = formData.numeroContrato || '[NÚMERO]';

    // Extrair nomes dos locadores
    const nomesLocadores =
      formData.nomesResumidosLocadores || formData.nomeProprietario || '';
    const nomesLocadoresArray = nomesLocadores
      .split(/ e | E /)
      .map((nome) => nome.trim())
      .filter((nome) => nome);

    // Extrair nomes dos locatários
    const nomesLocatarios = formData.nomeLocatario || '';
    const nomesLocatariosArray = nomesLocatarios
      .split(/ e | E /)
      .map((nome) => nome.trim())
      .filter((nome) => nome);

    // Verificar se há números cadastrados
    const _hasLocadorNumbers = nomesLocadoresArray.some(
      (nome) =>
        formData[`numeroLocador_${nome.replace(/\s+/g, '_')}`] ||
        formData.celularProprietario ||
        formData.telefoneProprietario ||
        formData.celularLocador ||
        formData.telefoneLocador
    );

    const _hasLocatarioNumbers = nomesLocatariosArray.some(
      (nome) =>
        formData[`numeroLocatario_${nome.replace(/\s+/g, '_')}`] ||
        formData.celularLocatario ||
        formData.telefoneLocatario ||
        formData.celularLocatario ||
        formData.telefoneLocatario
    );

    // Sempre mostrar modal de números com checkboxes para seleção
    setShowNPSNumbersModal(true);
  };

  const generateNPSEmailWithData = () => {
    if (!selectedNPSContract) return;

    const formData = selectedNPSContract.form_data;
    const numeroContrato = formData.numeroContrato || '[NÚMERO]';

    // Usar apenas as partes selecionadas no modal de números
    const nomesLocadoresArray = Object.keys(npsSelectedParties)
      .filter((key) => key.startsWith('locador_') && npsSelectedParties[key])
      .map((key) => key.replace('locador_', ''));

    const nomesLocatariosArray = Object.keys(npsSelectedParties)
      .filter((key) => key.startsWith('locatario_') && npsSelectedParties[key])
      .map((key) => key.replace('locatario_', ''));

    // Extrair números dos locadores selecionados do estado npsNumbers
    const numerosLocadoresArray = nomesLocadoresArray.map(
      (nome) => npsNumbers[`locador_${nome}`] || '[NÚMERO]'
    );

    // Extrair números dos locatários selecionados do estado npsNumbers
    const numerosLocatariosArray = nomesLocatariosArray.map(
      (nome) => npsNumbers[`locatario_${nome}`] || '[NÚMERO]'
    );

    // Aplicar conjunções verbais antes de processar o template
    const enhancedData = applyConjunctions(formData);

    // Funções para detectar gênero e plural
    const isPlural = (text: string) => {
      return text.includes(',') || text.includes(' e ') || text.includes(' E ');
    };

    const isFeminine = (text: string) => {
      const femaleNames = [
        'ana',
        'maria',
        'carla',
        'sandra',
        'patricia',
        'fernanda',
        'juliana',
        'carolina',
        'gabriela',
        'mariana',
        'raquel',
        'thais',
        'adriana',
      ];
      const firstNameLower = text.split(' ')[0].toLowerCase();
      return (
        text.toLowerCase().endsWith('a') || femaleNames.includes(firstNameLower)
      );
    };

    // Calcular termos corretos baseados no gênero
    const getLocadorTerm = (nomes: string[]) => {
      if (nomes.length === 0) return 'LOCADOR(a)';
      const nomeCompleto = nomes.join(', ');
      if (isPlural(nomeCompleto)) {
        return 'LOCADORES';
      }
      return isFeminine(nomeCompleto) ? 'LOCADORA' : 'LOCADOR';
    };

    const getLocatarioTerm = (nomes: string[]) => {
      if (nomes.length === 0) return 'LOCATÁRIO(a)';
      const nomeCompleto = nomes.join(', ');
      if (isPlural(nomeCompleto)) {
        return 'LOCATÁRIOS';
      }
      return isFeminine(nomeCompleto) ? 'LOCATÁRIA' : 'LOCATÁRIO';
    };

    // Criar formato "Nome Número" para cada pessoa
    const formatarPessoasComNumeros = (nomes: string[], numeros: string[]) => {
      return nomes
        .map((nome, index) => {
          const numero = numeros[index] || '[NÚMERO]';
          return `${nome}<br>Número: ${numero}`;
        })
        .join('<br><br>');
    };

    // Adicionar dados específicos do NPS E-mail
    enhancedData.numeroContratoNPS = numeroContrato;
    enhancedData.nomesLocadoresNPS =
      nomesLocadoresArray.length > 0
        ? formatarPessoasComNumeros(nomesLocadoresArray, numerosLocadoresArray)
        : '';
    enhancedData.nomesLocatariosNPS =
      nomesLocatariosArray.length > 0
        ? formatarPessoasComNumeros(
            nomesLocatariosArray,
            numerosLocatariosArray
          )
        : '';
    enhancedData.numerosLocadoresNPS = numerosLocadoresArray.join(', ');
    enhancedData.numerosLocatariosNPS = numerosLocatariosArray.join(', ');
    enhancedData.termoLocadorNPS = getLocadorTerm(nomesLocadoresArray);
    enhancedData.termoLocatarioNPS = getLocatarioTerm(nomesLocatariosArray);

    const processedTemplate = replaceTemplateVariables(
      NPS_EMAIL_TEMPLATE,
      enhancedData
    );
    const documentTitle = `NPS E-mail - Contrato ${numeroContrato} - ${selectedNPSContract.title}`;

    // Navegar para a página de geração de documento
    setTimeout(() => {
      navigate('/gerar-documento', {
        state: {
          title: documentTitle,
          template: processedTemplate,
          formData: enhancedData,
          documentType: 'NPS E-mail',
        },
      });
    }, 800);

    // Fechar modal e limpar campos
    setShowNPSModal(false);
    setSelectedNPSContract(null);
    setNpsMethod(null);
    setNpsWhatsAppType(null);
    setSelectedNPSPerson('');
    setSelectedNPSParties({ locadores: [], locatarios: [] });
    setNpsNumbers({});
  };

  const handleCancelNPS = () => {
    setShowNPSModal(false);
    setSelectedNPSContract(null);
    setNpsMethod(null);
    setNpsWhatsAppType(null);
    setSelectedNPSPerson('');
    setSelectedNPSParties({ locadores: [], locatarios: [] });
    setNpsNumbers({});
    setNpsSelectedParties({});
    setShowNPSNumbersModal(false);
  };

  // Função auxiliar para renderizar ícone com loading
  const _renderIconWithLoading = (
    _icon: React.ReactNode,
    contractId: string,
    documentType: string,
    icon: React.ReactNode
  ) => {
    const isGenerating = generatingDocument === `${contractId}-${documentType}`;
    return isGenerating ? (
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
    ) : (
      icon
    );
  };

  // Estados para modais
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [showRecusaAssinaturaModal, setShowRecusaAssinaturaModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showAssinanteModal, setShowAssinanteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNPSModal, setShowNPSModal] = useState(false);
  const [showNPSNumbersModal, setShowNPSNumbersModal] = useState(false);

  // Estados para agendamento
  const [tipoVistoria, setTipoVistoria] = useState('final');
  const [dataVistoria, setDataVistoria] = useState('');
  const [horaVistoria, setHoraVistoria] = useState('');

  // Estados para recusa de assinatura
  const [dataRealizacaoVistoria, setDataRealizacaoVistoria] = useState('');
  const [assinanteSelecionado, setAssinanteSelecionado] = useState('');
  const [tipoVistoriaRecusa, setTipoVistoriaRecusa] = useState('vistoria');

  // Estados para WhatsApp
  const [whatsAppType, setWhatsAppType] = useState<'locador' | 'locatario' | null>(null);
  const [selectedPerson, setSelectedPerson] = useState('');

  // Estados para NPS
  const [npsMethod, setNpsMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [npsWhatsAppType, setNpsWhatsAppType] = useState<'locador' | 'locatario' | null>(null);
  const [selectedNPSPerson, setSelectedNPSPerson] = useState('');
  const [_selectedNPSParties, setSelectedNPSParties] = useState({ locadores: [], locatarios: [] });
  const [npsNumbers, setNpsNumbers] = useState<Record<string, string>>({});
  const [npsSelectedParties, setNpsSelectedParties] = useState<Record<string, boolean>>({});

  // Estados para edição
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para documentos
  const [generatingDocument, setGeneratingDocument] = useState<string | null>(null);
  const [_deletingContract, setDeletingContract] = useState<string | null>(null);
  const [pendingDocumentData, setPendingDocumentData] = useState<{
    contract: Contract;
    template: string;
    documentType: string;
  } | null>(null);

  // Estados para contratos selecionados
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedNPSContract, setSelectedNPSContract] = useState<Contract | null>(null);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Main Content */}
        <div className="p-6">
          {/* Lista de Contratos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Contratos Cadastrados
                </h2>
                <Link to="/cadastrar-contrato">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato
                  </Button>
                </Link>
              </div>

              {/* Barra de Busca */}
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            {loading && contracts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="p-4 bg-primary/10 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-lg font-medium text-foreground">
                      Carregando contratos...
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aguarde um momento
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : contracts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="p-4 bg-muted rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum contrato encontrado
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Tente um termo de busca diferente ou crie um novo
                      contrato.
                    </p>
                    <Link to="/cadastrar-contrato">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Novo Contrato
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {contracts.map((contract) => (
                  <Card
                    key={contract.id}
                    className="metric-card glass-card border-border hover:shadow-soft transition-all duration-300 overflow-visible"
                  >
                    <CardContent className="p-6">
                      {/* Header do Contrato */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground">
                              Contrato{' '}
                              {contract.form_data.numeroContrato || '[NÚMERO]'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              ID: {contract.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                      </div>

                      {/* Separador */}
                      <div className="border-t border-border mb-4"></div>

                      {/* PARTES ENVOLVIDAS */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          Partes Envolvidas
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-green-500/10">
                              <User className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {isMultipleProprietarios(
                                  contract.form_data.nomeProprietario
                                )
                                  ? 'Proprietários'
                                  : 'Proprietário'}
                              </p>
                              <p className="text-xs font-bold text-foreground truncate">
                                {contract.form_data.nomeProprietario}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-blue-500/10">
                              <User2 className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {isMultipleLocatarios(
                                  contract.form_data.nomeLocatario
                                )
                                  ? 'Locatários'
                                  : 'Locatário'}
                              </p>
                              <p className="text-xs font-bold text-foreground truncate">
                                {contract.form_data.nomeLocatario}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TERMOS DO CONTRATO */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          Termos do Contrato
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded bg-yellow-500/10">
                                <Timer className="h-3 w-3 text-yellow-600" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Prazo
                              </span>
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {contract.form_data.prazoDias} dias
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-green-500/10">
                                  <CalendarDays className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Início
                                </span>
                              </div>
                              <span className="text-xs font-bold text-foreground">
                                {contract.form_data.dataInicioRescisao ||
                                  '01/09/2026'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-red-500/10">
                                  <Clock className="h-3 w-3 text-red-600" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Término
                                </span>
                              </div>
                              <span className="text-xs font-bold text-foreground">
                                {contract.form_data.dataTerminoRescisao ||
                                  '01/10/2026'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LOCALIZAÇÃO */}
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          Localização
                        </h4>
                        <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                          <div className="p-1 rounded bg-purple-500/10">
                            <MapPin className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Endereço
                            </p>
                            <p
                              className="text-xs font-bold text-foreground line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors duration-200"
                              onClick={() =>
                                openGoogleMaps(
                                  contract.form_data.endereco ||
                                    contract.form_data.enderecoImovel ||
                                    '460 - Rua Interna: Rua dos Sablas, Casa 421 - Condomínio Green Valley, Bairro Flores, Manaus - AM'
                                )
                              }
                              title="Clique para abrir no Google Maps"
                            >
                              {contract.form_data.endereco ||
                                contract.form_data.enderecoImovel ||
                                '460 - Rua Interna: Rua dos Sablas, Casa 421 - Condomínio Green Valley, Bairro Flores, Manaus - AM'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* AÇÕES RÁPIDAS */}
                      <div className="border-t border-border pt-4 relative overflow-visible">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingContract(contract);
                                setEditFormData(contract.form_data);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          <QuickActionsDropdown
                            contractId={contract.id}
                            contractNumber={
                              contract.form_data.numeroContrato || '[NÚMERO]'
                            }
                            onGenerateDocument={(
                              contractId,
                              template,
                              title
                            ) => {
                              const contractData = contracts.find(
                                (c) => c.id === contractId
                              );
                              if (contractData) {
                                generateDocument(contractData, template, title);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Botão Ver Mais */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMoreContracts}
                disabled={loading}
                variant="outline"
                className="px-8 py-3 text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Carregando...
                  </>
                ) : (
                  `Ver mais (${Math.max(0, totalCount - contracts.length)} restantes)`
                )}
              </Button>
            </div>
          )}
        </div>
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
              <Label htmlFor="tipoVistoria" className="text-right">
                Tipo de Vistoria
              </Label>
              <Select value={tipoVistoria} onValueChange={setTipoVistoria}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de vistoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final">Vistoria Final</SelectItem>
                  <SelectItem value="revistoria">Revistoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      {/* Modal para Termo de Recusa de Assinatura - E-mail */}
      <Dialog
        open={showRecusaAssinaturaModal}
        onOpenChange={setShowRecusaAssinaturaModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Termo de Recusa de Assinatura - E-mail</DialogTitle>
            <DialogDescription>
              Preencha a data da vistoria/revistoria e selecione quem vai
              assinar o documento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipoVistoriaRecusa" className="text-right">
                Tipo
              </Label>
              <Select
                value={tipoVistoriaRecusa}
                onValueChange={setTipoVistoriaRecusa}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vistoria">Vistoria</SelectItem>
                  <SelectItem value="revistoria">Revistoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataRealizacaoVistoria" className="text-right">
                Data da{' '}
                {tipoVistoriaRecusa === 'revistoria'
                  ? 'Revistoria'
                  : 'Vistoria'}
              </Label>
              <Input
                id="dataRealizacaoVistoria"
                type="text"
                value={dataRealizacaoVistoria}
                onChange={(e) => setDataRealizacaoVistoria(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 19 de setembro de 2025"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assinanteSelecionado" className="text-right">
                Assinante
              </Label>
              <Select
                value={assinanteSelecionado}
                onValueChange={setAssinanteSelecionado}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione quem irá assinar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VICTOR CAIN JORGE">
                    Victor Cain Jorge
                  </SelectItem>
                  <SelectItem value="FABIANA SALOTTI MARTINS">
                    Fabiana Salotti Martins
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRecusaAssinatura}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateRecusaAssinatura}>
              Gerar Documento
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
              {whatsAppType === 'locador' ? 'locador' : 'locatário'} você deseja
              enviar a mensagem do WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedPerson" className="text-right">
                {whatsAppType === 'locador' ? 'Locador' : 'Locatário'}
              </Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={`Selecione um ${whatsAppType === 'locador' ? 'locador' : 'locatário'}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {whatsAppType === 'locador'
                    ? (() => {
                        const nomesLocadores =
                          selectedContract?.form_data.nomesResumidosLocadores ||
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assinanteSelecionado" className="text-right">
                Assinante
              </Label>
              <Select
                value={assinanteSelecionado}
                onValueChange={setAssinanteSelecionado}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione quem irá assinar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VICTOR CAIN JORGE">
                    Victor Cain Jorge
                  </SelectItem>
                  <SelectItem value="FABIANA SALOTTI MARTINS">
                    Fabiana Salotti Martins
                  </SelectItem>
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
              disabled={!selectedPerson || !assinanteSelecionado}
            >
              Gerar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Seleção de Assinante */}
      <Dialog open={showAssinanteModal} onOpenChange={setShowAssinanteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecionar Assinante do Documento</DialogTitle>
            <DialogDescription>
              Selecione quem irá assinar o documento:{' '}
              {pendingDocumentData?.documentType}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assinanteSelecionado" className="text-right">
                Assinante
              </Label>
              <Select
                value={assinanteSelecionado}
                onValueChange={setAssinanteSelecionado}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione quem irá assinar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VICTOR CAIN JORGE">
                    Victor Cain Jorge
                  </SelectItem>
                  <SelectItem value="FABIANA SALOTTI MARTINS">
                    Fabiana Salotti Martins
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAssinante}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateWithAssinante}
              disabled={!assinanteSelecionado}
            >
              Gerar Documento
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
                  <Label htmlFor="edit-nomeLocatario">Nome do Locatário</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-celularLocatario">
                    Celular do Locatário
                  </Label>
                  <Input
                    id="edit-celularLocatario"
                    value={editFormData.celularLocatario || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        celularLocatario: e.target.value,
                      }))
                    }
                    placeholder="Ex: (19) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emailLocatario">
                    E-mail do Locatário
                  </Label>
                  <Input
                    id="edit-emailLocatario"
                    value={editFormData.emailLocatario || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        emailLocatario: e.target.value,
                      }))
                    }
                    placeholder="Ex: locatario@email.com"
                  />
                </div>
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

            {/* Dados de Rescisão */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados de Rescisão</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dataInicioRescisao">
                    Data de Início da Rescisão
                  </Label>
                  <Input
                    id="edit-dataInicioRescisao"
                    value={editFormData.dataInicioRescisao || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        dataInicioRescisao: e.target.value,
                      }))
                    }
                    placeholder="DD/MM/AAAA - Ex: 23/06/2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataTerminoRescisao">
                    Data de Término da Rescisão
                  </Label>
                  <Input
                    id="edit-dataTerminoRescisao"
                    value={editFormData.dataTerminoRescisao || ''}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        dataTerminoRescisao: e.target.value,
                      }))
                    }
                    placeholder="DD/MM/AAAA - Ex: 22/07/2025"
                  />
                </div>
              </div>
            </div>

            {/* Contas de Consumo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contas de Consumo</h3>
              <p className="text-sm text-gray-600">
                Configure quais contas de consumo devem ser solicitadas na
                cobrança
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cpfl">CPFL (Energia Elétrica)</Label>
                  <Select
                    value={editFormData.cpfl || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        cpfl: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIM">SIM</SelectItem>
                      <SelectItem value="NÃO">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tipoAgua">Tipo de Água</Label>
                  <Select
                    value={editFormData.tipoAgua || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        tipoAgua: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAEV">DAEV</SelectItem>
                      <SelectItem value="SANASA">SANASA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-statusAgua">Status da Água</Label>
                  <Select
                    value={editFormData.statusAgua || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        statusAgua: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIM">SIM</SelectItem>
                      <SelectItem value="NÃO">NÃO</SelectItem>
                      <SelectItem value="No condomínio">
                        No condomínio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-solicitarGas">Solicitar Gás</Label>
                  <Select
                    value={editFormData.solicitarGas || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        solicitarGas: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">SIM</SelectItem>
                      <SelectItem value="nao">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-solicitarCondominio">
                    Solicitar Condomínio
                  </Label>
                  <Select
                    value={editFormData.solicitarCondominio || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        solicitarCondominio: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">SIM</SelectItem>
                      <SelectItem value="nao">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-solicitarCND">Solicitar CND</Label>
                  <Select
                    value={editFormData.solicitarCND || ''}
                    onValueChange={(value) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        solicitarCND: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">SIM</SelectItem>
                      <SelectItem value="nao">NÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingContract) {
                  handleDeleteContract(
                    editingContract.id,
                    editingContract.title
                  );
                  setShowEditModal(false);
                  setEditingContract(null);
                }
              }}
              disabled={isUpdating}
            >
              Excluir Contrato
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateContract} disabled={isUpdating}>
                {isUpdating ? 'Atualizando...' : 'Atualizar Contrato'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para NPS */}
      <Dialog open={showNPSModal} onOpenChange={setShowNPSModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pesquisa de Satisfação (NPS)</DialogTitle>
            <DialogDescription>
              Selecione o método para enviar a pesquisa de satisfação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!npsMethod ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Escolha o método:</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setNpsMethod('email')}
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">E-mail</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNpsMethod('whatsapp')}
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <Phone className="h-6 w-6" />
                    <span className="text-sm">WhatsApp</span>
                  </Button>
                </div>
              </div>
            ) : npsMethod === 'whatsapp' && !npsWhatsAppType ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Selecione para quem enviar:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setNpsWhatsAppType('locador')}
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <User className="h-6 w-6" />
                    <span className="text-sm">Locador</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNpsWhatsAppType('locatario')}
                    className="flex flex-col items-center gap-2 p-4 h-auto"
                  >
                    <User2 className="h-6 w-6" />
                    <span className="text-sm">Locatário</span>
                  </Button>
                </div>
              </div>
            ) : npsMethod === 'whatsapp' &&
              npsWhatsAppType &&
              !selectedNPSPerson ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selectedNPSPerson" className="text-right">
                    {npsWhatsAppType === 'locador' ? 'Locador' : 'Locatário'}
                  </Label>
                  <Select
                    value={selectedNPSPerson}
                    onValueChange={setSelectedNPSPerson}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue
                        placeholder={`Selecione um ${npsWhatsAppType === 'locador' ? 'locador' : 'locatário'}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {npsWhatsAppType === 'locador'
                        ? (() => {
                            const nomesLocadores =
                              selectedNPSContract?.form_data
                                .nomesResumidosLocadores ||
                              selectedNPSContract?.form_data.nomeProprietario;
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
                              selectedNPSContract?.form_data.nomeLocatario ||
                              selectedNPSContract?.form_data.primeiroLocatario;
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
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNPS}>
              Cancelar
            </Button>
            {npsMethod === 'email' ? (
              <Button onClick={handleGenerateNPSEmail}>Gerar E-mail</Button>
            ) : npsMethod === 'whatsapp' && selectedNPSPerson ? (
              <Button onClick={handleGenerateNPSWhatsApp}>
                Gerar WhatsApp
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Preenchimento de Números NPS */}
      <Dialog open={showNPSNumbersModal} onOpenChange={setShowNPSNumbersModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Preencher Números para NPS</DialogTitle>
            <DialogDescription>
              Preencha os números de telefone das partes para incluir no e-mail
              NPS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedNPSContract &&
              (() => {
                const formData = selectedNPSContract.form_data;
                const nomesLocadores =
                  formData.nomesResumidosLocadores ||
                  formData.nomeProprietario ||
                  '';
                const nomesLocadoresArray = nomesLocadores
                  .split(/ e | E |,/)
                  .map((nome) => nome.trim())
                  .filter((nome) => nome);
                const nomesLocatarios = formData.nomeLocatario || '';
                const nomesLocatariosArray = nomesLocatarios
                  .split(/ e | E |,/)
                  .map((nome) => nome.trim())
                  .filter((nome) => nome);

                // Inicializar números e seleções se não estiverem no estado
                if (Object.keys(npsNumbers).length === 0) {
                  const initialNumbers: Record<string, string> = {};
                  const initialSelections: Record<string, boolean> = {};

                  // Preencher números dos locadores
                  nomesLocadoresArray.forEach((nome) => {
                    const key = `locador_${nome}`;
                    initialNumbers[key] =
                      formData[`numeroLocador_${nome.replace(/\s+/g, '_')}`] ||
                      formData.celularProprietario ||
                      formData.telefoneProprietario ||
                      formData.celularLocador ||
                      formData.telefoneLocador ||
                      '';
                    // Marcar como selecionado por padrão
                    initialSelections[key] = true;
                  });

                  // Preencher números dos locatários
                  nomesLocatariosArray.forEach((nome) => {
                    const key = `locatario_${nome}`;
                    initialNumbers[key] =
                      formData[
                        `numeroLocatario_${nome.replace(/\s+/g, '_')}`
                      ] ||
                      formData.celularLocatario ||
                      formData.telefoneLocatario ||
                      '';
                    // Marcar como selecionado por padrão
                    initialSelections[key] = true;
                  });

                  setNpsNumbers(initialNumbers);
                  setNpsSelectedParties(initialSelections);
                }

                return (
                  <>
                    {/* Locadores */}
                    {nomesLocadoresArray.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-700">
                          Locadores
                        </h4>
                        {nomesLocadoresArray.map((nome, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`nps-locador-${index}`}
                                checked={
                                  npsSelectedParties[`locador_${nome}`] || false
                                }
                                onChange={(e) =>
                                  setNpsSelectedParties((prev) => ({
                                    ...prev,
                                    [`locador_${nome}`]: e.target.checked,
                                  }))
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor={`nps-locador-${index}`}
                                className="text-sm"
                              >
                                {nome}
                              </Label>
                            </div>
                            <Input
                              placeholder="(19) 99999-9999"
                              value={npsNumbers[`locador_${nome}`] || ''}
                              onChange={(e) =>
                                setNpsNumbers((prev) => ({
                                  ...prev,
                                  [`locador_${nome}`]: e.target.value,
                                }))
                              }
                              disabled={!npsSelectedParties[`locador_${nome}`]}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Locatários */}
                    {nomesLocatariosArray.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-gray-700">
                          Locatários
                        </h4>
                        {nomesLocatariosArray.map((nome, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`nps-locatario-${index}`}
                                checked={
                                  npsSelectedParties[`locatario_${nome}`] ||
                                  false
                                }
                                onChange={(e) =>
                                  setNpsSelectedParties((prev) => ({
                                    ...prev,
                                    [`locatario_${nome}`]: e.target.checked,
                                  }))
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor={`nps-locatario-${index}`}
                                className="text-sm"
                              >
                                {nome}
                              </Label>
                            </div>
                            <Input
                              placeholder="(19) 99999-9999"
                              value={npsNumbers[`locatario_${nome}`] || ''}
                              onChange={(e) =>
                                setNpsNumbers((prev) => ({
                                  ...prev,
                                  [`locatario_${nome}`]: e.target.value,
                                }))
                              }
                              disabled={
                                !npsSelectedParties[`locatario_${nome}`]
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNPSNumbersModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Salvar números no contrato e gerar e-mail
                if (selectedNPSContract) {
                  const formData = selectedNPSContract.form_data;
                  const nomesLocadores =
                    formData.nomesResumidosLocadores ||
                    formData.nomeProprietario ||
                    '';
                  const nomesLocadoresArray = nomesLocadores
                    .split(/ e | E /)
                    .map((nome) => nome.trim())
                    .filter((nome) => nome);
                  const nomesLocatarios = formData.nomeLocatario || '';
                  const nomesLocatariosArray = nomesLocatarios
                    .split(/ e | E /)
                    .map((nome) => nome.trim())
                    .filter((nome) => nome);

                  const updatedFormData = {
                    ...selectedNPSContract.form_data,
                  };
                  Object.entries(npsNumbers).forEach(([key, value]) => {
                    if (value && npsSelectedParties[key]) {
                      if (key.startsWith('locador_')) {
                        const nome = key.replace('locador_', '');
                        updatedFormData[
                          `numeroLocador_${nome.replace(/\s+/g, '_')}`
                        ] = value;
                        // Também atualizar campos gerais se for o primeiro locador
                        if (nome === nomesLocadoresArray[0]) {
                          updatedFormData.celularProprietario = value;
                          updatedFormData.celularLocador = value;
                        }
                      } else if (key.startsWith('locatario_')) {
                        const nome = key.replace('locatario_', '');
                        updatedFormData[
                          `numeroLocatario_${nome.replace(/\s+/g, '_')}`
                        ] = value;
                        // Também atualizar campos gerais se for o primeiro locatário
                        if (nome === nomesLocatariosArray[0]) {
                          updatedFormData.celularLocatario = value;
                        }
                      }
                    }
                  });

                  // Atualizar o contrato no banco
                  const updateContract = async () => {
                    try {
                      await supabase
                        .from('saved_terms')
                        .update({ form_data: updatedFormData })
                        .eq('id', selectedNPSContract.id);

                      // Atualizar o contrato local
                      setContracts((prev) =>
                        prev.map((c) =>
                          c.id === selectedNPSContract.id
                            ? { ...c, form_data: updatedFormData }
                            : c
                        )
                      );

                      // Atualizar o contrato selecionado
                      setSelectedNPSContract((prev) =>
                        prev ? { ...prev, form_data: updatedFormData } : null
                      );

                      // Definir as partes selecionadas no estado principal
                      const selectedLocadores = Object.keys(npsSelectedParties)
                        .filter(
                          (key) =>
                            key.startsWith('locador_') &&
                            npsSelectedParties[key]
                        )
                        .map((key) => key.replace('locador_', ''));

                      const selectedLocatarios = Object.keys(npsSelectedParties)
                        .filter(
                          (key) =>
                            key.startsWith('locatario_') &&
                            npsSelectedParties[key]
                        )
                        .map((key) => key.replace('locatario_', ''));

                      setSelectedNPSParties({
                        locadores: selectedLocadores,
                        locatarios: selectedLocatarios,
                      });

                      // Fechar modal e gerar e-mail
                      setShowNPSNumbersModal(false);
                      generateNPSEmailWithData();
                    } catch {
                      toast.error('Erro ao salvar números');
                    }
                  };

                  updateContract();
                }
              }}
            >
              Salvar e Gerar E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default Contratos;
