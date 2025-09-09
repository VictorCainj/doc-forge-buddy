import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DocumentForm from "@/components/DocumentForm";
import { useToast } from "@/hooks/use-toast";

const EditTerm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [termData, setTermData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchTerm();
    }
  }, [id]);

  const fetchTerm = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Termo não encontrado",
          description: "O termo que você está tentando editar não foi encontrado.",
          variant: "destructive"
        });
        navigate('/termos-salvos');
        return;
      }

      setTermData(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o termo para edição.",
        variant: "destructive"
      });
      navigate('/termos-salvos');
    } finally {
      setLoading(false);
    }
  };

  // Funções para detectar plural e gênero (copiadas do TermoInquilino)
  const isPlural = (text: string) => {
    return text.includes(',') || text.includes(' e ') || text.includes(' E ');
  };

  const isFeminine = (text: string) => {
    const femaleNames = ['ana', 'maria', 'carla', 'sandra', 'patricia', 'fernanda', 'juliana', 'carolina', 'gabriela', 'mariana'];
    const firstNameLower = text.split(' ')[0].toLowerCase();
    return text.toLowerCase().endsWith('a') || femaleNames.includes(firstNameLower);
  };

  const getLocadorTerm = (nomeLocador: string) => {
    if (!nomeLocador) return 'LOCADOR';
    if (isPlural(nomeLocador)) {
      return 'LOCADORES';
    }
    return isFeminine(nomeLocador) ? 'LOCADORA' : 'LOCADOR';
  };

  const getLocatarioTerm = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'LOCATÁRIO';
    if (isPlural(nomeLocatario)) {
      return 'LOCATÁRIOS';
    }
    return isFeminine(nomeLocatario) ? 'LOCATÁRIA' : 'LOCATÁRIO';
  };

  const getLocatarioFieldTitle = (nomeLocatario: string) => {
    if (!nomeLocatario) return 'Dados do Locatário';
    if (isPlural(nomeLocatario)) {
      return 'Dados dos Locatários';
    }
    return isFeminine(nomeLocatario) ? 'Dados da Locatária' : 'Dados do Locatário';
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
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const fieldGroups = [
    {
      title: "Dados do Imóvel",
      fields: [
        { name: "endereco", label: "Endereço do Imóvel", type: "textarea" as const, required: true, placeholder: "Endereço completo do imóvel" },
        { name: "dataContrato", label: "Data de Firmamento do Contrato", type: "text" as const, required: true, placeholder: "Ex: 15 de janeiro de 2024", tooltip: "Guia dos meses:\n\n1 - Janeiro     7 - Julho\n2 - Fevereiro  8 - Agosto\n3 - Março      9 - Setembro\n4 - Abril     10 - Outubro\n5 - Maio      11 - Novembro\n6 - Junho     12 - Dezembro" }
      ]
    },
    {
      title: "Dados do Locador",
      fields: [
        { name: "nomeLocador", label: "Nome do Locador", type: "text" as const, required: true, placeholder: "Nome completo do locador" }
      ]
    },
    {
      title: "Dados do Locatário",
      getDynamicTitle: (formData: Record<string, string>) => getLocatarioFieldTitle(formData.nomeLocatario),
      fields: [
        { name: "nomeLocatario", label: "Nome do Locatário", type: "text" as const, required: true, placeholder: "Nome completo do locatário" },
        { name: "celularLocatario", label: "Celular do Locatário", type: "text" as const, required: true, placeholder: "Ex: (19) 99999-9999" },
        { name: "emailLocatario", label: "E-mail do Locatário", type: "text" as const, required: true, placeholder: "email@exemplo.com" }
      ]
    },
    {
      title: "Documentos Apresentados",
      fields: [
        { name: "cpfl", label: "CPFL Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" },
        { name: "daev", label: "DAEV Apresentada", type: "text" as const, required: true, placeholder: "SIM ou NÃO" }
      ]
    },
    {
      title: "Vistoria e Entrega",
      fields: [
        { name: "tipoQuantidadeChaves", label: "Tipo e Quantidade de Chaves", type: "textarea" as const, required: true, placeholder: "Ex: 04 chaves simples" },
        { name: "dataVistoria", label: "Data da Vistoria", type: "text" as const, required: true, placeholder: "Ex: 28/08/2025" },
        { name: "nomeQuemRetira", label: "Nome de Quem Retira a Chave", type: "text" as const, required: true, placeholder: "Nome completo" },
        { name: "tipoContrato", label: "Tipo de Contrato", type: "select" as const, required: false, placeholder: "Selecione o tipo", options: [
          { value: "residencial", label: "Residencial" },
          { value: "comercial", label: "Comercial" }
        ]},
        { name: "nomeGestor", label: "Nome do Gestor", type: "text" as const, required: true, placeholder: "Ex: Victor Cain Jorge" }
      ]
    }
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
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.
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
(  ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
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
      locadorTerm: getLocadorTerm(data.nomeLocador),
      locatarioTerm: getLocatarioTerm(data.nomeLocatario),
      locatarioFieldTitle: getLocatarioFieldTitle(data.nomeLocatario),
      locatarioPronoun: getLocatarioPronoun(data.nomeLocatario)
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
      title="Editar Termo de Recebimento de Chaves"
      description="Editando documento salvo"
      fieldGroups={fieldGroups}
      template={template}
      onGenerate={handleGenerate}
      initialData={termData.form_data}
      termId={termData.id}
      isEditing={true}
    />
  );
};

export default EditTerm;