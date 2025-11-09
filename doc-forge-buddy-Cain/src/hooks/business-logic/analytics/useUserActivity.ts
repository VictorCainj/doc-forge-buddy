import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../shared/use-toast';
import { useAuth } from '../useAuth';
import { format, subDays, subHours, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para atividade do usuário
export interface UserActivity {
  id: string;
  userId: string;
  sessionId: string;
  type: ActivityType;
  category: ActivityCategory;
  action: string;
  resource: {
    id: string;
    type: 'contract' | 'vistoria' | 'document' | 'page' | 'feature';
    name: string;
    url?: string;
  };
  metadata: ActivityMetadata;
  performance: ActivityPerformance;
  context: ActivityContext;
  timestamp: Date;
  duration?: number;
  outcome: 'success' | 'failure' | 'cancelled';
  userAgent: string;
  ipAddress?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

export type ActivityType = 
  | 'page_view'
  | 'button_click'
  | 'form_submission'
  | 'search'
  | 'download'
  | 'upload'
  | 'create'
  | 'update'
  | 'delete'
  | 'view_document'
  | 'generate_report'
  | 'export_data'
  | 'share'
  | 'notification_open'
  | 'settings_change'
  | 'authentication'
  | 'session_start'
  | 'session_end';

export type ActivityCategory = 
  | 'navigation'
  | 'interaction'
  | 'content'
  | 'data'
  | 'system'
  | 'performance'
  | 'security'
  | 'collaboration';

export interface ActivityMetadata {
  referrer?: string;
  searchQuery?: string;
  fileSize?: number;
  fileType?: string;
  errorCode?: string;
  errorMessage?: string;
  responseTime?: number;
  value?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ActivityPerformance {
  loadTime: number;
  renderTime: number;
  networkTime: number;
  serverTime: number;
  cacheHit: boolean;
  bundleSize?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ActivityContext {
  page: string;
  route: string;
  previousPage?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  viewport: string;
  userRole?: string;
  permissions?: string[];
  isNewUser: boolean;
  isFirstVisit: boolean;
  visitCount: number;
}

export interface UserJourney {
  sessionId: string;
  userId: string;
  steps: JourneyStep[];
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  actions: number;
  conversions: number[];
  dropOffPoints: string[];
  funnelAnalysis: FunnelStep[];
  deviceType: ActivityContext['deviceType'];
  entrancePage: string;
  exitPage?: string;
  bounce: boolean;
}

export interface JourneyStep {
  stepNumber: number;
  page: string;
  action: string;
  timestamp: Date;
  duration: number;
  conversionValue?: number;
  isConversion: boolean;
}

export interface FunnelStep {
  step: string;
  userId: string;
  sessionId: string;
  enteredAt: Date;
  completedAt?: Date;
  droppedAt?: Date;
  conversionValue?: number;
  isCompleted: boolean;
  dropOffReason?: string;
}

export interface ConversionEvent {
  id: string;
  userId: string;
  sessionId: string;
  type: ConversionType;
  value?: number;
  currency?: string;
  category: string;
  label: string;
  timestamp: Date;
  attribution: {
    source: string;
    medium: string;
    campaign?: string;
    keyword?: string;
  };
  context: {
    page: string;
    referrer: string;
    device: ActivityContext['deviceType'];
  };
}

export type ConversionType = 
  | 'signup'
  | 'contract_created'
  | 'document_generated'
  | 'report_downloaded'
  | 'feature_used'
  | 'goal_achieved'
  | 'purchase'
  | 'upgrade';

export interface ActivityFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userIds?: string[];
  activityTypes?: ActivityType[];
  categories?: ActivityCategory[];
  pages?: string[];
  devices?: ActivityContext['deviceType'][];
  outcome?: UserActivity['outcome'];
  minDuration?: number;
  maxDuration?: number;
  searchTerm?: string;
}

export interface AnalyticsStats {
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionsCount: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  topPages: Array<{ page: string; views: number }>;
  topActions: Array<{ action: string; count: number }>;
  conversionRate: number;
  totalConversions: number;
  funnelAnalysis: Record<string, number>;
  deviceStats: Record<ActivityContext['deviceType'], number>;
  hourlyActivity: Array<{ hour: number; activity: number }>;
  userFlow: Record<string, number>;
}

export interface CohortAnalysis {
  cohort: string; // Data de início da coorte
  users: number;
  retention: Record<number, number>; // Semana -> Taxa de retenção
  revenue?: Record<number, number>;
  engagement?: Record<number, number>;
}

export function useUserActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados locais
  const [filters, setFilters] = useState<ActivityFilters>({
    dateRange: {
      start: subDays(new Date(), 7),
      end: new Date()
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const activityQueueRef = useRef<Partial<UserActivity>[]>([]);
  const sessionStartRef = useRef<Date>(new Date());

  // Gerar ID da sessão se não existir
  useEffect(() => {
    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics-session-id', sessionId);
      setCurrentSessionId(sessionId);
      
      // Registrar início da sessão
      trackActivity({
        type: 'session_start',
        action: 'session_start',
        category: 'system',
        resource: {
          id: 'session',
          type: 'page',
          name: 'Session Start'
        },
        context: getCurrentContext(),
        outcome: 'success'
      });
    } else {
      setCurrentSessionId(sessionId);
    }
  }, []);

  // Query para buscar atividades
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ['user-activities', filters],
    queryFn: async (): Promise<UserActivity[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockActivities();
    },
    refetchInterval: 30000
  });

  // Query para jornadas do usuário
  const {
    data: userJourneys,
    isLoading: journeysLoading
  } = useQuery({
    queryKey: ['user-journeys', filters],
    queryFn: async (): Promise<UserJourney[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockJourneys();
    }
  });

  // Query para eventos de conversão
  const {
    data: conversions,
    isLoading: conversionsLoading
  } = useQuery({
    queryKey: ['conversions', filters],
    queryFn: async (): Promise<ConversionEvent[]> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 200));
      return generateMockConversions();
    }
  });

  // Query para estatísticas
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['analytics-stats', filters],
    queryFn: async (): Promise<AnalyticsStats> => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 400));
      return generateMockStats();
    }
  });

  // Mutação para enviar atividade
  const trackMutation = useMutation({
    mutationFn: async (activity: Partial<UserActivity>) => {
      // Simulação - substituir pela chamada real à API
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, id: `activity-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-activities'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    }
  });

  // Função principal para rastrear atividade
  const trackActivity = useCallback((
    activityData: Partial<UserActivity>
  ) => {
    const activity: Partial<UserActivity> = {
      ...activityData,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user?.id || 'anonymous',
      sessionId: currentSessionId,
      timestamp: new Date(),
      context: activityData.context || getCurrentContext(),
      userAgent: navigator.userAgent
    };

    // Adicionar à fila para envio em lote
    activityQueueRef.current.push(activity);

    // Enviar imediatamente para atividades importantes
    if (shouldSendImmediately(activity)) {
      flushActivityQueue();
    }

    setIsTracking(true);
  }, [user, currentSessionId]);

  // Enviar fila de atividades
  const flushActivityQueue = useCallback(async () => {
    if (activityQueueRef.current.length === 0) return;

    const queue = [...activityQueueRef.current];
    activityQueueRef.current = [];

    try {
      // Agrupar atividades por tipo para otimização
      const batchedActivities = groupActivitiesByType(queue);
      
      for (const batch of batchedActivities) {
        await trackMutation.mutateAsync(batch[0]); // Enviar apenas o primeiro como exemplo
      }
    } catch (error) {
      console.error('Erro ao enviar atividades:', error);
      // Re-adicionar à fila para próxima tentativa
      activityQueueRef.current.unshift(...queue);
    }

    setIsTracking(false);
  }, [trackMutation]);

  // Rastrear visualização de página
  const trackPageView = useCallback((
    page: string,
    metadata?: Partial<ActivityMetadata>
  ) => {
    trackActivity({
      type: 'page_view',
      action: 'page_view',
      category: 'navigation',
      resource: {
        id: page,
        type: 'page',
        name: page
      },
      metadata,
      performance: measurePagePerformance(),
      outcome: 'success'
    });
  }, [trackActivity]);

  // Rastrear cliques
  const trackClick = useCallback((
    element: string,
    page: string,
    metadata?: Partial<ActivityMetadata>
  ) => {
    trackActivity({
      type: 'button_click',
      action: 'click',
      category: 'interaction',
      resource: {
        id: element,
        type: 'feature',
        name: element
      },
      metadata: {
        ...metadata,
        page
      },
      outcome: 'success'
    });
  }, [trackActivity]);

  // Rastrear formulários
  const trackFormSubmission = useCallback((
    formName: string,
    isSuccess: boolean,
    errorMessage?: string,
    duration?: number
  ) => {
    trackActivity({
      type: 'form_submission',
      action: 'submit',
      category: 'interaction',
      resource: {
        id: formName,
        type: 'feature',
        name: formName
      },
      duration,
      metadata: {
        errorMessage,
        isSuccess
      },
      outcome: isSuccess ? 'success' : 'failure'
    });
  }, [trackActivity]);

  // Rastrear conversões
  const trackConversion = useCallback((
    type: ConversionType,
    value?: number,
    metadata?: Partial<ActivityMetadata>
  ) => {
    const conversion: ConversionEvent = {
      id: `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user?.id || 'anonymous',
      sessionId: currentSessionId,
      type,
      value,
      currency: 'BRL',
      category: 'conversion',
      label: type,
      timestamp: new Date(),
      attribution: getAttributionData(),
      context: {
        page: window.location.pathname,
        referrer: document.referrer,
        device: getCurrentContext().deviceType
      }
    };

    // Registrar como atividade
    trackActivity({
      type: 'create',
      action: 'conversion',
      category: 'system',
      resource: {
        id: type,
        type: 'feature',
        name: type
      },
      metadata: {
        ...metadata,
        conversionValue: value
      },
      outcome: 'success'
    });
  }, [trackActivity, user, currentSessionId]);

  // Rastrear erros
  const trackError = useCallback((
    errorCode: string,
    errorMessage: string,
    context?: string
  ) => {
    trackActivity({
      type: 'button_click', // Tipo genérico para erros
      action: 'error',
      category: 'system',
      resource: {
        id: errorCode,
        type: 'feature',
        name: 'Error'
      },
      metadata: {
        errorCode,
        errorMessage,
        context
      },
      outcome: 'failure'
    });
  }, [trackActivity]);

  // Detectar quando usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackActivity({
        type: 'session_end',
        action: 'session_end',
        category: 'system',
        resource: {
          id: 'session',
          type: 'page',
          name: 'Session End'
        },
        duration: Date.now() - sessionStartRef.current.getTime(),
        outcome: 'success'
      });
      
      flushActivityQueue();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Usador saiu da aba
        sessionStartRef.current = new Date(); // Reiniciar计时
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackActivity, flushActivityQueue]);

  // Enviar fila periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (activityQueueRef.current.length > 0) {
        flushActivityQueue();
      }
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, [flushActivityQueue]);

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    return activities.filter(activity => {
      // Aplicar filtros
      if (filters.dateRange) {
        if (!isWithinInterval(activity.timestamp, filters.dateRange)) {
          return false;
        }
      }

      if (filters.userIds?.length && !filters.userIds.includes(activity.userId)) {
        return false;
      }

      if (filters.activityTypes?.length && !filters.activityTypes.includes(activity.type)) {
        return false;
      }

      if (filters.categories?.length && !filters.categories.includes(activity.category)) {
        return false;
      }

      if (filters.pages?.length && !filters.pages.includes(activity.resource.id)) {
        return false;
      }

      if (filters.devices?.length && !filters.devices.includes(activity.context.deviceType)) {
        return false;
      }

      if (filters.outcome && activity.outcome !== filters.outcome) {
        return false;
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = [
          activity.action,
          activity.resource.name,
          activity.resource.id,
          activity.context.page
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [activities, filters]);

  // Calcular métricas de jornada
  const journeyMetrics = useMemo(() => {
    if (!userJourneys) return null;

    const totalJourneys = userJourneys.length;
    const avgDuration = userJourneys.reduce((sum, j) => sum + j.duration, 0) / totalJourneys;
    const bounceRate = userJourneys.filter(j => j.bounce).length / totalJourneys;
    const conversionRate = userJourneys.filter(j => j.conversions.length > 0).length / totalJourneys;

    return {
      totalJourneys,
      avgDuration,
      bounceRate,
      conversionRate,
      topExitPages: getTopExitPages(userJourneys),
      topFunnelDropOff: getTopFunnelDropOff(userJourneys)
    };
  }, [userJourneys]);

  return {
    // Estado
    activities: filteredActivities,
    userJourneys,
    conversions,
    stats: stats || null,
    journeyMetrics,
    currentSessionId,
    isTracking,
    isLoading: activitiesLoading || journeysLoading || conversionsLoading || statsLoading,
    error: activitiesError,

    // Ações de rastreamento
    trackActivity,
    trackPageView,
    trackClick,
    trackFormSubmission,
    trackConversion,
    trackError,
    flushActivityQueue,

    // Filtros
    filters,
    setFilters: (newFilters: Partial<ActivityFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },

    // Utilitários
    getSessionById: (sessionId: string) => 
      userJourneys?.find(j => j.sessionId === sessionId),
    getUserById: (userId: string) => 
      filteredActivities.filter(a => a.userId === userId),
    getConversionsByType: (type: ConversionType) => 
      conversions?.filter(c => c.type === type) || [],
    
    // Exportar dados
    exportData: (format: 'csv' | 'json') => {
      const data = {
        activities: filteredActivities,
        journeys: userJourneys,
        conversions,
        filters,
        exportedAt: new Date().toISOString()
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };
}

// Funções auxiliares
function getCurrentContext(): ActivityContext {
  return {
    page: window.location.pathname,
    route: window.location.pathname,
    previousPage: document.referrer,
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screenResolution: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    isNewUser: !localStorage.getItem('user-visited'),
    isFirstVisit: sessionStorage.getItem('session-count') === '1',
    visitCount: parseInt(sessionStorage.getItem('visit-count') || '1')
  };
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOSInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Other';
}

function getAttributionData() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    source: urlParams.get('utm_source') || 'direct',
    medium: urlParams.get('utm_medium') || 'none',
    campaign: urlParams.get('utm_campaign'),
    keyword: urlParams.get('utm_term')
  };
}

function measurePagePerformance(): ActivityPerformance {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    loadTime: navigation.loadEventEnd - navigation.fetchStart,
    renderTime: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    networkTime: navigation.responseEnd - navigation.requestStart,
    serverTime: navigation.responseStart - navigation.requestStart,
    cacheHit: false, // Implementar detecção de cache
    bundleSize: 0, // Implementar medição de bundle
    memoryUsage: (performance as any).memory?.usedJSHeapSize
  };
}

function shouldSendImmediately(activity: Partial<UserActivity>): boolean {
  const highPriorityTypes: ActivityType[] = [
    'session_start',
    'session_end',
    'form_submission',
    'create',
    'update',
    'delete',
    'authentication'
  ];
  
  return highPriorityTypes.includes(activity.type || 'page_view');
}

function groupActivitiesByType(activities: Partial<UserActivity>[]): Partial<UserActivity>[][] {
  const grouped = activities.reduce((acc, activity) => {
    const type = activity.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(activity);
    return acc;
  }, {} as Record<string, Partial<UserActivity>[]>);

  return Object.values(grouped);
}

function getTopExitPages(journeys: UserJourney[]) {
  const exitPages = journeys
    .filter(j => j.exitPage)
    .map(j => j.exitPage!)
    .reduce((acc, page) => {
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(exitPages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([page, count]) => ({ page, count }));
}

function getTopFunnelDropOff(journeys: UserJourney[]) {
  const dropOffs = journeys
    .flatMap(j => j.dropOffPoints)
    .reduce((acc, point) => {
      acc[point] = (acc[point] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(dropOffs)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([point, count]) => ({ point, count }));
}

// Funções de geração de dados mock (para desenvolvimento)
function generateMockActivities(): UserActivity[] {
  return Array.from({ length: 100 }, (_, i) => ({
    id: `activity-${i + 1}`,
    userId: `user-${Math.floor(Math.random() * 10) + 1}`,
    sessionId: `session-${Math.floor(Math.random() * 20) + 1}`,
    type: 'page_view',
    category: 'navigation',
    action: 'view',
    resource: {
      id: `/page-${i + 1}`,
      type: 'page',
      name: `Page ${i + 1}`
    },
    metadata: {},
    performance: {
      loadTime: Math.random() * 2000 + 500,
      renderTime: Math.random() * 1000 + 200,
      networkTime: Math.random() * 500 + 100,
      serverTime: Math.random() * 300 + 50,
      cacheHit: Math.random() > 0.5
    },
    context: getCurrentContext(),
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    outcome: Math.random() > 0.1 ? 'success' : 'failure',
    userAgent: navigator.userAgent
  }));
}

function generateMockJourneys(): UserJourney[] {
  return Array.from({ length: 20 }, (_, i) => {
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const duration = Math.random() * 1800000 + 300000; // 5min - 30min
    
    return {
      sessionId: `session-${i + 1}`,
      userId: `user-${Math.floor(Math.random() * 10) + 1}`,
      steps: [
        {
          stepNumber: 1,
          page: '/',
          action: 'landing',
          timestamp: startTime,
          duration: 0,
          isConversion: false
        }
      ],
      startTime,
      endTime: new Date(startTime.getTime() + duration),
      duration,
      pageViews: Math.floor(Math.random() * 10) + 1,
      actions: Math.floor(Math.random() * 20) + 5,
      conversions: [],
      dropOffPoints: [],
      funnelAnalysis: [],
      deviceType: Math.random() > 0.5 ? 'desktop' : 'mobile',
      entrancePage: '/',
      exitPage: Math.random() > 0.7 ? '/contact' : undefined,
      bounce: Math.random() > 0.7
    };
  });
}

function generateMockConversions(): ConversionEvent[] {
  return Array.from({ length: 25 }, (_, i) => ({
    id: `conversion-${i + 1}`,
    userId: `user-${Math.floor(Math.random() * 10) + 1}`,
    sessionId: `session-${Math.floor(Math.random() * 20) + 1}`,
    type: 'contract_created',
    value: Math.random() * 5000 + 1000,
    currency: 'BRL',
    category: 'business',
    label: 'Contract Created',
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    attribution: {
      source: 'direct',
      medium: 'none'
    },
    context: {
      page: '/contracts',
      referrer: '/dashboard',
      device: 'desktop'
    }
  }));
}

function generateMockStats(): AnalyticsStats {
  return {
    activeUsers: 156,
    newUsers: 23,
    returningUsers: 133,
    sessionsCount: 289,
    avgSessionDuration: 895000, // 14.9 minutos em ms
    bounceRate: 0.34,
    pageViews: 1247,
    uniquePageViews: 892,
    topPages: [
      { page: '/dashboard', views: 345 },
      { page: '/contracts', views: 234 },
      { page: '/reports', views: 189 },
      { page: '/settings', views: 123 },
      { page: '/users', views: 98 }
    ],
    topActions: [
      { action: 'create_contract', count: 89 },
      { action: 'view_report', count: 156 },
      { action: 'download_document', count: 67 },
      { action: 'search', count: 234 },
      { action: 'edit_profile', count: 45 }
    ],
    conversionRate: 0.067,
    totalConversions: 19,
    funnelAnalysis: {
      'visit_dashboard': 100,
      'view_contracts': 78,
      'create_contract': 45,
      'complete_contract': 32
    },
    deviceStats: {
      desktop: 0.68,
      mobile: 0.24,
      tablet: 0.08
    },
    hourlyActivity: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.floor(Math.random() * 50) + 5
    })),
    userFlow: {
      'dashboard->contracts': 78,
      'contracts->reports': 45,
      'reports->documents': 23,
      'documents->settings': 12
    }
  };
}