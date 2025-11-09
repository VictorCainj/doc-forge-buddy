import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DocumentForm from '@/components/modals/DocumentForm';
import { useToast } from '@/components/ui/use-toast';

const EditTerm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [termData, setTermData] = useState<{
    id: string;
    form_data: Record<string, string>;
    title: string;
    content: string;
  } | null>(null);

  const fetchTerm = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({
          title: 'Termo não encontrado',
          description:
            'O termo que você está tentando editar não foi encontrado.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setTermData({
        ...data,
        form_data:
          typeof data.form_data === 'string'
            ? JSON.parse(data.form_data)
            : (data.form_data as Record<string, string>) || {},
      });
    } catch {
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar o termo para edição.',
        variant: 'destructive',
      });
      navigate('/termos-salvos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    if (id) {
      fetchTerm();
    }
  }, [id, fetchTerm]);

  // Funções para detectar plural e gênero
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
    ];
    const nameParts = text.split(' ');
    const firstNameLower = nameParts[0]?.toLowerCase() || '';
    return (
      text.toLowerCase().endsWith('a') || femaleNames.includes(firstNameLower)
    );
  };

  const getLocadorTerm = (nomeLocador: string) => {
    if (!nomeLocador) return 'LOCADOR(a)';
    if (isPlural(nomeLocador)) {
      return 'LOCADORES';
    }
    return 'LOCADOR(a)';
  };

  const getLocatarioTerm = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'LOCATÁRIO(a)';
    if (isPlural(nomeLocatario)) {
      return 'LOCATÁRIOS';
    }
    return 'LOCATÁRIO(a)';
  };

  const getLocatarioFieldTitle = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'DADOS DO(A) LOCATÁRIO(A)';
    if (isPlural(nomeLocatario)) {
      return 'DADOS DOS LOCATÁRIOS';
    }
    return 'DADOS DO(A) LOCATÁRIO(A)';
  };

  const getLocatarioPronoun = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'ao';
    if (isPlural(nomeLocatario)) {
      return 'aos';
    }
    return isFeminine(nomeLocatario) ? 'à' : 'ao';
  };

  // Gera data atual automaticamente
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

  const fieldGroups = [
    {
      title: 'Dados do Contrato',
      fields: [
        {
          name: 'numeroContrato',
          label: 'Número do Contrato',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: 13734',
        },
        {
          name: 'enderecoImovel',
          label: 'Endereço do Imóvel',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Endereço completo do imóvel',
        },
        {
          name: 'dataFirmamentoContrato',
          label: 'Data de Firmamento do Contrato',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: 15/10/2024 ou 15 de outubro de 2024',
        },
        {
          name: 'incluirQuantidadeChaves',
          label: 'Incluir quantidade de chaves no contrato?',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Incluir quantidade de chaves' },
            { value: 'nao', label: 'Não - Não incluir quantidade de chaves' },
          ],
        },
        {
          name: 'quantidadeChaves',
          label: 'Quantidade e tipo de chaves',
          type: 'textarea' as const,
          required: false,
          placeholder: 'Ex: 04 chaves simples, 02 chaves tetra',
        },
      ],
    },
    {
      title: 'Qualificação dos Locadores',
      fields: [
        {
          name: 'generoProprietario',
          label: 'Gênero dos Locadores',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
            { value: 'masculinos', label: 'Masculinos (plural)' },
            { value: 'femininos', label: 'Femininos (plural)' },
          ],
        },
        {
          name: 'nomeProprietario',
          label: 'Nome dos Locadores',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Nome completo dos locadores',
        },
        {
          name: 'qualificacaoCompletaLocadores',
          label: 'Qualificação Completa dos Locadores',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Qualificação completa dos locadores conforme contrato',
        },
        {
          name: 'celularProprietario',
          label: 'Celular do Locador',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: (19) 99999-9999',
        },
      ],
    },
    {
      title: 'Qualificação dos Locatários',
      fields: [
        {
          name: 'nomeLocatario',
          label: 'Nome dos Locatários',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Nome completo dos locatários',
        },
        {
          name: 'generoLocatario',
          label: 'Gênero dos Locatários',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
            { value: 'masculinos', label: 'Masculinos (plural)' },
            { value: 'femininos', label: 'Femininos (plural)' },
          ],
        },
        {
          name: 'qualificacaoCompletaLocatarios',
          label: 'Qualificação Completa dos Locatários',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Qualificação completa dos locatários conforme contrato',
        },
        {
          name: 'celularLocatario',
          label: 'Celular do Locatário',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: (19) 99999-9999',
        },
        {
          name: 'emailLocatario',
          label: 'E-mail do Locatário',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: locatario@email.com',
        },
      ],
    },
    {
      title: 'Dados de Rescisão',
      fields: [
        {
          name: 'dataInicioRescisao',
          label: 'Data de Início da Rescisão',
          type: 'text' as const,
          required: true,
          placeholder: 'DD/MM/AAAA - Ex: 23/06/2025',
        },
        {
          name: 'dataTerminoRescisao',
          label: 'Data de Término da Rescisão',
          type: 'text' as const,
          required: true,
          placeholder: 'DD/MM/AAAA - Ex: 22/07/2025',
        },
      ],
    },
    {
      title: 'Contas de Consumo',
      description: 'Informações sobre as contas de consumo do imóvel',
      fields: [
        {
          name: 'cpfl',
          label: 'CPFL',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'SIM', label: 'SIM' },
            { value: 'NÃO', label: 'NÃO' },
          ],
        },
        {
          name: 'tipoAgua',
          label: 'Tipo de Água',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'DAEV', label: 'DAEV' },
            { value: 'SANASA', label: 'SANASA' },
            { value: 'SANEBAVI', label: 'SANEBAVI' },
          ],
        },
        {
          name: 'statusAgua',
          label: 'Status da Água',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'SIM', label: 'SIM' },
            { value: 'NÃO', label: 'NÃO' },
            { value: 'No condomínio', label: 'No condomínio' },
          ],
        },
      ],
    },
    {
      title: 'Vistoria e Entrega',
      description: 'Detalhes da vistoria e entrega das chaves',
      fields: [
        {
          name: 'tipoQuantidadeChaves',
          label: 'Tipo e Quantidade de Chaves',
          type: 'textarea' as const,
          required: true,
          placeholder: 'Ex: 04 chaves simples',
        },
        {
          name: 'dataVistoria',
          label: 'Data da Vistoria',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: 28/08/2025',
        },
        {
          name: 'nomeQuemRetira',
          label: 'Nome de Quem Retira a Chave',
          type: 'text' as const,
          required: true,
          placeholder: 'Nome completo',
        },
        {
          name: 'tipoContrato',
          label: 'Tipo de Contrato',
          type: 'select' as const,
          required: false,
          options: [
            { value: 'residencial', label: 'Residencial' },
            { value: 'comercial', label: 'Comercial' },
          ],
        },
        {
          name: 'nomeGestor',
          label: 'Nome do Gestor',
          type: 'text' as const,
          required: true,
          placeholder: 'Ex: Victor Cain Jorge',
        },
      ],
    },
    {
      title: 'Documentos Solicitados',
      description:
        'Configure quais documentos devem ser solicitados na devolutiva locatário (energia elétrica sempre é solicitada)',
      fields: [
        {
          name: 'solicitarCondominio',
          label: 'Solicitar Comprovante de Condomínio',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário paga condomínio' },
            { value: 'nao', label: 'Não - Condomínio no boleto do locador' },
          ],
        },
        {
          name: 'solicitarAgua',
          label: 'Solicitar Comprovante de Água',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário paga água' },
            { value: 'nao', label: 'Não - Água inclusa no condomínio' },
          ],
        },
        {
          name: 'solicitarGas',
          label: 'Solicitar Comprovante de Gás',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Locatário usa gás' },
            { value: 'nao', label: 'Não - Gás não utilizado' },
          ],
        },
        {
          name: 'solicitarCND',
          label: 'Solicitar Certidão Negativa de Débitos (CND)',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'sim', label: 'Sim - Solicitar CND' },
            { value: 'nao', label: 'Não - CND não necessária' },
          ],
        },
      ],
    },
  ];

  const template = `
<div style="text-align: right; margin-bottom: 15px; font-size: 14px;">Valinhos, ${getCurrentDate()}.</div>

<div style="text-align: justify; line-height: 1.4; margin-bottom: 12px; font-size: 14px;">
Pelo presente, recebemos as chaves do imóvel sito à <strong>{{endereco}}</strong>, ora locado <strong>{{locatarioPronoun}} {{nomeLocatario}}</strong>, devidamente qualificado no contrato de locação <strong>{{tipoContrato}}</strong> firmado em {{dataFirmamentoContrato}}.
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeLocador}}<br>
<strong>{{locatarioFieldTitle}}:</strong> {{nomeLocatario}}<br>
<strong>Celular:</strong> {{celularLocatario}} <strong>E-mail:</strong> {{emailLocatario}}
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS (CPFL):</strong><br>
<strong>CPFL:</strong> {{cpfl}} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>DAEV:</strong> {{daev}}<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do(a) Locatário(a).
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{tipoQuantidadeChaves}}
</div>

<div style="margin: 12px 0; font-size: 13px;">
<strong>Vistoria realizada em</strong> {{dataVistoria}}
</div>

<div style="margin: 15px 0; font-size: 13px;">
(  ) Imóvel entregue de acordo com a vistoria inicial<br>
(  ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do(a) locatário(a). Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin-top: 40px; text-align: center;">
<div style="margin-bottom: 30px;">
__________________________________________<br>
<span style="font-size: 12px;">{{nomeQuemRetira}}</span>
</div>

<div>
________________________________________<br>
<span style="font-size: 12px;">{{nomeGestor}}</span>
</div>
</div>
  `;

  const handleGenerate = (data: Record<string, string>) => {
    // Adiciona termos inteligentes baseados nos nomes inseridos
    const enhancedData = {
      ...data,
      locadorTerm: getLocadorTerm(data.nomeLocador || ''),
      locatarioTerm: getLocatarioTerm(data.nomeLocatario || ''),
      locatarioFieldTitle: getLocatarioFieldTitle(data.nomeLocatario || ''),
      locatarioPronoun: getLocatarioPronoun(data.nomeLocatario || ''),
    };
    return enhancedData;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando termo...</p>
        </div>
      </div>
    );
  }

  if (!termData) {
    return null;
  }

  return (
    <DocumentForm
      title="Editar Contrato"
      description="Editando dados do contrato e configurações de documentos"
      fieldGroups={fieldGroups}
      template={template}
      onGenerate={handleGenerate}
      initialData={termData.form_data}
      termId={termData.id}
      isEditing={true}
      hideSaveButton={true}
    />
  );
};

export default EditTerm;
