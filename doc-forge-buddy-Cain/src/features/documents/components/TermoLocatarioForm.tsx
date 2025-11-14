import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DocumentFormWizard from '@/components/modals/DocumentFormWizard';
import { FormStep } from '@/hooks/use-form-wizard';
import { getContractLocatarioNames } from '@/utils/nameHelpers';

interface ContractData {
  numeroContrato: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
  primeiroLocatario?: string;
  segundoLocatario?: string;
  terceiroLocatario?: string;
  quartoLocatario?: string;
  [key: string]: string | undefined;
}

interface TermoLocatarioFormProps {
  contractData: ContractData;
  initialData: Record<string, string>;
  onGenerate: (data: Record<string, string>) => any;
  getTemplate: (fontSize: number) => string;
  onFormDataChange: (data: Record<string, string>) => void;
}

export const TermoLocatarioForm: React.FC<TermoLocatarioFormProps> = ({
  contractData,
  initialData,
  onGenerate,
  getTemplate,
  onFormDataChange,
}) => {
  const locatarioOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos os locatários' },
      ...getContractLocatarioNames(contractData).map((nome) => ({
        value: nome,
        label: nome,
      })),
      { value: 'custom', label: 'Outra pessoa (preencher abaixo)' },
    ],
    [
      contractData.nomeLocatario,
      contractData.primeiroLocatario,
      contractData.segundoLocatario,
      contractData.terceiroLocatario,
      contractData.quartoLocatario,
    ]
  );

  const steps: FormStep[] = [
    {
      id: 'vistoria',
      title: 'Vistoria e Entrega',
      description: 'Detalhes da vistoria e entrega das chaves',
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
          options: locatarioOptions,
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

  return (
    <Card className="bg-white border-neutral-300 shadow-md">
      <CardContent className="p-0">
        <DocumentFormWizard
          title=""
          description=""
          steps={steps}
          template=""
          onGenerate={onGenerate}
          getTemplate={getTemplate}
          contractData={contractData as Record<string, string>}
          initialData={initialData}
          onFormDataChange={onFormDataChange}
          hideSaveButton={true}
        />
      </CardContent>
    </Card>
  );
};
