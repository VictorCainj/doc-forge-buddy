import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DocumentFormWizard from '@/components/modals/DocumentFormWizard';
import { FormStep } from '@/hooks/use-form-wizard';

interface ContractData {
  numeroContrato: string;
  nomeProprietario: string;
  quantidadeChaves?: string;
  [key: string]: string | undefined;
}

interface TermoLocadorFormProps {
  contractData: ContractData;
  initialData: Record<string, string>;
  onGenerate: (data: Record<string, string>) => any;
  getTemplate: (fontSize: number) => string;
  onFormDataChange: (data: Record<string, string>) => void;
}

export const TermoLocadorForm: React.FC<TermoLocadorFormProps> = ({
  contractData,
  initialData,
  onGenerate,
  getTemplate,
  onFormDataChange,
}) => {
  const steps: FormStep[] = [
    {
      id: 'entrega',
      title: 'Entrega de Chaves',
      description: 'Detalhes da entrega das chaves',
      fields: [
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
          name: 'qualificacaoCompleta',
          label: 'Qualificação Completa do Proprietário',
          type: 'text',
          required: true,
          placeholder: 'Digite a qualificação completa',
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
