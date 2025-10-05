import React from 'react';
import { FormField } from '@/components/ui/form-field';
import { PersonManager } from '@/components/ui/person-manager';
import { FormStep as FormStepType } from '@/hooks/use-form-wizard';
import { cn } from '@/lib/utils';
import { isMultipleLocatarios, isTerceiraPessoa } from '../utils/templateProcessor';

interface Person {
  id: string;
  name: string;
}

interface FormStepContentProps {
  step: FormStepType;
  formData: Record<string, string>;
  contractData: Record<string, string>;
  locadores: Person[];
  locatarios: Person[];
  fiadores: Person[];
  updateField: (field: string, value: string) => void;
  getFieldError: (field: string) => string | undefined;
  isFieldTouched: (field: string) => boolean;
  setLocadores: React.Dispatch<React.SetStateAction<Person[]>>;
  setLocatarios: React.Dispatch<React.SetStateAction<Person[]>>;
  setFiadores: React.Dispatch<React.SetStateAction<Person[]>>;
}

/**
 * Componente de conteúdo de cada step do formulário
 */
export const FormStepContent: React.FC<FormStepContentProps> = React.memo(({
  step,
  formData,
  contractData,
  locadores,
  locatarios,
  fiadores,
  updateField,
  getFieldError,
  isFieldTouched,
  setLocadores,
  setLocatarios,
  setFiadores,
}) => {
  return (
    <div className="space-y-6 overflow-visible">
      {/* Gerenciadores de pessoas para etapas específicas */}
      {step.id === 'locador' && (
        <PersonManager
          title="Locador(es)"
          people={locadores}
          onPeopleChange={setLocadores}
          placeholder="Nome completo do locador"
          maxPeople={4}
        />
      )}

      {step.id === 'locatario' && (
        <PersonManager
          title="Locatário(s)"
          people={locatarios}
          onPeopleChange={setLocatarios}
          placeholder="Nome completo do locatário"
          maxPeople={4}
        />
      )}

      {step.id === 'fiador' && formData.temFiador === 'sim' && (
        <PersonManager
          title="Fiador(es)"
          people={fiadores}
          onPeopleChange={setFiadores}
          placeholder="Nome completo do fiador"
          maxPeople={4}
        />
      )}

      <div
        className={cn(
          'grid gap-6 overflow-visible',
          step.id === 'rescisao'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2'
        )}
      >
        {step.fields.map((field) => {
          // Lógica condicional para mostrar campos
          let shouldShowField = true;

          // Ocultar campos tradicionais quando PersonManager estiver sendo usado
          if (step.id === 'locador' && field.name === 'nomeLocador') {
            shouldShowField = false;
          } else if (
            step.id === 'locatario' &&
            field.name === 'nomesResumidos'
          ) {
            shouldShowField = false;
          } else if (
            step.id === 'locador' &&
            field.name === 'nomeProprietario'
          ) {
            shouldShowField = false;
          } else if (
            step.id === 'locatario' &&
            field.name === 'nomeLocatario'
          ) {
            shouldShowField = false;
          } else if (field.name === 'statusAgua') {
            shouldShowField = Boolean(
              formData.tipoAgua && formData.tipoAgua !== ''
            );
          } else if (
            field.name === 'cpfl' ||
            field.name === 'tipoAgua' ||
            field.name === 'statusAgua'
          ) {
            shouldShowField = formData.tipoTermo !== 'locador';
          } else if (field.name === 'dataVistoria') {
            shouldShowField = formData.tipoTermo !== 'locador';
          }

          // Lógica condicional para campos de vistoria/revistoria
          if (field.conditional) {
            const { field: conditionalField, value: conditionalValue } =
              field.conditional;
            shouldShowField = formData[conditionalField] === conditionalValue;
          }

          if (!shouldShowField) return null;

          // Lógica para opções dinâmicas baseadas no tipo de termo
          let dynamicOptions = field.options;

          // Ajustar opções do campo "tipoQuemRetira" baseado no tipo de termo
          if (field.name === 'tipoQuemRetira') {
            if (formData.tipoTermo === 'locador') {
              dynamicOptions = [
                { value: 'proprietario', label: 'Proprietário' },
              ];
            } else {
              dynamicOptions = [
                { value: 'proprietario', label: 'Proprietário' },
                { value: 'locatario', label: 'Locatário' },
              ];
            }
          } else if (field.name === 'nomeQuemRetira') {
            if (formData.tipoTermo === 'locador') {
              dynamicOptions = [];
            } else if (formData.tipoQuemRetira === 'proprietario') {
              dynamicOptions = [
                {
                  value: contractData.nomeProprietario || '',
                  label: contractData.nomeProprietario || 'Proprietário',
                },
              ];
            } else if (formData.tipoQuemRetira === 'locatario') {
              if (isMultipleLocatarios(contractData.nomeLocatario || '')) {
                const nomesLocatarios =
                  contractData.nomeLocatario
                    ?.split(/[, e E]+/)
                    .map((nome) => nome.trim())
                    .filter((nome) => nome) || [];
                dynamicOptions = nomesLocatarios.map((nome) => ({
                  value: nome,
                  label: nome,
                }));
              } else {
                dynamicOptions = [
                  {
                    value: contractData.nomeLocatario || '',
                    label: contractData.nomeLocatario || 'Locatário',
                  },
                ];
              }
            } else {
              dynamicOptions = field.options || [];
            }
          }

          return (
            <React.Fragment key={field.name}>
              <div
                className={cn(
                  field.type === 'textarea' ? 'md:col-span-2' : '',
                  field.type === 'arrowDropdown' && 'overflow-visible'
                )}
              >
                <FormField
                  name={field.name}
                  label={field.label}
                  type={
                    field.name === 'nomeQuemRetira'
                      ? 'textWithSuggestions'
                      : field.type
                  }
                  value={formData[field.name] || ''}
                  onChange={(value) => updateField(field.name, value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  error={getFieldError(field.name)}
                  touched={isFieldTouched(field.name)}
                  mask={field.mask}
                  options={dynamicOptions}
                  disabled={false}
                  description={
                    field.name === 'generoLocatario' &&
                    isMultipleLocatarios(formData.nomeLocatario || '')
                      ? 'Campo preenchido automaticamente para múltiplos locatários (neutro)'
                      : field.name === 'generoProprietario' &&
                          isMultipleLocatarios(
                            formData.nomeProprietario || ''
                          )
                        ? 'Campo preenchido automaticamente para múltiplos proprietários (neutro)'
                        : field.name === 'statusAgua'
                          ? `Status do documento ${formData.tipoAgua || 'selecionado'}`
                          : field.name === 'nomeQuemRetira' &&
                              !formData.tipoQuemRetira
                            ? 'Primeiro selecione quem está retirando a chave'
                            : field.name === 'nomeQuemRetira'
                              ? 'Digite o nome ou selecione uma sugestão'
                              : undefined
                  }
                  tooltip={
                    field.name === 'dataFirmamentoContrato'
                      ? 'Guia dos meses:\n\n1 - Janeiro     7 - Julho\n2 - Fevereiro  8 - Agosto\n3 - Março      9 - Setembro\n4 - Abril     10 - Outubro\n5 - Maio      11 - Novembro\n6 - Junho     12 - Dezembro'
                      : undefined
                  }
                />
              </div>
            </React.Fragment>
          );
        })}

        {/* Campo adicional para RG/CPF quando é terceira pessoa */}
        {isTerceiraPessoa(
          formData.nomeQuemRetira || '',
          contractData?.nomeProprietario || '',
          contractData?.nomeLocatario || ''
        ) && (
          <div className="md:col-span-2">
            <FormField
              name="documentoQuemRetira"
              label="RG ou CPF da Pessoa"
              type="text"
              value={formData.documentoQuemRetira || ''}
              onChange={(value) => updateField('documentoQuemRetira', value)}
              placeholder="Digite o RG ou CPF da pessoa"
              required={true}
              error={getFieldError('documentoQuemRetira')}
              touched={isFieldTouched('documentoQuemRetira')}
            />
          </div>
        )}
      </div>
    </div>
  );
});

FormStepContent.displayName = 'FormStepContent';
