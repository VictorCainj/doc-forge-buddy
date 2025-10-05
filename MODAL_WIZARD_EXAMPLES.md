# 🎮 Exemplos de Uso - Modal Wizard Tecnológico

## 🎯 Exemplo 1: Cadastro Básico de Contrato

```tsx
import { useState } from 'react';
import { ContractWizardModal } from '@/features/contracts/components';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function CadastrarContrato() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
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
          placeholder: 'Endereço completo',
        },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('saved_terms')
        .insert({ form_data: data, document_type: 'contrato' });
      
      if (error) throw error;
      
      toast.success('Contrato cadastrado com sucesso!');
      navigate('/contratos');
    } catch (error) {
      toast.error('Erro ao cadastrar contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContractWizardModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      steps={steps}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      title="✨ Novo Contrato"
    />
  );
}
```

## 🎯 Exemplo 2: Edição de Contrato Existente

```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function EditarContrato() {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      const { data } = await supabase
        .from('saved_terms')
        .select('*')
        .eq('id', id)
        .single();
      
      setInitialData(data.form_data);
      setIsLoading(false);
    };
    
    loadContract();
  }, [id]);

  const handleSubmit = async (data: Record<string, string>) => {
    await supabase
      .from('saved_terms')
      .update({ form_data: data })
      .eq('id', id);
    
    toast.success('Contrato atualizado!');
  };

  if (isLoading) return <Loading />;

  return (
    <ContractWizardModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      steps={steps}
      initialData={initialData}  // ⭐ Dados pré-preenchidos
      onSubmit={handleSubmit}
      title="⚡ Editar Contrato"
      submitButtonText="Atualizar Contrato"
    />
  );
}
```

## 🎯 Exemplo 3: Wizard Multi-Tipo (Residencial/Comercial)

```tsx
const [contractType, setContractType] = useState<'residencial' | 'comercial'>('residencial');

const residentialSteps = [
  {
    id: 'tipo',
    title: 'Tipo de Contrato',
    icon: Home,
    fields: [
      {
        name: 'tipoContrato',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'residencial', label: 'Residencial' },
          { value: 'comercial', label: 'Comercial' },
        ],
      },
    ],
  },
  // ... steps residenciais
];

const commercialSteps = [
  // ... steps comerciais
];

return (
  <ContractWizardModal
    steps={contractType === 'residencial' ? residentialSteps : commercialSteps}
    // ... outras props
  />
);
```

## 🎯 Exemplo 4: Validação Customizada

```tsx
// Hook customizado com validação específica
const useCustomWizard = (steps: FormStep[], initialData = {}) => {
  const wizard = useContractWizard(steps, initialData);
  
  // Validação customizada: CPF válido
  const validateCPF = (cpf: string) => {
    return cpf.length === 11; // Simplificado
  };
  
  // Override da validação padrão
  const isStepValidCustom = () => {
    if (wizard.currentStep === 2) { // Step de locatário
      const cpf = wizard.formData['cpfLocatario'];
      return wizard.isStepValid && validateCPF(cpf);
    }
    return wizard.isStepValid;
  };
  
  return {
    ...wizard,
    isStepValid: isStepValidCustom(),
  };
};
```

## 🎯 Exemplo 5: Campos Condicionais

```tsx
const steps: FormStep[] = [
  {
    id: 'fiador',
    title: 'Fiadores',
    icon: Shield,
    fields: [
      {
        name: 'temFiador',
        label: 'Possui fiador?',
        type: 'select',
        required: true,
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
      // Campo condicional
      ...(formData.temFiador === 'sim' ? [
        {
          name: 'nomeFiador',
          label: 'Nome do Fiador',
          type: 'text',
          required: true,
          placeholder: 'Nome completo',
        },
        {
          name: 'cpfFiador',
          label: 'CPF do Fiador',
          type: 'text',
          required: true,
          placeholder: '000.000.000-00',
        },
      ] : []),
    ],
  },
];
```

## 🎯 Exemplo 6: Preview antes de Submeter

```tsx
const [showPreview, setShowPreview] = useState(false);

const handlePreSubmit = (data: Record<string, string>) => {
  setFormDataPreview(data);
  setShowPreview(true);
};

const confirmSubmit = async () => {
  await handleSubmit(formDataPreview);
  setShowPreview(false);
};

return (
  <>
    <ContractWizardModal
      onSubmit={handlePreSubmit}  // Preview primeiro
      // ... outras props
    />
    
    {showPreview && (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <h2>Confirmar Dados</h2>
          <pre>{JSON.stringify(formDataPreview, null, 2)}</pre>
          <Button onClick={confirmSubmit}>Confirmar</Button>
        </DialogContent>
      </Dialog>
    )}
  </>
);
```

## 🎯 Exemplo 7: Salvamento Automático (Draft)

```tsx
import { useDebounce } from '@/hooks/useDebounce';

const AutoSaveWizard = () => {
  const { formData, ...wizard } = useContractWizard(steps);
  const debouncedData = useDebounce(formData, 2000); // 2s delay

  useEffect(() => {
    if (Object.keys(debouncedData).length > 0) {
      // Salvar como rascunho
      localStorage.setItem('contract_draft', JSON.stringify(debouncedData));
      toast.info('Rascunho salvo automaticamente');
    }
  }, [debouncedData]);

  return (
    <ContractWizardModal
      initialData={JSON.parse(localStorage.getItem('contract_draft') || '{}')}
      // ... outras props
    />
  );
};
```

## 🎯 Exemplo 8: Analytics de Progresso

```tsx
const WizardWithAnalytics = () => {
  const { currentStep, progress } = useContractWizard(steps);

  useEffect(() => {
    // Enviar evento de analytics
    analytics.track('Wizard Step Changed', {
      step: currentStep,
      progress: progress,
      timestamp: new Date(),
    });
  }, [currentStep]);

  return <ContractWizardModal /* ... */ />;
};
```

## 🎯 Exemplo 9: Múltiplos Wizards na Mesma Página

```tsx
const MultiWizardPage = () => {
  const [activeWizard, setActiveWizard] = useState<'contrato' | 'vistoria' | null>(null);

  return (
    <>
      <Button onClick={() => setActiveWizard('contrato')}>
        Novo Contrato
      </Button>
      <Button onClick={() => setActiveWizard('vistoria')}>
        Nova Vistoria
      </Button>

      <ContractWizardModal
        open={activeWizard === 'contrato'}
        onOpenChange={(open) => !open && setActiveWizard(null)}
        steps={contratoSteps}
        title="✨ Novo Contrato"
      />

      <ContractWizardModal
        open={activeWizard === 'vistoria'}
        onOpenChange={(open) => !open && setActiveWizard(null)}
        steps={vistoriaSteps}
        title="🔍 Nova Vistoria"
      />
    </>
  );
};
```

## 🎯 Exemplo 10: Integração com React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  numeroContrato: z.string().min(1, 'Campo obrigatório'),
  enderecoImovel: z.string().min(10, 'Endereço muito curto'),
});

const FormIntegration = () => {
  const { handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    // Dados validados pelo Zod
    await saveContract(data);
  });

  return (
    <ContractWizardModal
      onSubmit={onSubmit}
      // Exibir erros do React Hook Form
      // ... customização
    />
  );
};
```

## 📊 Comparação: Antes vs Depois

### ❌ Antes (DocumentFormWizard)
```tsx
// Layout tradicional de formulário
<DocumentFormWizard
  title="Cadastrar Contrato"
  description="Preencha os dados"
  steps={steps}
  template=""
  onGenerate={handleGenerate}
  onFormDataChange={handleFormChange}
/>
```

**Problemas:**
- Design simples sem identidade visual
- Navegação linear sem feedback visual
- Sem animações
- Difícil de saber em qual etapa está
- Experiência genérica

### ✅ Depois (ContractWizardModal)
```tsx
// Modal tecnológico com UX aprimorada
<ContractWizardModal
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
  steps={steps}
  initialData={formData}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  title="✨ Novo Contrato"
/>
```

**Melhorias:**
- ✨ Design futurista e profissional
- 🎮 Navegação intuitiva estilo gaming
- ⚡ Animações fluidas entre etapas
- 📊 Progress bar visual
- 🎯 Indicadores claros de progresso
- 💾 Preservação automática de dados
- ✅ Validação em tempo real
- 📱 Totalmente responsivo

## 🎨 Customização de Tema

```tsx
// Criar variante com tema diferente
const DarkWizardModal = styled(ContractWizardModal)`
  --primary-gradient: linear-gradient(to right, #8b5cf6, #ec4899);
  --border-color: rgba(139, 92, 246, 0.3);
  --glow-color: rgba(139, 92, 246, 0.5);
`;

// Uso
<DarkWizardModal
  // ... props normais
  className="purple-theme"
/>
```

## 🚀 Dicas de Performance

```tsx
// Lazy loading de steps pesados
const heavySteps = useMemo(() => {
  return steps.map(step => ({
    ...step,
    fields: step.fields.filter(f => shouldShowField(f)),
  }));
}, [dependencies]);

// Memoizar callbacks
const handleSubmit = useCallback(async (data) => {
  await saveContract(data);
}, []);

// Debounce em validações pesadas
const validateHeavy = useDebouncedCallback(
  async (value) => {
    const result = await expensiveValidation(value);
    return result;
  },
  500
);
```

## 🔐 Segurança

```tsx
// Sanitizar inputs antes de submeter
const handleSecureSubmit = async (data: Record<string, string>) => {
  const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
    // Remover scripts maliciosos
    acc[key] = DOMPurify.sanitize(value);
    return acc;
  }, {} as Record<string, string>);
  
  await saveContract(sanitizedData);
};
```

---

**💡 Dica:** Todos os exemplos preservam os dados entre navegações e validam campos obrigatórios automaticamente!
