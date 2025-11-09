/**
 * Error Monitoring Dashboard
 * Interface para visualização em tempo real de erros, métricas e alertas
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  BarChart3,
  Settings,
  Download,
  Filter,
  Search
} from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { alertState, type AlertEvent } from '@/lib/alerting';
import { getCurrentAnalytics, getTrendAnalysis } from '@/lib/errorAnalytics';
import { getPerformanceSummary, getUserSessions } from '@/lib/performanceIntegration';
import { log } from '@/utils/logger';

// Componente principal do dashboard
export function ErrorMonitoringDashboard() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [analytics, setAnalytics] = useState(getCurrentAnalytics());
  const [trendAnalysis, setTrendAnalysis] = useState(getTrendAnalysis('7d'));
  const [performanceSummary, setPerformanceSummary] = useState(getPerformanceSummary());
  const [userSessions, setUserSessions] = useState(getUserSessions());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '7d' | '30d'>('7d');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Subscription aos alertas
  useEffect(() => {
    const unsubscribe = alertState.subscribe(setAlerts);
    
    // Auto-refresh data
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
      }, 30000); // 30 seconds
    }
    
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Refresh data
  const refreshData = () => {
    setAnalytics(getCurrentAnalytics());
    setTrendAnalysis(getTrendAnalysis(selectedPeriod));
    setPerformanceSummary(getPerformanceSummary());
    setUserSessions(getUserSessions());
  };

  // Handle period change
  useEffect(() => {
    setTrendAnalysis(getTrendAnalysis(selectedPeriod));
  }, [selectedPeriod]);

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Error Monitoring Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoramento em tempo real de erros e performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const report = exportAnalyticsReport();
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-report-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Errors"
          value={analytics.totalErrors}
          change={trendAnalysis.errorChange}
          icon={XCircle}
          trend={trendAnalysis.errorChange > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Error Rate"
          value={`${analytics.errorRate}/h`}
          change={0}
          icon={Activity}
          trend="stable"
        />
        <MetricCard
          title="Critical Errors"
          value={analytics.criticalErrors}
          change={trendAnalysis.criticalChange}
          icon={AlertTriangle}
          trend={trendAnalysis.criticalChange > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="User Impact"
          value={`${analytics.userImpactScore}/100`}
          change={0}
          icon={Users}
          trend="stable"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Tables */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="space-y-4">
              <ErrorAnalysisView 
                analytics={analytics} 
                filterCategory={filterCategory}
                searchTerm={searchTerm}
                onFilterChange={setFilterCategory}
                onSearchChange={setSearchTerm}
              />
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <PerformanceView summary={performanceSummary} />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <SessionsView sessions={userSessions} />
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <TrendsView 
                analysis={trendAnalysis}
                period={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Alerts and Quick Actions */}
        <div className="space-y-6">
          <AlertsView 
            activeAlerts={activeAlerts} 
            resolvedAlerts={resolvedAlerts}
          />
          <QuickActionsView />
        </div>
      </div>
    </div>
  );
}

// Componente de cartão de métrica
function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: any; 
  trend: 'up' | 'down' | 'stable' 
}) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-red-500';
    if (trend === 'down') return 'text-green-500';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Activity;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {change !== 0 && (
              <div className={`flex items-center mt-1 ${getTrendColor()}`}>
                <TrendIcon className="h-3 w-3 mr-1" />
                <span className="text-sm">
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-full">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de análise de erros
function ErrorAnalysisView({ 
  analytics, 
  filterCategory, 
  searchTerm, 
  onFilterChange, 
  onSearchChange 
}: {
  analytics: any;
  filterCategory: string;
  searchTerm: string;
  onFilterChange: (category: string) => void;
  onSearchChange: (term: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error Categories</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterCategory} onValueChange={onFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topErrorCategories.map((category: any, index: number) => (
              <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium capitalize">{category.category}</span>
                  <Badge variant={category.impact === 'high' ? 'destructive' : category.impact === 'medium' ? 'default' : 'secondary'}>
                    {category.impact}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} errors
                  </span>
                  <div className="flex items-center">
                    {category.trend === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : category.trend === 'decreasing' ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de performance
function PerformanceView({ summary }: { summary: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(summary).map(([metric, data]: [string, any]) => (
              <div key={metric} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{metric}</span>
                  <Badge variant="outline">
                    {data.count} samples
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Avg:</span>
                    <span>{data.avg.toFixed(2)}{metric === 'MEMORY_USAGE' ? '%' : 'ms'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min:</span>
                    <span>{data.min.toFixed(2)}{metric === 'MEMORY_USAGE' ? '%' : 'ms'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max:</span>
                    <span>{data.max.toFixed(2)}{metric === 'MEMORY_USAGE' ? '%' : 'ms'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de sessões
function SessionsView({ sessions }: { sessions: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent User Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.sessionId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <p className="font-medium text-sm">
                    {session.sessionId.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(session.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{session.pageViews} pages</p>
                  <p>{session.interactions} interactions</p>
                  <p className="text-red-500">{session.errors} errors</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Componente de tendências
function TrendsView({ 
  analysis, 
  period, 
  onPeriodChange 
}: { 
  analysis: any; 
  period: string; 
  onPeriodChange: (period: '1d' | '7d' | '30d') => void; 
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trend Analysis ({period})</CardTitle>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{analysis.totalErrors}</p>
                <p className="text-sm text-gray-600">Total Errors</p>
                <p className={`text-sm ${analysis.errorChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {analysis.errorChange > 0 ? '+' : ''}{analysis.errorChange}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{analysis.criticalChange}%</p>
                <p className="text-sm text-gray-600">Critical Change</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{analysis.resolutionChange}%</p>
                <p className="text-sm text-gray-600">Resolution Change</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Key Insights</h4>
              <ul className="space-y-1">
                {analysis.insights.map((insight: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Recommendations</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-blue-600 dark:text-blue-400">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de alertas
function AlertsView({ activeAlerts, resolvedAlerts }: { activeAlerts: AlertEvent[]; resolvedAlerts: AlertEvent[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium">{alert.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de ações rápidas
function QuickActionsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Analytics
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ErrorMonitoringDashboard;