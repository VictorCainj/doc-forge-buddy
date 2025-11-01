import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentFormWizard from '../components/DocumentFormWizard';
import {
  Search,
  ArrowLeft,
  FileText,
  User,
  User2,
  MapPin,
  Key,
} from '@/utils/iconMapper';
import { FormStep } from '../hooks/use-form-wizard';
import { Button } from '@/components/ui/button';
import { log } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { useTermoLocatario } from '@/features/documents/hooks';
import { ContactModal } from '@/features/documents/components';
import { splitNames } from '@/utils/nameHelpers';
import { useContractBillsSync } from '@/hooks/useContractBillsSync';
import { supabase } from '@/integrations/supabase/client';
import { ContractBillsStatus } from '@/components/ContractBillsStatus';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  incluirQuantidadeChaves?: string;
  quantidadeChaves?: string;
  [key: string]: string | undefined;
}

const TermoLocatario: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = React.useState<
    Record<string, string>
  >({});

  // Hook customizado para lógica do termo
  const {
    showContactModal,
    setShowContactModal,
    contactData,
    setContactData,
    pendingFormData,
    setPendingFormData,
    validateContactFields,
    handleSaveContactData,
  } = useTermoLocatario(contractData);

  // Sincronizar contas de consumo do banco de dados
  const { billStatus, isLoading: loadingBills } = useContractBillsSync({
    contractId: contractData.numeroContrato,
  });

  // Sincronizar billStatus com autoFillData
  React.useEffect(() => {
    if (!loadingBills) {
      setAutoFillData((prev) => ({
        ...prev,
        tipoTermo: 'locatario', // Definir tipo de termo para exibir campos corretos
        cpfl: billStatus.energia ? 'SIM' : 'NÃO',
        statusAgua: billStatus.agua ? 'SIM' : 'NÃO',
      }));
    }
  }, [billStatus, loadingBills]);

  // Callback para sincronizar mudanças de volta ao banco
  const handleFormDataChange = React.useCallback(
    async (data: Record<string, string>) => {
      setAutoFillData(data);

      // Buscar o ID real do contrato primeiro
      try {
        const { data: contractDataFromDB, error: contractError } =
          await supabase
            .from('saved_terms')
            .select('id')
            .eq('document_type', 'contrato')
            .ilike('form_data->>numeroContrato', contractData.numeroContrato)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro quando não há resultados

        if (contractError) {
          log.error(
            'Erro ao buscar contrato para sincronização:',
            contractError
          );
          return;
        }

        if (!contractDataFromDB?.id) {
          log.warn(
            'Contrato não encontrado para sincronização:',
            contractData.numeroContrato
          );
          return;
        }

        const realContractId = contractDataFromDB.id;

        // Sincronizar CPFL (Energia)
        if (data.cpfl && data.cpfl !== autoFillData.cpfl) {
          const delivered = data.cpfl === 'SIM';
          try {
            await supabase
              .from('contract_bills')
              .update({
                delivered,
                delivered_at: delivered ? new Date().toISOString() : null,
              })
              .eq('contract_id', realContractId)
              .eq('bill_type', 'energia');
          } catch (error) {
            log.error('Erro ao sincronizar CPFL:', error);
          }
        }

        // Sincronizar Água
        if (data.statusAgua && data.statusAgua !== autoFillData.statusAgua) {
          const delivered = data.statusAgua === 'SIM';
          try {
            await supabase
              .from('contract_bills')
              .update({
                delivered,
                delivered_at: delivered ? new Date().toISOString() : null,
              })
              .eq('contract_id', realContractId)
              .eq('bill_type', 'agua');
          } catch (error) {
            log.error('Erro ao sincronizar Água:', error);
          }
        }
      } catch (error) {
        log.error('Erro geral na sincronização:', error);
      }
    },
    [autoFillData, contractData.numeroContrato]
  );

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Funções movidas para: @/features/documents/hooks/useTermoLocatario

  const steps: FormStep[] = [
    {
      id: 'vistoria',
      title: 'Vistoria e Entrega',
      description: 'Detalhes da vistoria e entrega das chaves',
      icon: Search,
      fields: [
        {
          name: 'nomeQuemRetira',
          label: 'Nome de Quem Retira a Chave',
          type: 'text',
          required: true,
          placeholder: 'Digite o nome completo',
        },
        {
          name: 'incluirNomeCompleto',
          label: 'Quem está retirando as chaves',
          type: 'select',
          required: false,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'todos', label: 'Todos os locatários' },
            ...(contractData.nomeLocatario
              ? splitNames(contractData.nomeLocatario)
                  .filter((nome) => nome && nome.length > 2)
                  .map((nome) => ({
                    value: nome,
                    label: nome,
                  }))
              : []),
          ],
        },
        {
          name: 'usarQuantidadeChavesContrato',
          label: 'Selecionar chaves entregues no início da locação',
          type: 'select',
          required: false,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'nao', label: 'Não - Digitar manualmente' },
            {
              value: 'sim',
              label:
                contractData.quantidadeChaves &&
                contractData.quantidadeChaves !== ''
                  ? `Sim - Todas as chaves: ${contractData.quantidadeChaves}`
                  : 'Sim - Usar quantidade do contrato',
            },
          ],
        },
        {
          name: 'tipoQuantidadeChaves',
          label:
            'Tipo e Quantidade de Chaves (se não selecionou usar do contrato)',
          type: 'textarea',
          required: false,
          placeholder: 'Ex: 04 chaves simples, 02 chaves tetra',
          conditional: {
            field: 'usarQuantidadeChavesContrato',
            value: 'nao',
          },
        },
        {
          name: 'tipoVistoria',
          label: 'Tipo de Vistoria',
          type: 'select',
          required: true,
          placeholder: 'Selecione o tipo de vistoria',
          options: [
            { value: 'vistoria', label: 'Vistoria' },
            { value: 'revistoria', label: 'Revistoria' },
            { value: 'nao_realizada', label: 'Vistoria não Realizada' },
          ],
        },
        {
          name: 'dataVistoria',
          label: 'Data da Vistoria',
          type: 'text',
          required: true,
          placeholder: 'Ex: 19 de setembro de 2025',
          conditional: {
            field: 'tipoVistoria',
            value: 'vistoria',
          },
        },
        {
          name: 'dataRevistoria',
          label: 'Data da Revistoria',
          type: 'text',
          required: true,
          placeholder: 'Ex: 19 de setembro de 2025',
          conditional: {
            field: 'tipoVistoria',
            value: 'revistoria',
          },
        },
        {
          name: 'motivoNaoRealizacao',
          label: 'Motivo da Não Realização da Vistoria',
          type: 'textarea',
          required: false,
          placeholder:
            'Descreva o motivo pelo qual a vistoria não foi realizada',
          conditional: {
            field: 'tipoVistoria',
            value: 'nao_realizada',
          },
        },
        {
          name: 'cpfl',
          label: 'CPFL (Energia Elétrica)',
          type: 'select',
          required: true,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'SIM', label: 'SIM - Locatário apresentou comprovante' },
            {
              value: 'NÃO',
              label: 'NÃO - Locatário não apresentou comprovante',
            },
          ],
        },
        {
          name: 'tipoAgua',
          label: 'Tipo de Água',
          type: 'select',
          required: true,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'DAEV', label: 'DAEV' },
            { value: 'SANASA', label: 'SANASA' },
            { value: 'SANEBAVI', label: 'SANEBAVI' },
          ],
        },
        {
          name: 'statusAgua',
          label: 'Status da Água',
          type: 'select',
          required: true,
          placeholder: 'Selecione uma opção',
          options: [
            { value: 'SIM', label: 'SIM - Locatário apresentou comprovante' },
            {
              value: 'NÃO',
              label: 'NÃO - Locatário não apresentou comprovante',
            },
            { value: 'No condomínio', label: 'No condomínio - Água inclusa' },
          ],
        },
        {
          name: 'statusVistoria',
          label: 'Status da Vistoria',
          type: 'select',
          required: true,
          placeholder: 'Selecione uma opção',
          options: [
            {
              value: 'aprovada',
              label:
                'Aprovada - Imóvel entregue de acordo com a vistoria inicial',
            },
            {
              value: 'reprovada',
              label:
                'Reprovada - Imóvel não foi entregue de acordo com a vistoria inicial',
            },
          ],
          conditional: {
            field: 'tipoVistoria',
            value: 'vistoria',
          },
        },
        {
          name: 'statusRevistoria',
          label: 'Status da Revistoria',
          type: 'select',
          required: true,
          placeholder: 'Selecione uma opção',
          options: [
            {
              value: 'aprovada',
              label: 'Aprovada - Imóvel entregue de acordo com a revistoria',
            },
            {
              value: 'reprovada',
              label:
                'Reprovada - Imóvel não foi entregue de acordo com a revistoria',
            },
          ],
          conditional: {
            field: 'tipoVistoria',
            value: 'revistoria',
          },
        },
        {
          name: 'tipoContrato',
          label: 'Tipo de Contrato',
          type: 'select',
          required: true,
          placeholder: 'Selecione o tipo de contrato',
          options: [
            { value: 'residencial', label: 'Residencial' },
            { value: 'comercial', label: 'Comercial' },
          ],
        },
        {
          name: 'assinanteSelecionado',
          label: 'Assinante do Termo',
          type: 'select',
          required: true,
          placeholder: 'Selecione quem irá assinar o termo',
          options: [
            { value: 'VICTOR CAIN JORGE', label: 'Victor Cain Jorge' },
            {
              value: 'FABIANA SALOTTI MARTINS',
              label: 'Fabiana Salotti Martins',
            },
          ],
        },
        {
          name: 'observacao',
          label: 'Observação (Opcional)',
          type: 'textarea',
          required: false,
          placeholder: 'Digite observações adicionais se necessário',
        },
      ],
    },
  ];

  const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const months = [
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
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const getTemplate = (fontSize: number) => {
    const titleSize = Math.max(fontSize + 2, 12);
    const signatureSize = Math.max(fontSize - 2, 10);

    return `
<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
  <div style="flex: 0 0 auto;">
    <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
  </div>
  <div style="flex: 1; text-align: right; font-size: ${fontSize}px; margin-left: 20px;">
    Valinhos, ${getCurrentDate()}.
  </div>
</div>

<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>


<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>DADOS DOS LOCATÁRIOS:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} &nbsp;&nbsp;&nbsp;&nbsp; <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS:</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{{tipoAgua}}:</strong> {{statusAgua}}<br>
<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade {{locatarioResponsabilidade}}.
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

{{#if dataVistoria}}
<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{tipoVistoriaTexto}} realizada em</strong> {{dataVistoria}}.
</div>
{{/if}}

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{statusVistoriaCheckboxes}}
</div>

<div style="margin: 20px 0; font-size: ${fontSize}px;">
{{observacao}}
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
      {{#if documentoQuemRetira}}
      <br><span style="font-size: ${signatureSize - 1}px;">{{documentoQuemRetira}}</span>
      {{/if}}
    </div>

    <div>
      __________________________________________<br>
      <span style="font-size: ${signatureSize}px; text-transform: uppercase;">{{assinanteSelecionado}}</span>
    </div>
  </div>
</div>
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    // Validar campos de contato antes de gerar o documento
    const contactValidation = validateContactFields(data);

    if (!contactValidation.isValid) {
      // Mostrar modal para preenchimento dos campos de contato
      setPendingFormData(data);
      setShowContactModal(true);
      throw new Error('VALIDATION_REQUIRED'); // Interromper o fluxo
    }

    // Detectar se há múltiplos locatários baseado na quantidade adicionada
    const isMultipleLocatarios =
      contractData.primeiroLocatario &&
      (contractData.segundoLocatario ||
        contractData.terceiroLocatario ||
        contractData.quartoLocatario);

    // Detectar se há múltiplos proprietários baseado na quantidade adicionada
    const nomeProprietario =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios =
      nomeProprietario && nomeProprietario.includes(' e ');

    // Definir termos baseados na quantidade e gênero
    let locadorTerm;
    if (isMultipleProprietarios) {
      locadorTerm = 'LOCADORES';
    } else {
      // Usar o gênero do locador cadastrado no contrato
      const generoProprietario = contractData.generoProprietario;
      if (generoProprietario === 'feminino') {
        locadorTerm = 'LOCADORA';
      } else if (generoProprietario === 'masculino') {
        locadorTerm = 'LOCADOR';
      } else {
        locadorTerm = 'LOCADOR'; // fallback para neutro ou indefinido
      }
    }
    // Definir título baseado na quantidade e gênero
    let dadosLocatarioTitulo;
    if (isMultipleLocatarios) {
      dadosLocatarioTitulo = 'DADOS DOS LOCATÁRIOS';
    } else {
      // Usar o gênero do locatário cadastrado no contrato
      const generoLocatario = contractData.generoLocatario;
      if (generoLocatario === 'feminino') {
        dadosLocatarioTitulo = 'DADOS DA LOCATÁRIA';
      } else if (generoLocatario === 'masculino') {
        dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO';
      } else {
        dadosLocatarioTitulo = 'DADOS DO LOCATÁRIO'; // fallback para neutro ou indefinido
      }
    }
    const locatarioResponsabilidade = isMultipleLocatarios
      ? 'dos locatários'
      : 'do locatário';

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;

    if (data.incluirNomeCompleto === 'todos') {
      nomeQuemRetira = contractData.nomeLocatario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== '') {
      // Se selecionou um locatário específico
      nomeQuemRetira = data.incluirNomeCompleto;
    }

    // Processar quantidade de chaves baseado na opção selecionada
    let tipoQuantidadeChaves = data.tipoQuantidadeChaves;
    if (data.usarQuantidadeChavesContrato === 'sim') {
      // Se selecionou usar do contrato, usar sempre a quantidade do contrato
      tipoQuantidadeChaves =
        contractData.quantidadeChaves || data.tipoQuantidadeChaves;
      // console.log(
      //   'Usando quantidade de chaves do contrato:',
      //   contractData.quantidadeChaves
      // );
    } else {
      // Se não selecionou, usar o que foi digitado manualmente
      tipoQuantidadeChaves = data.tipoQuantidadeChaves;
      // console.log(
      //   'Usando quantidade de chaves digitada manualmente:',
      //   data.tipoQuantidadeChaves
      // );
    }

    // Processar tipo de vistoria
    const tipoVistoria = data.tipoVistoria || 'vistoria';
    const tipoVistoriaTexto =
      tipoVistoria === 'revistoria'
        ? 'Revistoria'
        : tipoVistoria === 'nao_realizada'
          ? 'Vistoria não realizada'
          : 'Vistoria';

    // Processar status da vistoria baseado no tipo selecionado
    let statusVistoria;
    if (tipoVistoria === 'nao_realizada') {
      statusVistoria = 'nao_realizada';
    } else {
      statusVistoria =
        tipoVistoria === 'revistoria'
          ? data.statusRevistoria || 'aprovada'
          : data.statusVistoria || 'aprovada';
    }

    let statusVistoriaCheckboxes;
    if (tipoVistoria === 'nao_realizada') {
      statusVistoriaCheckboxes = '( ✓ ) Vistoria não realizada';
      if (data.motivoNaoRealizacao && data.motivoNaoRealizacao.trim() !== '') {
        statusVistoriaCheckboxes += `<br><strong>Motivo:</strong> ${data.motivoNaoRealizacao}`;
      }
    } else {
      statusVistoriaCheckboxes =
        statusVistoria === 'aprovada'
          ? '( ✓ ) Imóvel entregue de acordo com a vistoria inicial<br>( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.'
          : '( &nbsp; ) Imóvel entregue de acordo com a vistoria inicial<br>( ✓ ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade dos locatários. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.';
    }

    // Processar data baseada no tipo selecionado
    const dataVistoria =
      tipoVistoria === 'revistoria'
        ? data.dataRevistoria
        : tipoVistoria === 'nao_realizada'
          ? ''
          : data.dataVistoria;

    // Processar observação (só mostra se preenchida)
    const observacao =
      data.observacao && data.observacao.trim() !== ''
        ? `OBS: ${data.observacao}`
        : '';

    // Processar fiadores - puxar automaticamente do contrato
    // Compatibilidade: verificar tanto tipoGarantia quanto temFiador
    const temFiadores =
      contractData.tipoGarantia === 'Fiador' ||
      contractData.temFiador === 'sim';
    const fiadores: string[] = [];

    if (temFiadores && contractData.nomeFiador) {
      // Dividir os nomes dos fiadores (separados por vírgulas e " e ")
      const nomesFiadores = splitNames(contractData.nomeFiador);
      fiadores.push(...nomesFiadores);
    }

    // Aplicar formatação de nomes - sem negrito nos nomes
    const nomeProprietarioFormatado =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario; // Sem negrito

    const nomeLocatarioFormatado = contractData.nomeLocatario || '';

    // Texto de entrega de chaves para termo do locatário
    const tipoContrato = data.tipoContrato || 'residencial';

    // Gerar citação correta dos locatários baseada no gênero
    let citacaoLocatarios;
    const generoLocatario = contractData.generoLocatario;

    if (isMultipleLocatarios) {
      // Para múltiplos locatários, usar o gênero específico
      if (generoLocatario === 'femininos') {
        citacaoLocatarios = 'Notificadas Locatárias';
      } else if (generoLocatario === 'masculinos') {
        citacaoLocatarios = 'Notificados Locatários';
      } else {
        // Se não especificado, usar masculino como padrão
        citacaoLocatarios = 'Notificados Locatários';
      }
    } else {
      // Para locatário único, usar o gênero específico
      if (generoLocatario === 'feminino') {
        citacaoLocatarios = 'Notificada Locatária';
      } else if (generoLocatario === 'masculino') {
        citacaoLocatarios = 'Notificado Locatário';
      } else {
        // Se não especificado, usar masculino como padrão
        citacaoLocatarios = 'Notificado Locatário';
      }
    }

    // Usar a qualificação completa que já foi preenchida no cadastro do contrato
    const qualificacaoCompleta =
      contractData.qualificacaoCompletaLocatarios || nomeQuemRetira;
    const textoEntregaChaves = `Pelo presente, recebemos as chaves do imóvel sito à ${contractData.enderecoImovel}, ora locado ${qualificacaoCompleta}, devidamente qualificado no contrato de locação ${tipoContrato} firmado em ${contractData.dataFirmamentoContrato}.`;

    const enhancedData = {
      ...data,
      ...contractData,

      // Dados específicos do termo do locatário
      locadorTerm,
      dadosLocatarioTitulo,
      locatarioResponsabilidade,
      nomeQuemRetira,
      nomeProprietario: nomeProprietarioFormatado, // Nome sem negrito
      nomeLocatario: nomeLocatarioFormatado, // Nome sem negrito
      tipoQuantidadeChaves, // Quantidade de chaves processada

      // Processar observação
      observacao,

      // Status da vistoria com checkboxes
      statusVistoriaCheckboxes,

      // Texto de entrega de chaves baseado em quem está retirando
      textoEntregaChaves,

      // Citação correta dos locatários baseada no gênero
      citacaoLocatarios,

      // Tipo de vistoria processado
      tipoVistoriaTexto,

      // Data da vistoria processada (baseada no tipo selecionado)
      dataVistoria,

      // Dados dos fiadores (convertidos para string)
      temFiadores: temFiadores ? 'true' : 'false',
      fiadores: JSON.stringify(fiadores),
    };

    return enhancedData;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/contratos')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-neutral-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
                    Termo de Recebimento de Chaves
                  </h1>
                  <p className="text-base text-neutral-600">
                    Preencha os dados para gerar o termo do locatário
                  </p>
                </div>
              </div>
            </div>

            {/* Informações do Contrato */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-100 to-white border border-neutral-200 shadow-sm">
                <FileText className="h-5 w-5 text-neutral-700" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-900">
                  Contrato {contractData.numeroContrato}
                </p>
                <p className="text-xs text-neutral-600">
                  {contractData.enderecoImovel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar com Informações do Contrato */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Status das Contas de Consumo */}
                <ContractBillsStatus
                  contractId={contractData.numeroContrato}
                  formData={contractData}
                />

                {/* Informações do Contrato */}
                <Card className="bg-white border-neutral-300 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="p-2 rounded-lg bg-black"
                        style={{
                          imageRendering: 'crisp-edges',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <FileText
                          className="h-4 w-4 text-white"
                          color="#FFFFFF"
                          strokeWidth={2.5}
                          style={{
                            color: '#FFFFFF',
                            stroke: '#FFFFFF',
                            fill: 'none',
                            shapeRendering: 'geometricPrecision',
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-black">
                          Contrato{' '}
                          <span className="font-mono text-xl text-primary-600">
                            {contractData.numeroContrato}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                          {contractData.dataFirmamentoContrato}
                        </p>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-neutral-300 mb-4"></div>

                    {/* PARTES ENVOLVIDAS */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Partes Envolvidas
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div
                            className="p-1.5 rounded-md bg-black"
                            style={{
                              imageRendering: 'crisp-edges',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <User
                              className="h-3 w-3 text-white"
                              color="#FFFFFF"
                              strokeWidth={2.5}
                              style={{
                                color: '#FFFFFF',
                                stroke: '#FFFFFF',
                                fill: 'none',
                                shapeRendering: 'geometricPrecision',
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black uppercase tracking-wide">
                              Proprietário
                            </p>
                            <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                              {contractData.nomeProprietario}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div
                            className="p-1.5 rounded-md bg-black"
                            style={{
                              imageRendering: 'crisp-edges',
                              backfaceVisibility: 'hidden',
                            }}
                          >
                            <User2
                              className="h-3 w-3 text-white"
                              color="#FFFFFF"
                              strokeWidth={2.5}
                              style={{
                                color: '#FFFFFF',
                                stroke: '#FFFFFF',
                                fill: 'none',
                                shapeRendering: 'geometricPrecision',
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black uppercase tracking-wide">
                              Locatário
                            </p>
                            <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                              {contractData.nomeLocatario}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LOCALIZAÇÃO */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Localização
                      </h4>
                      <div className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
                        <div
                          className="p-1 rounded bg-black"
                          style={{
                            imageRendering: 'crisp-edges',
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <MapPin
                            className="h-3 w-3 text-white"
                            color="#FFFFFF"
                            strokeWidth={2.5}
                            style={{
                              color: '#FFFFFF',
                              stroke: '#FFFFFF',
                              fill: 'none',
                              shapeRendering: 'geometricPrecision',
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-black uppercase tracking-wide">
                            Endereço
                          </p>
                          <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                            {contractData.enderecoImovel}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CHAVES */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
                        Chaves
                      </h4>
                      <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                        <div
                          className="p-1 rounded bg-black"
                          style={{
                            imageRendering: 'crisp-edges',
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <Key
                            className="h-3 w-3 text-white"
                            color="#FFFFFF"
                            strokeWidth={2.5}
                            style={{
                              color: '#FFFFFF',
                              stroke: '#FFFFFF',
                              fill: 'none',
                              shapeRendering: 'geometricPrecision',
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-black uppercase tracking-wide">
                            Quantidade
                          </p>
                          <p className="text-sm font-semibold text-gray-600">
                            {contractData.quantidadeChaves || 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Formulário Principal */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-neutral-300 shadow-md">
                <CardContent className="p-0">
                  <DocumentFormWizard
                    title=""
                    description=""
                    steps={steps}
                    template=""
                    onGenerate={handleGenerate}
                    getTemplate={getTemplate}
                    contractData={contractData as Record<string, string>}
                    initialData={autoFillData}
                    onFormDataChange={handleFormDataChange}
                    hideSaveButton={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Validação de Contato */}
      <ContactModal
        open={showContactModal}
        celular={contactData.celularLocatario}
        email={contactData.emailLocatario}
        onCelularChange={(value) =>
          setContactData((prev) => ({ ...prev, celularLocatario: value }))
        }
        onEmailChange={(value) =>
          setContactData((prev) => ({ ...prev, emailLocatario: value }))
        }
        onSave={async () => {
          await handleSaveContactData(() => {
            if (pendingFormData) {
              // Força reexecução do wizard com os dados atualizados
              window.location.reload();
            }
          });
        }}
        onCancel={() => {
          setShowContactModal(false);
          setPendingFormData(null);
        }}
      />
    </div>
  );
};

export default TermoLocatario;
