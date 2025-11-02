// @ts-nocheck
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentForm from '@/components/DocumentForm';
import { TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE } from '@/templates/documentos';
import { formatDateBrazilian } from '@/utils/dateFormatter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TermoRecusaAssinaturaEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [_isGenerating, setIsGenerating] = useState(false);

  // Dados do contrato passados via location.state
  const contractData = location.state?.contractData || {};

  // Campos do formulário
  const fields = [
    {
      name: 'dataRealizacaoVistoria',
      label: 'Data da Realização da Vistoria/Revistoria',
      type: 'text' as const,
      required: true,
      placeholder: 'Ex: 19 de setembro de 2025',
      tooltip: 'Data em que foi realizada a vistoria ou revistoria do imóvel',
    },
    {
      name: 'dataVistoria',
      label: 'Data da Vistoria (para o documento)',
      type: 'text' as const,
      required: true,
      placeholder: 'Ex: 19 de setembro de 2025',
      tooltip:
        'Data que aparecerá no documento (pode ser diferente da data de realização)',
    },
    {
      name: 'assinanteSelecionado',
      label: 'Nome do Assinante',
      type: 'text' as const,
      required: true,
      placeholder: 'Nome do responsável pela assinatura',
    },
  ];

  const handleGenerate = async (data: Record<string, string>) => {
    setIsGenerating(true);
    try {
      // Adicionar dados do contrato aos dados do formulário
      const enhancedData = {
        ...contractData,
        ...data,
        dataAtual: formatDateBrazilian(new Date()),
        // Usar a data da vistoria escolhida pelo usuário, ou a data de realização como fallback
        dataVistoria: data.dataVistoria || data.dataRealizacaoVistoria,
      };

      // Processar o template com os dados
      let processedTemplate = TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE;

      // Substituir variáveis no template
      Object.entries(enhancedData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedTemplate = processedTemplate.replace(
          regex,
          String(value || '')
        );
      });

      // Salvar no banco de dados
      const { error } = await supabase.from('contracts').insert({
        contract_id: contractData.id,
        document_type: 'Termo de Recusa de Assinatura - E-mail',
        content: processedTemplate,
        form_data: enhancedData,
        created_at: new Date().toISOString(),
      });

      if (error) {
        // console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar o documento');
        return;
      }

      // Navegar para a página de visualização
      navigate('/gerar-documento', {
        state: {
          title: `Termo de Recusa de Assinatura - E-mail - Contrato ${contractData.numeroContrato}`,
          template: processedTemplate,
          formData: enhancedData,
          documentType: 'Termo de Recusa de Assinatura - E-mail',
        },
      });

      toast.success('Documento gerado com sucesso!');
    } catch {
      // console.error('Erro ao gerar documento:', error);
      toast.error('Erro ao gerar o documento');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 border border-white/10 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 border border-white/25 rounded-lg -rotate-45"></div>
      </div>

      {/* Main Content */}
      <div className="p-6 relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/contratos')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="max-w-6xl mx-auto">
          <Card className="glass-card">
            <CardContent className="p-0">
              <DocumentForm
                title="Termo de Recusa de Assinatura - E-mail"
                description="Gere o termo de recusa de assinatura por e-mail com os dados da vistoria"
                fields={fields}
                template={TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE}
                onGenerate={handleGenerate}
                initialData={contractData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermoRecusaAssinaturaEmail;
