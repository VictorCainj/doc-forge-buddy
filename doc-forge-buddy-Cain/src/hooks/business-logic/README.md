# Hooks de Business Logic - Exemplos de Uso

Este arquivo contém exemplos práticos de como utilizar os hooks de business logic implementados.

## 📋 Índice
- [Hooks de Contratos](#hooks-de-contratos)
- [Hooks de Vistoria](#hooks-de-vistoria)
- [Hooks de Documentos](#hooks-de-documentos)
- [Hooks de Performance](#hooks-de-performance)
- [Hooks de Analytics](#hooks-de-analytics)

---

## 🔗 Hooks de Contratos

### useContractLifecycle - Gerenciar ciclo de vida do contrato

```tsx
import { useContractLifecycle } from '@/hooks/business-logic';

function ContratoManager({ contractId }: { contractId: string }) {
  const {
    currentStatus,
    validationState,
    availableTransitions,
    changeStatus,
    canTransition,
    getStatusInfo
  } = useContractLifecycle(contractId, {
    autoRefresh: true,
    enableValidation: true,
    enableAudit: true
  });

  const handleStatusChange = async (newStatus: ContractStatus['status']) => {
    const success = await changeStatus(newStatus, {
      reason: 'Status atualizado via interface',
      force: false
    });
    
    if (success) {
      console.log('Status alterado com sucesso');
    }
  };

  return (
    <div>
      <h2>Status Atual: {getStatusInfo(currentStatus).label}</h2>
      <p>{getStatusInfo(currentStatus).description}</p>
      
      {availableTransitions.map(transition => (
        <button
          key={transition.to}
          onClick={() => handleStatusChange(transition.to)}
          disabled={!transition.isValid}
        >
          {transition.to}
        </button>
      ))}
    </div>
  );
}
```

### useContractMetrics - Calcular métricas e dashboards

```tsx
import { useContractMetrics } from '@/hooks/business-logic';

function ContratoDashboard() {
  const {
    metrics,
    kpis,
    chartData,
    filters,
    setFilters,
    exportData
  } = useContractMetrics({
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date()
    },
    status: ['active', 'draft']
  }, {
    refreshInterval: 300000, // 5 minutos
    calculateTrends: true,
    calculateProjections: true
  });

  return (
    <div>
      <div className="kpis">
        <div className="kpi">
          <h3>Total de Contratos</h3>
          <span>{metrics?.total}</span>
        </div>
        <div className="kpi">
          <h3>Taxa de Ativação</h3>
          <span>{kpis?.activationRate.toFixed(1)}%</span>
        </div>
        <div className="kpi">
          <h3>Receita Mensal</h3>
          <span>R$ {kpis?.monthlyRevenue.toLocaleString()}</span>
        </div>
      </div>

      {chartData && (
        <div className="charts">
          <StatusDistributionChart data={chartData.statusDistribution} />
          <MonthlyTrendsChart data={chartData.monthlyTrends} />
        </div>
      )}

      <button onClick={() => exportData('pdf')}>
        Exportar Relatório
      </button>
    </div>
  );
}
```

---

## 🔍 Hooks de Vistoria

### useVistoriaWorkflow - Gerenciar workflow de vistoria

```tsx
import { useVistoriaWorkflow } from '@/hooks/business-logic';

function VistoriaWorkflow({ vistoriaId }: { vistoriaId: string }) {
  const {
    vistoriaStatus,
    workflowSteps,
    currentStep,
    progress,
    nextSteps,
    completeStep,
    saveStepData,
    slaStatus
  } = useVistoriaWorkflow(vistoriaId, {
    autoSave: true,
    enableValidation: true,
    enableSLA: true
  });

  const handleStepComplete = async (stepData?: any) => {
    const success = await completeStep(stepData);
    if (success) {
      console.log('Passo concluído com sucesso');
    }
  };

  return (
    <div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {workflowSteps?.map(step => (
        <div 
          key={step.id}
          className={`step ${step.isActive ? 'active' : ''} ${
            step.isCompleted ? 'completed' : ''
          }`}
        >
          <h3>{step.name}</h3>
          <p>{step.description}</p>
          
          {step.isActive && (
            <div className="step-content">
              {/* Renderizar conteúdo do passo */}
              <button onClick={() => handleStepComplete()}>
                Completar Passo
              </button>
            </div>
          )}
        </div>
      ))}

      {slaStatus && (
        <div className="sla-info">
          <p>SLA: {slaStatus.remainingHours}h restantes</p>
          <p>Status: {slaStatus.isOverdue ? 'Vencido' : 'Dentro do prazo'}</p>
        </div>
      )}
    </div>
  );
}
```

### useApontamentoManager - Gerenciar apontamentos

```tsx
import { useApontamentoManager } from '@/hooks/business-logic';

function ApontamentosManager({ vistoriaId }: { vistoriaId: string }) {
  const {
    apontamentos,
    categorias,
    stats,
    filter,
    setFilter,
    createApontamento,
    updateApontamento,
    deleteApontamento,
    exportData
  } = useApontamentoManager(vistoriaId);

  const handleCreateApontamento = async (data: Partial<Apontamento>) => {
    await createApontamento({
      ...data,
      vistoriaId,
      categoria: data.categoria!,
      severidade: 'media',
      status: 'aberto',
      dataIdentificacao: new Date()
    });
  };

  const handleStatusUpdate = async (id: string, status: Apontamento['status']) => {
    await updateApontamento(id, { status });
  };

  return (
    <div>
      <div className="filters">
        <select 
          value={filter.severidades?.[0] || ''}
          onChange={(e) => setFilter({ 
            severidades: e.target.value ? [e.target.value as Apontamento['severidade']] : undefined 
          })}
        >
          <option value="">Todas as Severidades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      <div className="stats">
        <div>Total: {stats?.total}</div>
        <div>Críticos: {stats?.porSeveridade.critica}</div>
        <div>Resolvidos: {stats?.porStatus.resolvido}</div>
      </div>

      <div className="apontamentos-list">
        {apontamentos?.map(apontamento => (
          <div key={apontamento.id} className="apontamento-card">
            <h4>{apontamento.titulo}</h4>
            <p>{apontamento.descricao}</p>
            <div className="meta">
              <span className={`severidade ${apontamento.severidade}`}>
                {apontamento.severidade}
              </span>
              <span className={`status ${apontamento.status}`}>
                {apontamento.status}
              </span>
            </div>
            <button onClick={() => handleStatusUpdate(apontamento.id, 'resolvido')}>
              Marcar como Resolvido
            </button>
            <button onClick={() => deleteApontamento(apontamento.id)}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => exportData('pdf')}>
        Exportar Apontamentos
      </button>
    </div>
  );
}
```

---

## 📄 Hooks de Documentos

### useDocumentGeneration - Geração de documentos

```tsx
import { useDocumentGeneration } from '@/hooks/business-logic';

function DocumentoForm({ template }: { template: DocumentTemplate }) {
  const {
    documentData,
    generatedDocument,
    validationErrors,
    updateDocumentData,
    generate,
    download,
    completionStats
  } = useDocumentGeneration(template, {
    autoPreview: true,
    validateData: true,
    outputQuality: 'high'
  });

  const handleFieldChange = (fieldId: string, value: any) => {
    updateDocumentData({ [fieldId]: value });
  };

  const handleGenerate = async () => {
    const result = await generate();
    if (result.success) {
      console.log('Documento gerado com sucesso');
    }
  };

  return (
    <div>
      <div className="completion-bar">
        <div 
          className="completion-fill"
          style={{ width: `${completionStats().percentage}%` }}
        />
        <span>{completionStats().filled}/{completionStats().total} campos</span>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
        {template.fields.map(field => (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            
            <input
              type={field.type}
              value={documentData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
            
            {validationErrors[field.id] && (
              <div className="errors">
                {validationErrors[field.id].map(error => (
                  <span key={error}>{error}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <button 
          type="submit" 
          disabled={validationErrors.length > 0}
        >
          Gerar Documento
        </button>
      </form>

      {generatedDocument && (
        <div className="document-preview">
          <iframe src={generatedDocument.preview?.url} />
          <button onClick={() => download()}>
            Baixar Documento
          </button>
        </div>
      )}
    </div>
  );
}
```

### useDocumentHistory - Histórico e versionamento

```tsx
import { useDocumentHistory } from '@/hooks/business-logic';

function DocumentHistory({ entityId }: { entityId: string }) {
  const {
    historyData,
    versions,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    calculateDiff,
    exportHistory
  } = useDocumentHistory(entityId);

  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);

  const handleVersionDiff = (fromVersion: number, toVersion: number) => {
    setSelectedVersions([fromVersion, toVersion]);
  };

  const diff = selectedVersions ? calculateDiff(selectedVersions[0], selectedVersions[1]) : null;

  return (
    <div>
      <div className="controls">
        <select 
          value={filters.actions?.[0] || ''}
          onChange={(e) => setFilters({ 
            actions: e.target.value ? [e.target.value as DocumentAction] : undefined 
          })}
        >
          <option value="">Todas as Ações</option>
          <option value="created">Criado</option>
          <option value="updated">Atualizado</option>
          <option value="generated">Gerado</option>
          <option value="downloaded">Baixado</option>
        </select>

        <div className="view-mode">
          <button 
            className={viewMode === 'timeline' ? 'active' : ''}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
          <button 
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            Tabela
          </button>
        </div>
      </div>

      {diff && (
        <div className="diff-view">
          <h3>Diferenças entre Versões</h3>
          <div className="diff-summary">
            <p>Total de mudanças: {diff.summary.totalChanges}</p>
            <p>Mudanças críticas: {diff.summary.criticalChanges}</p>
          </div>
          
          {diff.added.length > 0 && (
            <div className="diff-section added">
              <h4>Adicionado</h4>
              {diff.added.map((change, i) => (
                <div key={i}>{change.field}: {String(change.newValue)}</div>
              ))}
            </div>
          )}
          
          {diff.modified.length > 0 && (
            <div className="diff-section modified">
              <h4>Modificado</h4>
              {diff.modified.map((change, i) => (
                <div key={i}>
                  {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="history-timeline">
        {historyData?.entries.map(entry => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="action">{entry.formattedAction}</span>
                <span className="time">{entry.formattedTime}</span>
                <span className={`status ${entry.status}`}>{entry.status}</span>
              </div>
              <div className="timeline-details">
                <p>{entry.details.reason || 'Sem motivo'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => exportHistory('pdf')}>
        Exportar Histórico
      </button>
    </div>
  );
}
```

---

## ⚡ Hooks de Performance

### useOptimisticUpdate - Updates otimistas

```tsx
import { useOptimisticUpdate } from '@/hooks/business-logic';

function ContratoItem({ contrato }: { contrato: Contrato }) {
  const {
    data: contratoData,
    update,
    isUpdating,
    canRollback,
    rollback
  } = useOptimisticUpdate(
    `contrato-${contrato.id}`,
    (old) => old,
    {
      queryKey: ['contratos'],
      rollbackTimeout: 10000,
      onSuccess: (data) => {
        console.log('Contrato atualizado com sucesso');
      },
      onError: (error) => {
        console.error('Erro na atualização:', error);
      }
    }
  );

  const handleFavorite = async () => {
    await update((current) => ({
      ...current,
      isFavorite: !current.isFavorite
    }));
  };

  const handleStatusChange = async (newStatus: string) => {
    await update((current) => ({
      ...current,
      status: newStatus
    }));
  };

  if (!contratoData) return <div>Carregando...</div>;

  return (
    <div className="contrato-item">
      <h3>{contratoData.title}</h3>
      <p>Status: {contratoData.status}</p>
      
      <div className="actions">
        <button 
          onClick={handleFavorite}
          disabled={isUpdating}
        >
          {contratoData.isFavorite ? '❤️' : '🤍'}
        </button>
        
        <select 
          value={contratoData.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
        >
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
          <option value="terminated">Rescindido</option>
        </select>
      </div>

      {canRollback && (
        <button onClick={rollback} className="rollback-btn">
          Desfazer Alteração
        </button>
      )}
    </div>
  );
}
```

### useBackgroundSync - Sincronização em background

```tsx
import { useBackgroundSync } from '@/hooks/business-logic';

function DataManager() {
  const {
    isOnline,
    isSyncing,
    localEntities,
    pendingChanges,
    stats,
    triggerSync,
    addPendingChange,
    clearPendingChanges,
    canSync,
    hasPendingChanges
  } = useBackgroundSync('contratos', {
    enableOptimistic: true,
    enableOffline: true,
    autoSyncInterval: 30000,
    conflictResolution: 'manual'
  });

  const handleOfflineUpdate = async (changes: any) => {
    // Simular update offline
    addPendingChange(changes);
    console.log('Alteração salva offline');
  };

  return (
    <div>
      <div className="sync-status">
        <div className={`status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
        
        <div className="sync-indicator">
          {isSyncing ? '🔄 Sincronizando...' : '✅ Sincronizado'}
        </div>
      </div>

      <div className="stats">
        <div>Entidades: {stats.totalEntities}</div>
        <div>Sincronizadas: {stats.syncedEntities}</div>
        <div>Pendentes: {stats.pendingEntities}</div>
        <div>Com conflitos: {stats.conflictingEntities}</div>
      </div>

      {hasPendingChanges && (
        <div className="pending-changes">
          <h4>Alterações Pendentes ({pendingChanges.length})</h4>
          <ul>
            {pendingChanges.map((change, index) => (
              <li key={index}>{JSON.stringify(change)}</li>
            ))}
          </ul>
          <button onClick={clearPendingChanges}>
            Limpar Alterações
          </button>
        </div>
      )}

      <button 
        onClick={triggerSync} 
        disabled={!canSync}
      >
        Sincronizar Agora
      </button>
    </div>
  );
}
```

---

## 📊 Hooks de Analytics

### useUserActivity - Rastreamento de atividade

```tsx
import { useUserActivity } from '@/hooks/business-logic';

function AnalyticsDashboard() {
  const {
    stats,
    activities,
    userJourneys,
    filters,
    setFilters,
    trackPageView,
    trackClick,
    trackConversion,
    exportData
  } = useUserActivity();

  useEffect(() => {
    // Rastrear visualização da página
    trackPageView('/dashboard');
  }, [trackPageView]);

  const handleButtonClick = (buttonName: string) => {
    trackClick(buttonName, window.location.pathname);
  };

  const handleContractCreated = () => {
    trackConversion('contract_created', 1000, {
      contractType: 'residential'
    });
  };

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Usuários Ativos</h3>
          <span className="value">{stats?.activeUsers}</span>
        </div>
        <div className="metric-card">
          <h3>Sessões</h3>
          <span className="value">{stats?.sessionsCount}</span>
        </div>
        <div className="metric-card">
          <h3>Taxa de Conversão</h3>
          <span className="value">
            {((stats?.conversionRate || 0) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="metric-card">
          <h3>Tempo Médio de Sessão</h3>
          <span className="value">
            {Math.round((stats?.avgSessionDuration || 0) / 60000)}min
          </span>
        </div>
      </div>

      <div className="activity-chart">
        <h3>Atividade por Hora</h3>
        {/* Renderizar gráfico de atividade */}
        <div className="hourly-activity">
          {stats?.hourlyActivity.map(hour => (
            <div key={hour.hour} className="hour-bar">
              <div 
                className="bar"
                style={{ height: `${(hour.activity / 50) * 100}%` }}
              />
              <span className="hour">{hour.hour}:00</span>
            </div>
          ))}
        </div>
      </div>

      <div className="top-pages">
        <h3>Páginas Mais Visitadas</h3>
        <ul>
          {stats?.topPages.map(page => (
            <li key={page.page}>
              {page.page} - {page.views} visualizações
            </li>
          ))}
        </ul>
      </div>

      <div className="recent-activities">
        <h3>Atividades Recentes</h3>
        <ul>
          {activities?.slice(0, 10).map(activity => (
            <li key={activity.id}>
              <span className="action">{activity.action}</span>
              <span className="page">{activity.resource.name}</span>
              <span className="time">
                {format(new Date(activity.timestamp), 'HH:mm')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => exportData('csv')}>
        Exportar Dados
      </button>
    </div>
  );
}
```

### usePerformanceMetrics - Métricas de performance

```tsx
import { usePerformanceMetrics } from '@/hooks/business-logic';

function PerformanceMonitor() {
  const {
    webVitals,
    currentMetrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resolveAlert,
    getOverallScore
  } = usePerformanceMetrics();

  return (
    <div>
      <div className="monitoring-controls">
        <button 
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
        >
          {isMonitoring ? 'Parar Monitoramento' : 'Iniciar Monitoramento'}
        </button>
        
        <div className="overall-score">
          <h3>Score Geral</h3>
          <span className={`score ${getOverallScore() >= 80 ? 'good' : 'poor'}`}>
            {getOverallScore()}/100
          </span>
        </div>
      </div>

      {webVitals && (
        <div className="web-vitals">
          <h3>Web Vitals</h3>
          <div className="vitals-grid">
            <div className="vital">
              <label>LCP</label>
              <span className={`value ${(webVitals.lcp || 0) < 2500 ? 'good' : 'poor'}`}>
                {(webVitals.lcp || 0).toFixed(0)}ms
              </span>
            </div>
            <div className="vital">
              <label>FID</label>
              <span className={`value ${(webVitals.fid || 0) < 100 ? 'good' : 'poor'}`}>
                {(webVitals.fid || 0).toFixed(0)}ms
              </span>
            </div>
            <div className="vital">
              <label>CLS</label>
              <span className={`value ${(webVitals.cls || 0) < 0.1 ? 'good' : 'poor'}`}>
                {(webVitals.cls || 0).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="alerts">
        <h3>Alertas Ativos</h3>
        {alerts.length === 0 ? (
          <p>Nenhum alerta ativo</p>
        ) : (
          <ul>
            {alerts.map(alert => (
              <li key={alert.id} className={`alert ${alert.severity}`}>
                <div className="alert-content">
                  <h4>{alert.metricName}</h4>
                  <p>{alert.message}</p>
                  <span className="time">
                    {format(new Date(alert.timestamp), 'HH:mm:ss')}
                  </span>
                </div>
                <button onClick={() => resolveAlert(alert.id)}>
                  Resolver
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="current-metrics">
        <h3>Métricas Atuais</h3>
        <div className="metrics-list">
          {currentMetrics.slice(0, 10).map(metric => (
            <div key={metric.id} className="metric">
              <span className="name">{metric.name}</span>
              <span className="value">
                {metric.value}{metric.unit}
              </span>
              <span className={`trend ${metric.trend}`}>
                {metric.trend === 'improving' ? '↗️' : 
                 metric.trend === 'degrading' ? '↘️' : '➡️'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 💡 Dicas de Implementação

### 1. Configuração de Query Client
Certifique-se de configurar o React Query para usar os hooks de business logic:

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### 2. Error Handling
Sempre trate erros nos hooks:

```tsx
try {
  const result = await someBusinessLogicHook();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Business logic error:', error);
}
```

### 3. Performance
Para melhor performance, considere:
- Usar `useMemo` para cálculos pesados
- Implementar lazy loading para componentes grandes
- Usar `useCallback` para funções que são passadas como props
- Configurar appropriate `refetchInterval` para dados em tempo real

### 4. Testing
Teste os hooks de business logic:

```tsx
// Exemplo de teste
import { renderHook, act } from '@testing-library/react';
import { useContractLifecycle } from '@/hooks/business-logic';

test('should change contract status', async () => {
  const { result } = renderHook(() => 
    useContractLifecycle('contract-123')
  );

  await act(async () => {
    const success = await result.current.changeStatus('active');
    expect(success).toBe(true);
  });

  expect(result.current.currentStatus).toBe('active');
});
```

---

## 🚀 Conclusão

Estes hooks de business logic fornecem uma base sólida para gerenciar:

- **Contratos**: Ciclo de vida, métricas e validações
- **Vistoria**: Workflows, apontamentos e progresso
- **Documentos**: Geração, histórico e versionamento
- **Performance**: Updates otimistas e sincronização
- **Analytics**: Atividade do usuário e métricas de performance

Cada hook é projetado para ser:
- **Tipado**: Totalmente tipado com TypeScript
- **Reativo**: Usa React Query para gerenciamento de estado
- **Configurável**: Aceita opções de configuração flexíveis
- **Otimizado**: Implementa best practices de performance
- **Robusto**: Inclui error handling e fallbacks