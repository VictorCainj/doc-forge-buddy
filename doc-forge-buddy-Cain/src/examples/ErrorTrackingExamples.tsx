/**
 * Exemplos de uso do sistema de Error Tracking
 * Este arquivo demonstra como usar as diferentes funcionalidades implementadas
 */

import { 
  trackError, 
  trackUserAction, 
  trackPerformanceIssue, 
  trackMemoryUsage,
  trackApiError,
  trackValidationError,
  type ErrorCategory,
  type ErrorSeverity,
  type ErrorSource
} from '@/lib/errorTracking';
import { 
  trackPerformance, 
  trackUserInteraction,
  type PerformanceMetric 
} from '@/lib/performanceIntegration';
import { useErrorMonitoringInComponent } from '@/providers/ErrorMonitoringProvider';
import { captureException, captureMessage } from '@/lib/sentry';

// ====================
// 1. EXEMPLOS DE ERROR TRACKING
// ====================

// Tracking básico de erro
function exemploErrorTrackingBasico() {
  try {
    // Alguma operação que pode falhar
    const resultado = riskyOperation();
  } catch (error) {
    // Track com contexto completo
    trackError(error, {
      category: 'javascript' as ErrorCategory,
      severity: 'high' as ErrorSeverity,
      source: 'component' as ErrorSource,
      userAction: 'button_click',
      additionalData: {
        userId: 'user_123',
        sessionId: 'session_456',
        component: 'UserForm',
        action: 'submit_form',
      },
    });
  }
}

// Tracking de API errors
function exemploApiErrorTracking() {
  const endpoint = '/api/users';
  const method = 'GET';
  const startTime = Date.now();
  
  fetch(endpoint, { method })
    .then(response => {
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        trackApiError(endpoint, method, response.status, responseTime);
      }
    })
    .catch(error => {
      const responseTime = Date.now() - startTime;
      trackApiError(endpoint, method, 0, responseTime, error);
    });
}

// Tracking de validation errors
function exemploValidationErrorTracking() {
  const formData = {
    email: 'invalid-email',
    password: '123',
  };
  
  if (!isValidEmail(formData.email)) {
    trackValidationError(
      'email',
      formData.email,
      'invalid_format',
      {
        userId: 'user_123',
        formName: 'registration_form',
      }
    );
  }
}

// ====================
// 2. EXEMPLOS DE PERFORMANCE TRACKING
// ====================

// Tracking de métricas de performance
function exemploPerformanceTracking() {
  const startTime = performance.now();
  
  // Simular operação demorada
  setTimeout(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    trackPerformance({
      name: 'SLOW_OPERATION',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        operation: 'data_processing',
        dataSize: 'large',
        url: window.location.pathname,
      },
    });
    
    // Alert para operações muito demoradas
    if (duration > 5000) {
      trackPerformanceIssue('data_processing', duration, 5000, {
        operation: 'data_processing',
        severity: 'high',
      });
    }
  }, 1000);
}

// Monitoring de memory leaks
function exemploMemoryMonitoring() {
  trackMemoryUsage();
  
  // Monitorar periodicamente
  setInterval(() => {
    trackMemoryUsage();
  }, 30000); // a cada 30 segundos
}

// ====================
// 3. EXEMPLOS DE USER ACTION TRACKING
// ====================

// Tracking de ações do usuário
function exemploUserActionTracking() {
  // Track ação bem-sucedida
  trackUserAction('form_submission', true, {
    formId: 'user_registration',
    fieldsCount: 5,
  });
  
  // Track ação que falhou
  trackUserAction('file_upload', false, {
    fileType: 'image',
    fileSize: 5242880, // 5MB
    reason: 'file_too_large',
  });
}

// ====================
// 4. EXEMPLOS COM HOOKS PERSONALIZADOS
// ====================

// Componente usando o hook de error monitoring
function ExemploComponenteComHook() {
  // Usar o hook para tracking automático
  const { 
    isHealthy, 
    healthStatus, 
    trackError, 
    trackPerformance 
  } = useErrorMonitoringInComponent('UserProfile');
  
  const handleUserAction = async (action: string) => {
    const startTime = performance.now();
    
    try {
      // Executar ação
      await performUserAction(action);
      
      // Track performance da ação
      const duration = performance.now() - startTime;
      trackPerformance('user_action', duration, { action });
      
    } catch (error) {
      // Track erro da ação
      trackError(error, {
        category: 'javascript',
        severity: 'medium',
        source: 'user_interaction',
        userAction: action,
      });
    }
  };
  
  return (
    <div>
      <h2>User Profile</h2>
      <p>Status: {healthStatus}</p>
      <button onClick={() => handleUserAction('update_profile')}>
        Update Profile
      </button>
    </div>
  );
}

// ====================
// 5. EXEMPLOS DE SENTRY DIRECT
// ====================

// Usando Sentry diretamente
function exemploSentryDirect() {
  // Capture exception com contexto
  try {
    riskyOperation();
  } catch (error) {
    captureException(error, {
      userId: 'user_123',
      action: 'critical_operation',
      environment: 'production',
    });
  }
  
  // Capture message
  captureMessage('User performed critical action', 'info');
  
  // Set user context
  (window as any).Sentry?.setUser({
    id: 'user_123',
    email: 'user@example.com',
    username: 'john_doe',
  });
}

// ====================
// 6. EXEMPLOS DE COMPONENTES COM ERROR BOUNDARIES
// ====================

import { 
  GlobalErrorBoundary, 
  RouteErrorBoundary, 
  FeatureErrorBoundary 
} from '@/components/common';

// Wrapping com Global Error Boundary
function AppComGlobalErrorBoundary() {
  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}

// Wrapping com Route Error Boundary
function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/dashboard" 
        element={
          <RouteErrorBoundary routeName="Dashboard">
            <Dashboard />
          </RouteErrorBoundary>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <RouteErrorBoundary routeName="User Profile">
            <UserProfile />
          </RouteErrorBoundary>
        } 
      />
    </Routes>
  );
}

// Wrapping com Feature Error Boundary
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Feature específica com recovery */}
      <FeatureErrorBoundary 
        featureName="User Statistics"
        allowRecovery={true}
        compact={false}
      >
        <UserStatistics />
      </FeatureErrorBoundary>
      
      {/* Feature com UI compacta */}
      <FeatureErrorBoundary 
        featureName="Recent Activity"
        compact={true}
        showDetails={import.meta.env.DEV}
      >
        <RecentActivity />
      </FeatureErrorBoundary>
    </div>
  );
}

// ====================
// 7. EXEMPLOS DE INTEGRAÇÃO COM MONITORAMENTO
// ====================

// Hook para monitoring de componentes
function useComponentMonitoring(componentName: string) {
  const { trackError, trackPerformance } = useErrorMonitoringInComponent(componentName);
  
  const wrapAsyncOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      trackPerformance(`async_operation_${operationName}`, duration);
      return result;
    } catch (error) {
      trackError(error, {
        category: 'javascript',
        severity: 'medium',
        source: 'component',
        userAction: operationName,
      });
      return null;
    }
  };
  
  return { trackError, trackPerformance, wrapAsyncOperation };
}

// ====================
// 8. EXEMPLOS DE CONFIGURAÇÃO E INICIALIZAÇÃO
// ====================

// Configuração completa do sistema
function initCompleteErrorMonitoring() {
  // Importar e inicializar todos os sistemas
  
  // 1. Sentry (já configurado via ErrorMonitoringProvider)
  // initSentry(); // Já feito no provider
  
  // 2. Error tracking
  initErrorTracking();
  
  // 3. Alerting
  initAlerting();
  
  // 4. Analytics
  initErrorAnalytics();
  
  // 5. Performance monitoring
  initPerformanceMonitoring();
}

// ====================
// FUNÇÕES AUXILIARES
// ====================

function riskyOperation() {
  if (Math.random() > 0.7) {
    throw new Error('Something went wrong in risky operation');
  }
  return 'Success';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function performUserAction(action: string): Promise<void> {
  // Simular operação do usuário
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  
  if (Math.random() > 0.8) {
    throw new Error(`Failed to perform action: ${action}`);
  }
}

// Componentes de exemplo
function UserStatistics() {
  // Simular componente que pode falhar
  if (Math.random() > 0.9) {
    throw new Error('Failed to load user statistics');
  }
  
  return <div>User Statistics Component</div>;
}

function RecentActivity() {
  // Simular componente que pode falhar
  if (Math.random() > 0.9) {
    throw new Error('Failed to load recent activity');
  }
  
  return <div>Recent Activity Component</div>;
}

function Dashboard() {
  return <div>Dashboard Content</div>;
}

function UserProfile() {
  return <div>User Profile Content</div>;
}

// ====================
// EXPORT
// ====================

export {
  // Error tracking examples
  exemploErrorTrackingBasico,
  exemploApiErrorTracking,
  exemploValidationErrorTracking,
  
  // Performance tracking examples
  exemploPerformanceTracking,
  exemploMemoryMonitoring,
  
  // User action examples
  exemploUserActionTracking,
  
  // Component examples
  ExemploComponenteComHook,
  AppComGlobalErrorBoundary,
  AppRoutes,
  Dashboard,
  
  // Sentry examples
  exemploSentryDirect,
  
  // Configuration examples
  initCompleteErrorMonitoring,
  
  // Hooks
  useComponentMonitoring,
};