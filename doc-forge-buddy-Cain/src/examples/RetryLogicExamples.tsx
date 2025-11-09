/**
 * Exemplos Práticos do Sistema de Retry Logic e Error Handling
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useRetryLogic, 
  useRetryableMutation, 
  useCircuitBreaker,
  useFallbackStrategy,
  useRetryMonitoring,
  usePredefinedStrategies
} from '@/hooks/useRetryLogic';
import { 
  withRetry, 
  ErrorType, 
  NetworkError,
  CircuitBreakerError 
} from '@/lib/retry-system';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  Shield,
  Database,
  Globe
} from 'lucide-react';

// ===========================================
// 1. EXEMPLO BÁSICO - USE RETRY LOGIC
// ===========================================

export function BasicRetryExample() {
  const [requestCount, setRequestCount] = useState(0);
  
  const { data, error, isLoading, execute, canRetry, reset } = useRetryLogic(
    async () => {
      setRequestCount(prev => prev + 1);
      
      // Simular operação que pode falhar
      const shouldFail = Math.random() < 0.3; // 30% chance of failure
      
      if (shouldFail) {
        throw new NetworkError('Network connection failed');
      }
      
      return {
        id: Date.now(),
        message: 'Operation successful!',
        attempt: requestCount + 1,
        timestamp: new Date().toISOString()
      };
    },
    {
      maxAttempts: 3,
      backoffMultiplier: 2,
      maxBackoffTime: 10000,
      retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT],
      circuitBreaker: true,
      timeout: 5000,
      jitter: true
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Exemplo Básico - Retry Logic
        </CardTitle>
        <CardDescription>
          Demonstração de retry automático com exponential backoff
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Attempt:</p>
            <p className="text-xl font-bold">{requestCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status:</p>
            {isLoading && <Badge variant="secondary">Carregando...</Badge>}
            {data && <Badge variant="default">Sucesso</Badge>}
            {error && <Badge variant="destructive">Erro</Badge>}
          </div>
        </div>

        {data && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sucesso!</strong> Dados recebidos após {data.attempt} tentativa(s)
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error.message}
              {canRetry && <span className="ml-2 text-yellow-600">(Pode tentar novamente)</span>}
              {!canRetry && <span className="ml-2 text-red-600">(Não retryable)</span>}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button onClick={execute} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Executar
          </Button>
          <Button onClick={reset} variant="outline" disabled={isLoading}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================
// 2. EXEMPLO - CIRCUIT BREAKER
// ===========================================

export function CircuitBreakerExample() {
  const [operationCount, setOperationCount] = useState(0);
  
  const { state, execute, isClosed, isOpen, isHalfOpen } = useCircuitBreaker('demo-service', {
    failureThreshold: 3,
    resetTimeout: 5000,
    successThreshold: 2
  });

  const performOperation = async () => {
    setOperationCount(prev => prev + 1);
    
    return execute(async () => {
      // Simular serviço instável
      const shouldFail = Math.random() < 0.4; // 40% chance of failure
      
      if (shouldFail) {
        throw new Error('Service temporarily unavailable');
      }
      
      return {
        result: 'Operation completed',
        timestamp: new Date().toISOString(),
        attempt: operationCount + 1
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Exemplo - Circuit Breaker
        </CardTitle>
        <CardDescription>
          Demonstração de circuit breaker pattern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Estado:</p>
            <Badge 
              variant={isClosed ? "default" : isOpen ? "destructive" : "secondary"}
            >
              {state.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Falhas:</p>
            <p className="text-xl font-bold">{state.failures}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Operações:</p>
            <p className="text-xl font-bold">{operationCount}</p>
          </div>
        </div>

        {state.status === 'OPEN' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Circuit breaker está <strong>ABERTO</strong>. O serviço está sendo protegido.
              Próxima tentativa automática em alguns segundos.
            </AlertDescription>
          </Alert>
        )}

        {state.status === 'HALF_OPEN' && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Circuit breaker está em <strong>HALF_OPEN</strong>. Testando recuperação do serviço.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={performOperation} 
          disabled={state.status === 'OPEN'}
          className="w-full"
        >
          {state.status === 'OPEN' ? 'Circuit Breaker Aberto' : 'Executar Operação'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ===========================================
// 3. EXEMPLO - FALLBACK STRATEGY
// ===========================================

export function FallbackExample() {
  const { data, error, isLoading, useFallback, strategy, execute } = 
    useFallbackStrategy(
      async () => {
        // Simular operação que pode falhar
        const shouldFail = Math.random() < 0.5; // 50% chance of failure
        
        if (shouldFail) {
          throw new NetworkError('Primary service unavailable');
        }
        
        return {
          source: 'live',
          data: {
            users: 1234,
            revenue: 56789,
            timestamp: new Date().toISOString()
          }
        };
      },
      // Fallback data (cache)
      {
        source: 'cache',
        data: {
          users: 1200,
          revenue: 55000,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          note: 'Dados em cache - podem estar desatualizados'
        }
      }
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Exemplo - Fallback Strategy
        </CardTitle>
        <CardDescription>
          Demonstração de degradação graciosa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {strategy && (
          <div className="flex items-center justify-between">
            <Badge variant={strategy === 'primary' ? 'default' : 'secondary'}>
              {strategy === 'primary' ? 'Dados Live' : 'Dados em Cache'}
            </Badge>
            {useFallback && (
              <Badge variant="outline">
                Fallback Ativado
              </Badge>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        )}

        {data && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Usuários:</p>
                <p className="text-2xl font-bold">{data.data.users}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita:</p>
                <p className="text-2xl font-bold">${data.data.revenue.toLocaleString()}</p>
              </div>
            </div>
            {data.data.note && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ {data.data.note}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Fonte: {data.source} | {new Date(data.data.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {error && !useFallback && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error.message}
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={execute} disabled={isLoading} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Buscar Dados
        </Button>
      </CardContent>
    </Card>
  );
}

// ===========================================
// 4. EXEMPLO - MUTATION COM RETRY
// ===========================================

export function MutationRetryExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const { mutate, data, error, isLoading } = useRetryableMutation(
    async (variables) => {
      // Simular API call que pode falhar
      const shouldFail = Math.random() < 0.3; // 30% chance of failure
      
      if (shouldFail) {
        throw new NetworkError('Server temporarily unavailable');
      }
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: Date.now(),
        ...variables,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    },
    {
      variables: formData,
      maxAttempts: 3,
      onSuccess: (data) => {
        console.log('Mutation successful:', data);
        setFormData({ name: '', email: '', message: '' });
      },
      onError: (error) => {
        console.log('Mutation failed:', error.message);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Exemplo - Mutation com Retry
        </CardTitle>
        <CardDescription>
          Formulário com retry automático para submissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mensagem:</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-2 border rounded"
              rows={3}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !formData.name || !formData.email}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </Button>
        </form>

        {data && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sucesso!</strong> Dados enviados com ID: {data.id}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================
// 5. EXEMPLO - ESTRATÉGIAS PRÉ-CONFIGURADAS
// ===========================================

export function PredefinedStrategiesExample() {
  const strategies = usePredefinedStrategies();
  const [selectedStrategy, setSelectedStrategy] = useState('external');

  const { data, error, isLoading, execute } = useRetryLogic(
    async () => {
      // Simular diferentes tipos de operação baseado na estratégia
      switch (selectedStrategy) {
        case 'critical':
          // Operação crítica com alta confiabilidade
          const criticalSuccess = Math.random() < 0.95; // 95% success rate
          if (!criticalSuccess) throw new Error('Critical operation failed');
          return { type: 'critical', result: 'Payment processed successfully' };
          
        case 'external':
          // API externa com retry exponencial
          const externalSuccess = Math.random() < 0.8; // 80% success rate
          if (!externalSuccess) throw new NetworkError('External API unavailable');
          return { type: 'external', result: 'External data retrieved' };
          
        case 'cache':
          // Operação de cache com retry imediato
          const cacheSuccess = Math.random() < 0.98; // 98% success rate
          if (!cacheSuccess) throw new Error('Cache operation failed');
          return { type: 'cache', result: 'Cache data accessed' };
          
        case 'graceful':
          // Operação com fallback
          const gracefulSuccess = Math.random() < 0.7; // 70% success rate
          if (!gracefulSuccess) throw new Error('Operation with fallback');
          return { type: 'graceful', result: 'Operation completed with fallback' };
          
        default:
          return { type: 'unknown', result: 'Default operation' };
      }
    },
    strategies[selectedStrategy as keyof typeof strategies]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Exemplo - Estratégias Pré-configuradas
        </CardTitle>
        <CardDescription>
          Diferentes estratégias para diferentes tipos de operação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(strategies).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedStrategy === key ? "default" : "outline"}
              onClick={() => setSelectedStrategy(key)}
              className="capitalize"
            >
              {key}
            </Button>
          ))}
        </div>

        <div className="bg-muted p-3 rounded text-sm">
          <strong>Configuração da Estratégia:</strong>
          <div className="mt-2 space-y-1">
            <div>Max Attempts: {strategies[selectedStrategy as keyof typeof strategies].maxAttempts}</div>
            <div>Timeout: {strategies[selectedStrategy as keyof typeof strategies].timeout}ms</div>
            <div>Circuit Breaker: {strategies[selectedStrategy as keyof typeof strategies].circuitBreaker ? 'Ativo' : 'Inativo'}</div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Executando operação...</p>
          </div>
        )}

        {data && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sucesso:</strong> {data.result}
              <br />
              <span className="text-xs text-muted-foreground">
                Tipo: {data.type} | {new Date().toLocaleString()}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {error.message}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={execute} 
          disabled={isLoading}
          className="w-full"
        >
          Executar com Estratégia {selectedStrategy}
        </Button>
      </CardContent>
    </Card>
  );
}

// ===========================================
// 6. COMPONENTE PRINCIPAL
// ===========================================

export function RetryLogicExamples() {
  const { metrics, alerts, isMonitoring } = useRetryMonitoring(true);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Sistema de Retry Logic e Error Handling
        </h1>
        <p className="text-muted-foreground">
          Exemplos práticos das funcionalidades implementadas
        </p>
        
        {metrics && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Monitoramento em Tempo Real</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Attempts</p>
                <p className="text-xl font-bold">{metrics.totalAttempts}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold">
                  {metrics.totalAttempts > 0 
                    ? ((metrics.successfulRetries / metrics.totalAttempts) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Delay</p>
                <p className="text-xl font-bold">{metrics.avgRetryDelay.toFixed(0)}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? "Monitorando" : "Pausado"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BasicRetryExample />
        <CircuitBreakerExample />
        <FallbackExample />
        <MutationRetryExample />
      </div>

      <PredefinedStrategiesExample />

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, idx) => (
                <Alert key={idx} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {alert.message}
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export para uso em outras partes da aplicação
export default RetryLogicExamples;