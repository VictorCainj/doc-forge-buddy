/**
 * @fileoverview Exemplos Práticos de Uso das APIs
 * @description Guia completo com exemplos práticos para todas as funcionalidades implementadas
 * @version 1.0.0
 * @author Doc Forge Buddy Team
 */

# Exemplos Práticos de Uso - Doc Forge Buddy

## Índice
1. [Sistema de Autenticação](#sistema-de-autenticação)
2. [Gerenciamento de Contratos](#gerenciamento-de-contratos)
3. [Sistema de Vistoria](#sistema-de-vistoria)
4. [Notificações](#notificações)
5. [Services Layer](#services-layer)
6. [Hooks Personalizados](#hooks-personalizados)
7. [Gerenciamento de Estado](#gerenciamento-de-estado)
8. [Supabase Edge Functions](#supabase-edge-functions)

---

## Sistema de Autenticação

### Login e Logout

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const { user, signIn, signOut, loading } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Erro de login:', error.message);
      // Tratamento específico por tipo de erro
      switch (error.type) {
        case 'INVALID_CREDENTIALS':
          alert('Email ou senha incorretos');
          break;
        case 'EMAIL_NOT_CONFIRMED':
          alert('Por favor, verifique seu email antes de fazer login');
          break;
        case 'NETWORK_ERROR':
          alert('Erro de conexão. Verifique sua internet.');
          break;
      }
    } else {
      console.log('Login realizado com sucesso');
    }
  };
  
  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      console.log('Logout realizado');
    }
  };
  
  return (
    <div>
      {user ? (
        <div>
          <p>Bem-vindo, {user.email}</p>
          <button onClick={handleLogout}>Sair</button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Senha" required />
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      )}
    </div>
  );
}
```

### Context de Autenticação

```typescript
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}
```

---

## Gerenciamento de Contratos

### Criar e Buscar Contratos

```typescript
import { useContractService, createContractService } from '@/services';

function ContractManager() {
  const contractService = useContractService();
  const { data: contracts, isLoading } = useContractsQuery();
  
  const createNewContract = async () => {
    const contractData = {
      title: 'Contrato 001',
      form_data: {
        numeroContrato: '001',
        nomeLocatario: 'João Silva',
        nomeProprietario: 'Maria Santos',
        enderecoImovel: 'Rua A, 123',
        dataFirmamentoContrato: '2025-01-01'
      },
      document_type: 'Termo do Locador',
      content: '<html>...document content...</html>'
    };
    
    try {
      const contract = await contractService.createContract(contractData);
      console.log('Contrato criado:', contract);
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
    }
  };
  
  const searchContracts = async (filters: ContractFilters) => {
    const result = await contractService.getContracts(filters);
    console.log('Contratos encontrados:', result);
  };
  
  return (
    <div>
      <button onClick={createNewContract}>
        Criar Contrato
      </button>
      
      <ContractFilters onFilter={searchContracts} />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ContractList contracts={contracts} />
      )}
    </div>
  );
}
```

### Filtros Avançados

```typescript
const filters: ContractFilters = {
  status: 'active',
  documentType: 'Termo do Locador',
  propertyAddress: 'Rua das Flores',
  clientName: 'João',
  dateRange: {
    start: '2025-01-01',
    end: '2025-12-31'
  },
  tags: ['importante', 'urgente'],
  isFavorite: false
};

const result = await contractService.getContracts(filters);
```

### Gerenciar Favoritos e Tags

```typescript
function ContractCard({ contract }: { contract: Contract }) {
  const { addFavorite, removeFavorite, addTag, removeTag } = useContractActions(contract.id);
  
  const handleFavorite = async () => {
    if (contract.isFavorite) {
      await removeFavorite();
    } else {
      await addFavorite();
    }
  };
  
  const handleTag = async (tag: string) => {
    if (contract.tags.includes(tag)) {
      await removeTag(tag);
    } else {
      await addTag(tag);
    }
  };
  
  return (
    <div className="contract-card">
      <h3>{contract.title}</h3>
      <button onClick={handleFavorite}>
        {contract.isFavorite ? '⭐' : '☆'}
      </button>
      <div className="tags">
        {contract.tags.map(tag => (
          <span key={tag} onClick={() => handleTag(tag)}>
            {tag} ×
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## Sistema de Vistoria

### Análise de Vistoria com IA

```typescript
import { useVistoriaAnalyses } from '@/hooks/business-logic/vistoria';

function VistoriaAnalyzer() {
  const { analyzeVistoria, processImages } = useVistoriaAnalises();
  
  const handleImageUpload = async (files: FileList) => {
    const images = Array.from(files);
    
    // Processar imagens com IA
    const analyses = await processImages(images);
    
    analyses.forEach(analysis => {
      console.log('Análise da imagem:', {
        ambiente: analysis.ambiente,
        problemaDetectado: analysis.problema,
        classificacao: analysis.classificacao,
        confianca: analysis.confianca
      });
    });
  };
  
  const analyzeCompleteVistoria = async (vistoria: VistoriaAnalise) => {
    const result = await analyzeVistoria(vistoria);
    
    console.log('Relatório completo:', {
      problemasEncontrados: result.problemas,
      classificacoes: result.classificacoes,
      orcamentos: result.orcamentos,
      recomendacoes: result.recomendacoes
    });
  };
  
  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
      />
      
      <button onClick={() => analyzeCompleteVistoria(vistoriaData)}>
        Analisar Vistoria Completa
      </button>
    </div>
  );
}
```

### Criar Apontamentos

```typescript
import { useApontamentoManager } from '@/hooks/business-logic/vistoria';

function ApontamentoForm() {
  const { addApontamento, updateApontamento } = useApontamentoManager(vistoriaId);
  
  const handleCreateApontamento = async (data: Partial<ApontamentoVistoria>) => {
    const newApontamento: ApontamentoVistoria = {
      id: generateId(),
      ambiente: data.ambiente!,
      subtitulo: data.subtitulo!,
      descricao: data.descricao!,
      vistoriaInicial: {
        fotos: [],
        descritivoLaudo: data.descritivoLaudo
      },
      vistoriaFinal: {
        fotos: []
      },
      observacao: data.observacao || '',
      classificacao: 'responsabilidade',
      tipo: 'material',
      valor: 0,
      quantidade: 1,
      unidade: 'unidade'
    };
    
    await addApontamento(newApontamento);
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleCreateApontamento(Object.fromEntries(formData));
    }}>
      <input name="ambiente" placeholder="Ambiente" required />
      <input name="subtitulo" placeholder="Subtítulo" required />
      <textarea name="descricao" placeholder="Descrição" required />
      <input name="observacao" placeholder="Observação" />
      <button type="submit">Adicionar Apontamento</button>
    </form>
  );
}
```

---

## Notificações

### Sistema de Notificações

```typescript
import { useNotifications, createNotificationService } from '@/services';

function NotificationCenter() {
  const { 
    notifications, 
    unreadCount,
    markAsRead, 
    markAllAsRead,
    clearReadNotifications 
  } = useNotifications();
  
  const sendCustomNotification = async () => {
    const notificationService = createNotificationService();
    
    await notificationService.createPush(userId, 'Novo Contrato', 'Um novo contrato foi criado');
    await notificationService.sendEmail(
      'user@email.com',
      'Confirmação de Contrato',
      'Seu contrato foi criado com sucesso.'
    );
  };
  
  return (
    <div className="notification-center">
      <div className="header">
        <h3>Notificações</h3>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
        <button onClick={markAllAsRead}>
          Marcar todas como lidas
        </button>
      </div>
      
      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${!notification.read ? 'unread' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <small>{formatDate(notification.created_at)}</small>
            </div>
            {notification.priority === 'high' && (
              <span className="priority-badge">Alta</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Notificações em Tempo Real

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

function RealTimeNotifications() {
  useEffect(() => {
    // Assinar mudanças na tabela de notificações
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Nova notificação:', payload.new);
          // Mostrar toast, atualizar estado, etc.
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);
  
  return <NotificationCenter />;
}
```

---

## Services Layer

### Injeção de Dependência

```typescript
import { 
  createDefaultServiceContainer,
  createContractService,
  createNotificationService 
} from '@/services';

// Criar container personalizado
const container = createDefaultServiceContainer();

// Registrar services personalizados
container.register('CustomContractService', createContractService());
container.register('CustomNotificationService', createNotificationService());

// Usar services
const contractService = container.get('CustomContractService');
const notificationService = container.get('CustomNotificationService');

// Ou usar factory functions diretamente
const contractService = createContractService({
  enableMetrics: true,
  enableCache: true,
  cacheTTL: 300000
});
```

### Padrão Repository

```typescript
import { BaseRepository } from '@/repositories/BaseRepository';

class ContractRepository extends BaseRepository<Contract, CreateContractData> {
  protected tableName = 'contracts';
  
  async findByClientEmail(email: string): Promise<Contract[]> {
    return this.db
      .from(this.tableName)
      .select('*')
      .eq('client_email', email)
      .order('created_at', { ascending: false });
  }
  
  async findExpiring(days: number = 30): Promise<Contract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.db
      .from(this.tableName)
      .select('*')
      .eq('status', 'active')
      .lt('end_date', futureDate.toISOString())
      .order('end_date', { ascending: true });
  }
}

// Uso
const contractRepo = new ContractRepository();
const expiringContracts = await contractRepo.findExpiring(30);
```

---

## Hooks Personalizados

### Hook de Performance

```typescript
import { usePerformanceMonitor } from '@/hooks/performance';

function HeavyComponent() {
  usePerformanceMonitor('HeavyComponent');
  
  // Componente que faz operações pesadas
  return (
    <div>
      {/* Conteúdo pesado */}
    </div>
  );
}

// Hook com métricas customizadas
function useComponentMetrics(componentName: string) {
  const startTime = performance.now();
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Enviar métricas para analytics
    analytics.track('component_render_time', {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    });
  });
  
  return { renderTime: performance.now() - startTime };
}
```

### Hook de Validação

```typescript
import { useValidation } from '@/services';

function ContractForm() {
  const { validateContract, getValidationErrors } = useValidation();
  
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const handleSubmit = async (data: ContractFormData) => {
    const validation = validateContract(data);
    
    if (!validation.isValid) {
      const validationErrors = getValidationErrors(validation);
      setErrors(validationErrors);
      return;
    }
    
    // Continuar com submissão
    try {
      const contractService = createContractService();
      await contractService.createContract({
        title: 'Novo Contrato',
        form_data: data,
        document_type: 'Termo do Locador',
        content: '...'
      });
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      {errors.map(error => (
        <div key={error.field} className="error">
          {error.message}
        </div>
      ))}
      {/* Campos do formulário */}
    </form>
  );
}
```

---

## Gerenciamento de Estado

### Store Global

```typescript
import { useAppStore } from '@/stores/appStore';

function Dashboard() {
  const {
    contracts,
    notifications,
    user,
    theme,
    addContract,
    updateContract,
    markNotificationAsRead,
    toggleTheme
  } = useAppStore();
  
  // Estado sincronizado automaticamente
  console.log('Total de contratos:', contracts.length);
  console.log('Notificações não lidas:', notifications.filter(n => !n.read).length);
  
  return (
    <div className={`dashboard ${theme.mode}`}>
      <div className="stats">
        <StatCard title="Contratos" value={contracts.length} />
        <StatCard 
          title="Notificações" 
          value={notifications.filter(n => !n.read).length} 
        />
      </div>
      
      <div className="actions">
        <button onClick={toggleTheme}>
          Alternar Tema ({theme.mode})
        </button>
      </div>
    </div>
  );
}
```

### Persistência de Estado

```typescript
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  contracts: Contract[];
  addContract: (contract: Contract) => void;
  // ...
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      contracts: [],
      addContract: (contract) => set((state) => ({
        contracts: [...state.contracts, contract]
      })),
      // ...
    }),
    {
      name: 'app-storage', // nome da chave no localStorage
      partialize: (state) => ({ 
        contracts: state.contracts.slice(0, 100) // apenas os últimos 100
      }),
    }
  )
);
```

---

## Supabase Edge Functions

### Chamar Edge Function

```typescript
import { supabase } from '@/integrations/supabase/client';

// Criar usuário admin
const createAdminUser = async (email: string, password: string) => {
  const { data, error } = await supabase.functions.invoke('create-admin-user', {
    body: {
      email,
      password,
      role: 'admin'
    }
  });
  
  if (error) {
    console.error('Erro ao criar admin:', error);
    return;
  }
  
  console.log('Admin criado:', data);
};

// Enviar email
const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject,
      htmlContent,
      fromEmail: 'DocForge <noreply@seudominio.com>'
    }
  });
  
  if (error) {
    console.error('Erro ao enviar email:', error);
    return;
  }
  
  console.log('Email enviado:', data.messageId);
};

// Analytics de prompt
const trackPromptUsage = async (promptType: string, success: boolean) => {
  const { data, error } = await supabase.functions.invoke('prompt-analytics', {
    body: {
      action: 'track_usage',
      promptType,
      success,
      timestamp: new Date().toISOString()
    }
  });
  
  if (error) {
    console.error('Erro ao rastrear prompt:', error);
  }
};
```

### Edge Function com Real-time

```typescript
// Na Edge Function
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    // Processar dados
    const result = await processData(data);
    
    // Enviar para real-time channel
    await supabase.channel('updates')
      .send({
        type: 'broadcast',
        event: type,
        payload: result
      });
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
```

---

## Casos de Uso Completos

### Fluxo Completo: Criar Contrato com Vistoria

```typescript
async function createContractWithVistoria(contractData: CreateContractData) {
  try {
    const contractService = createContractService();
    
    // 1. Criar contrato
    const contract = await contractService.createContract(contractData);
    
    // 2. Agendar vistoria
    const vistoriaData: CreateVistoriaData = {
      title: `Vistoria - ${contract.title}`,
      contract_id: contract.id,
      dados_vistoria: {
        locatario: contract.form_data.nomeLocatario || '',
        endereco: contract.form_data.enderecoImovel || '',
        dataVistoria: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 dias
        tipoVistoria: 'inicial'
      },
      apontamentos: []
    };
    
    const vistoriaService = createVistoriaService();
    const vistoria = await vistoriaService.createVistoria(vistoriaData);
    
    // 3. Enviar notificações
    const notificationService = createNotificationService();
    
    // Notificação para o usuário
    await notificationService.createPush(
      contract.user_id,
      'Contrato Criado',
      `O contrato ${contract.title} foi criado com sucesso. Vistoria agendada para ${formatDate(vistoriaData.dados_vistoria.dataVistoria)}`
    );
    
    // Email de confirmação
    await notificationService.sendEmail(
      contract.form_data.emailLocatario || '',
      'Confirmação de Contrato',
      generateConfirmationEmailHTML(contract, vistoria)
    );
    
    return { contract, vistoria };
  } catch (error) {
    console.error('Erro no fluxo completo:', error);
    throw error;
  }
}
```

### Fluxo Completo: Análise de Vistoria

```typescript
async function processVistoriaAnalysis(vistoriaId: string) {
  try {
    const vistoriaService = createVistoriaService();
    const analysisService = createAnalysisService();
    
    // 1. Buscar vistoria
    const vistoria = await vistoriaService.getVistoria(vistoriaId);
    
    // 2. Analisar apontamentos
    const analysis = await analysisService.analyzeVistoria(vistoria);
    
    // 3. Processar imagens com IA
    const imageAnalyses = await Promise.all(
      vistoria.apontamentos.flatMap(apontamento => [
        ...apontamento.vistoriaInicial.fotos,
        ...apontamento.vistoriaFinal.fotos
      ]).map(image => analysisService.processImage(image))
    );
    
    // 4. Gerar relatório
    const report = analysisService.generateReport({
      vistoria,
      analysis,
      imageAnalyses
    });
    
    // 5. Enviar resultados
    const notificationService = createNotificationService();
    await notificationService.createPush(
      vistoria.user_id,
      'Análise de Vistoria Concluída',
      `A análise da vistoria "${vistoria.title}" foi concluída. ${analysis.problemasEncontrados.length} problemas encontrados.`
    );
    
    // 6. Salvar resultados
    await vistoriaService.updateVistoria(vistoriaId, {
      analysisResults: report,
      completedAt: new Date().toISOString()
    });
    
    return report;
  } catch (error) {
    console.error('Erro na análise de vistoria:', error);
    throw error;
  }
}
```

---

## Dicas e Boas Práticas

### Error Handling

```typescript
import { parseAuthError, parseDatabaseError } from '@/types/domain/auth';

try {
  await someOperation();
} catch (error) {
  // Tentar diferentes parsers de erro
  const authError = parseAuthError(error);
  if (authError.message !== 'Erro inesperado. Tente novamente.') {
    // Tratar erro de auth específico
    return;
  }
  
  const dbError = parseDatabaseError(error);
  if (dbError.message !== 'Erro inesperado no banco de dados') {
    // Tratar erro de banco específico
    return;
  }
  
  // Erro genérico
  console.error('Erro não tratado:', error);
}
```

### Performance

```typescript
// Usar React Query para cache
const { data: contracts, isLoading } = useContractsQuery(filters, {
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
  refetchOnWindowFocus: false
});

// Memoização estratégica
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(contracts);
}, [contracts]);

// Virtualização para listas grandes
const { virtualItems, totalSize } = useVirtual({
  size: contracts.length,
  estimateSize: 50
});
```

### TypeScript

```typescript
// Usar type guards
function isContract(obj: unknown): obj is Contract {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'form_data' in obj;
}

// Usar utility types
type PartialContract = Partial<Contract>;
type ContractUpdate = Optional<Contract, 'id' | 'created_at'>;

// Validação runtime
const contractSchema = z.object({
  title: z.string().min(1),
  form_data: z.object({
    numeroContrato: z.string(),
    nomeLocatario: z.string()
  })
});

const validatedContract = contractSchema.parse(rawContractData);
```