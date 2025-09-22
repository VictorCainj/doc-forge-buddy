import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentFormWizard from '../components/DocumentFormWizard';
import { Search, ArrowLeft, Key, User, FileText } from 'lucide-react';
import { FormStep } from '../hooks/use-form-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  [key: string]: string;
}

const TermoLocador: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contractData as ContractData;

  // Estado para gerenciar auto-preenchimento
  const [autoFillData, setAutoFillData] = React.useState<
    Record<string, string>
  >({});

  if (!contractData?.numeroContrato) {
    navigate('/contratos');
    return null;
  }

  // Debug: verificar dados do contrato
  // console.log('Dados do contrato no TermoLocador:', contractData);
  // console.log('Quantidade de chaves:', contractData.quantidadeChaves);

  // Função para detectar múltiplos proprietários baseado na quantidade adicionada
  const _isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return nomeProprietario.includes(' e ');
  };

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
            { value: 'todos', label: 'Todos os locadores' },
            ...(contractData.nomesResumidosLocadores ||
            contractData.nomeProprietario
              ? (
                  contractData.nomesResumidosLocadores ||
                  contractData.nomeProprietario
                )
                  .split(/,| e | E /)
                  .map((nome) => nome.trim())
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
          name: 'observacao',
          label: 'Observação (Opcional)',
          type: 'textarea',
          required: false,
          placeholder: 'Digite observações adicionais se necessário',
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
    <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto;" />
  </div>
  <div style="flex: 1; text-align: right; font-size: ${fontSize}px; margin-left: 20px;">
    Valinhos, ${getCurrentDate()}.
  </div>
</div>

<div style="text-align: center; margin-bottom: 20px; font-size: ${titleSize}px; font-weight: bold;">
TERMO DE RECEBIMENTO – {{numeroContrato}}
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: ${fontSize}px;">
{{textoEntregaChaves}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomeLocatario}}
</div>

<div style="margin: 15px 0; font-size: ${fontSize}px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
{{tipoQuantidadeChaves}}
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
`;
  };

  const handleGenerate = (data: Record<string, string>) => {
    // Detectar se há múltiplos proprietários
    const nomeProprietario =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario;
    const isMultipleProprietarios =
      nomeProprietario &&
      (nomeProprietario.includes(',') ||
        nomeProprietario.includes(' e ') ||
        nomeProprietario.includes(' E '));

    // Detectar se há múltiplos locatários baseado no nome dos locatários
    const nomeLocatario = contractData.nomeLocatario || '';
    const isMultipleLocatarios =
      nomeLocatario &&
      (nomeLocatario.includes(',') ||
        nomeLocatario.includes(' e ') ||
        nomeLocatario.includes(' E '));

    // Definir termo do locador baseado na quantidade e gênero
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

    // Definir título baseado na quantidade e gênero dos locatários
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

    // Processar nome de quem retira baseado na opção selecionada
    let nomeQuemRetira = data.nomeQuemRetira;
    if (data.incluirNomeCompleto === 'todos') {
      nomeQuemRetira = nomeProprietario;
    } else if (data.incluirNomeCompleto && data.incluirNomeCompleto !== '') {
      // Se selecionou um proprietário específico
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

    // Processar observação (só mostra se preenchida)
    const observacao =
      data.observacao && data.observacao.trim() !== ''
        ? `<strong>OBS:</strong> ${data.observacao}`
        : '';

    // Texto de entrega de chaves para termo do locador (simplificado)
    const textoEntregaChaves = `Pelo presente, entrego as chaves do imóvel sito à <strong>${contractData.enderecoImovel}</strong>.`;

    // Aplicar formatação de nomes - sem negrito para o proprietário
    const nomeProprietarioFormatado =
      contractData.nomesResumidosLocadores || contractData.nomeProprietario; // Sem negrito

    const enhancedData = {
      ...contractData,
      ...data,

      // Dados específicos do termo do locador - devem vir por último para sobrescrever
      locadorTerm,
      dadosLocatarioTitulo,
      nomeQuemRetira,
      nomeProprietario: nomeProprietarioFormatado, // Nome formatado
      tipoQuantidadeChaves, // Quantidade de chaves processada

      // Processar observação
      observacao,

      // Texto de entrega de chaves com qualificações dos locatários
      textoEntregaChaves,
    };

    return enhancedData;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Termo de Recebimento de Chaves
                </h1>
                <p className="text-white/80 text-lg">
                  Documento para formalizar o recebimento das chaves pelo
                  locador
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-3 rounded-xl bg-white/10">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  <User className="h-3 w-3 mr-1" />
                  Locador
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-white/90">
                <p className="text-sm">
                  Contrato #{contractData.numeroContrato}
                </p>
                <p className="text-xs text-white/70">
                  Documento oficial de entrega
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  onClick={() => navigate('/contratos')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Info Card */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                Informações do Termo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Vistoria
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Detalhes da vistoria e entrega das chaves
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Responsável
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Identificação de quem retira as chaves
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Key className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Chaves
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Controle de entrega e recebimento
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Wizard */}
          <Card className="glass-card">
            <CardContent className="p-0">
              <DocumentFormWizard
                title="Termo de Recebimento de Chaves - Locador"
                description="Preencha os dados para gerar o termo"
                steps={steps}
                template=""
                onGenerate={handleGenerate}
                getTemplate={getTemplate}
                contractData={contractData}
                initialData={autoFillData}
                onFormDataChange={setAutoFillData}
                hideSaveButton={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermoLocador;
