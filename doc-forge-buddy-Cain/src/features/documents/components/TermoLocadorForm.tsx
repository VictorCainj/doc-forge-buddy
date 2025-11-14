import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DocumentFormWizard from '@/components/modals/DocumentFormWizard';
import { FormStep } from '@/hooks/use-form-wizard';
import { getContractLocadorNames } from '@/utils/nameHelpers';

interface ContractData {
  numeroContrato: string;
  nomeProprietario: string;
  quantidadeChaves?: string;
  nomesResumidosLocadores?: string;
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
  const locadorOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos os proprietários' },
      ...getContractLocadorNames({
        nomesResumidosLocadores: contractData.nomesResumidosLocadores,
        nomeProprietario: contractData.nomeProprietario,
      }).map((nome) => ({
        value: nome,
        label: nome,
      })),
      { value: 'custom', label: 'Outra pessoa (preencher abaixo)' },
    ],
    [contractData.nomesResumidosLocadores, contractData.nomeProprietario]
  );

  const steps: FormStep[] = [
    {
      id: 'entrega',
      title: 'Entrega de Chaves',
      description: 'Detalhes da entrega das chaves',
      fields: [
        {
          name: 'incluirNomeCompleto',
          label: 'Quem está retirando as chaves',
          type: 'select',
          required: false,
          placeholder: 'Selecione uma opção',
          options: locadorOptions,
        },
        {
          name: 'nomeQuemRetira',
          label: 'Nome de Quem Retira a Chave',
          type: 'text',
          required: true,
          placeholder: 'Primeiro selecione quem está retirando a chave',
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
