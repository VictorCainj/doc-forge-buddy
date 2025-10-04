/**
 * Página de Edição de Contrato
 * Permite editar todas as informações do contrato usando o mesmo formulário do cadastro
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DocumentFormWizard from '@/components/DocumentFormWizard';
import { FormStep } from '@/hooks/use-form-wizard';
import {
  Users,
  Building2,
  UserCheck,
  Shield,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ContractData {
  id: string;
  form_data: Record<string, string> | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  document_type?: string;
}

const EditContract: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // ✅ Definição completa dos steps do formulário (igual ao cadastro)
  const steps: FormStep[] = [
    {
      id: 'contrato',
      title: 'Dados do Contrato',
      description: 'Informações essenciais do contrato',
      icon: Building2,
      fields: [
        {
          name: 'numeroContrato',
          label: 'Número do Contrato',
          type: 'text',
          required: true,
          placeholder: 'Ex: 13734',
        },
        {
          name: 'enderecoImovel',
          label: 'Endereço do Imóvel',
          type: 'text',
          required: true,
          placeholder: 'Endereço completo do imóvel',
        },
        {
          name: 'dataFirmamentoContrato',
          label: 'Data de Firmamento do Contrato',
          type: 'text',
          required: true,
          placeholder: 'Ex: 15/10/2024 ou 15 de outubro de 2024',
        },
        {
          name: 'inicioVigencia',
          label: 'Início da Vigência',
          type: 'text',
          required: true,
          placeholder: 'Ex: 01/11/2024',
        },
        {
          name: 'fimVigencia',
          label: 'Fim da Vigência',
          type: 'text',
          required: true,
          placeholder: 'Ex: 31/10/2027',
        },
        {
          name: 'valorAluguel',
          label: 'Valor do Aluguel',
          type: 'text',
          required: true,
          placeholder: 'Ex: R$ 2.500,00',
        },
      ],
    },
    {
      id: 'locadores',
      title: 'Dados dos Locadores',
      description: 'Informações dos proprietários',
      icon: Users,
      fields: [
        {
          name: 'nomeProprietario',
          label: 'Nome do(s) Proprietário(s)',
          type: 'text',
          required: true,
          placeholder: 'Nome completo do proprietário',
        },
        {
          name: 'cpfProprietario',
          label: 'CPF do Proprietário',
          type: 'text',
          placeholder: 'XXX.XXX.XXX-XX',
        },
        {
          name: 'rgProprietario',
          label: 'RG do Proprietário',
          type: 'text',
          placeholder: 'XX.XXX.XXX-X',
        },
        {
          name: 'estadoCivilProprietario',
          label: 'Estado Civil do Proprietário',
          type: 'text',
          placeholder: 'Ex: Solteiro(a), Casado(a), etc.',
        },
        {
          name: 'enderecoProprietario',
          label: 'Endereço do Proprietário',
          type: 'text',
          placeholder: 'Endereço completo',
        },
        {
          name: 'telefoneProprietario',
          label: 'Telefone do Proprietário',
          type: 'text',
          placeholder: '(XX) XXXXX-XXXX',
        },
        {
          name: 'emailProprietario',
          label: 'E-mail do Proprietário',
          type: 'email',
          placeholder: 'email@exemplo.com',
        },
      ],
    },
    {
      id: 'locatarios',
      title: 'Dados dos Locatários',
      description: 'Informações dos inquilinos',
      icon: UserCheck,
      fields: [
        {
          name: 'nomeLocatario',
          label: 'Nome do(s) Locatário(s)',
          type: 'text',
          required: true,
          placeholder: 'Nome completo do locatário',
        },
        {
          name: 'cpfLocatario',
          label: 'CPF do Locatário',
          type: 'text',
          placeholder: 'XXX.XXX.XXX-XX',
        },
        {
          name: 'rgLocatario',
          label: 'RG do Locatário',
          type: 'text',
          placeholder: 'XX.XXX.XXX-X',
        },
        {
          name: 'estadoCivilLocatario',
          label: 'Estado Civil do Locatário',
          type: 'text',
          placeholder: 'Ex: Solteiro(a), Casado(a), etc.',
        },
        {
          name: 'enderecoLocatario',
          label: 'Endereço do Locatário',
          type: 'text',
          placeholder: 'Endereço completo',
        },
        {
          name: 'telefoneLocatario',
          label: 'Telefone do Locatário',
          type: 'text',
          placeholder: '(XX) XXXXX-XXXX',
        },
        {
          name: 'emailLocatario',
          label: 'E-mail do Locatário',
          type: 'email',
          placeholder: 'email@exemplo.com',
        },
      ],
    },
    {
      id: 'garantias',
      title: 'Garantias',
      description: 'Informações sobre garantias do contrato',
      icon: Shield,
      fields: [
        {
          name: 'tipoGarantia',
          label: 'Tipo de Garantia',
          type: 'select',
          options: [
            { value: 'fiador', label: 'Fiador' },
            { value: 'deposito', label: 'Depósito Caução' },
            { value: 'seguro', label: 'Seguro Fiança' },
            { value: 'titulo', label: 'Título de Capitalização' },
          ],
          placeholder: 'Selecione o tipo de garantia',
        },
        {
          name: 'nomeFiador',
          label: 'Nome do Fiador',
          type: 'text',
          placeholder: 'Nome completo do fiador',
        },
        {
          name: 'cpfFiador',
          label: 'CPF do Fiador',
          type: 'text',
          placeholder: 'XXX.XXX.XXX-XX',
        },
        {
          name: 'enderecoFiador',
          label: 'Endereço do Fiador',
          type: 'text',
          placeholder: 'Endereço completo do fiador',
        },
        {
          name: 'valorDeposito',
          label: 'Valor do Depósito',
          type: 'text',
          placeholder: 'Ex: R$ 5.000,00',
        },
      ],
    },
    {
      id: 'observacoes',
      title: 'Observações',
      description: 'Informações adicionais',
      icon: FileCheck,
      fields: [
        {
          name: 'observacoes',
          label: 'Observações Gerais',
          type: 'textarea',
          placeholder: 'Observações adicionais sobre o contrato...',
        },
        {
          name: 'clausulasEspeciais',
          label: 'Cláusulas Especiais',
          type: 'textarea',
          placeholder: 'Cláusulas específicas deste contrato...',
        },
        {
          name: 'condicoesPagamento',
          label: 'Condições de Pagamento',
          type: 'text',
          placeholder: 'Ex: Vencimento todo dia 10',
        },
        {
          name: 'reajusteAnual',
          label: 'Reajuste Anual',
          type: 'text',
          placeholder: 'Ex: IGPM, IPCA, etc.',
        },
      ],
    },
  ];

  // ✅ Carregar dados do contrato
  const fetchContract = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Contrato não encontrado');
        navigate('/contratos');
        return;
      }

      const parsedFormData = typeof data.form_data === 'string' 
        ? JSON.parse(data.form_data) 
        : data.form_data || {};

      setContractData({
        ...data,
        form_data: parsedFormData,
      });
      setFormData(parsedFormData);

    } catch {
      // console.error('Erro ao carregar contrato:', error);
      toast.error('Erro ao carregar contrato para edição');
      navigate('/contratos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // ✅ Salvar alterações
  const handleSave = async (updatedFormData: Record<string, string>): Promise<Record<string, string>> => {

    try {
      setSaving(true);

      const { error } = await supabase
        .from('saved_terms')
        .update({
          form_data: updatedFormData,
          title: `Contrato ${updatedFormData.numeroContrato || 'S/N'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractData.id);

      if (error) throw error;

      toast.success('Contrato atualizado com sucesso!');
      navigate('/contratos');

      return updatedFormData;

    } catch {
      // console.error('Erro ao salvar contrato:', error);
      toast.error('Erro ao salvar alterações do contrato');
      setSaving(false);
      return updatedFormData;
    }
  };

  // ✅ Carregar dados na inicialização
  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Contrato não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O contrato que você está tentando editar não foi encontrado.
            </p>
            <Button onClick={() => navigate('/contratos')}>
              Voltar para Contratos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* ✅ Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contratos')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Editar Contrato
              </h1>
              <p className="text-muted-foreground">
                Contrato {formData.numeroContrato || contractData.id} - 
                Criado em {new Date(contractData.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contractData.updated_at !== contractData.created_at && (
              <span className="text-xs text-muted-foreground">
                Última edição: {new Date(contractData.updated_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        {/* ✅ Formulário de Edição */}
        <DocumentFormWizard
          steps={steps}
          initialData={formData}
          onGenerate={handleSave}
          template=""
          submitButtonText={saving ? "Salvando..." : "Salvar Alterações"}
          isSubmitting={saving}
          title="Edição de Contrato"
          description="Edite as informações do contrato nos campos abaixo"
          hideSaveButton={false}
        />
      </div>
    </div>
  );
};

export default EditContract;
