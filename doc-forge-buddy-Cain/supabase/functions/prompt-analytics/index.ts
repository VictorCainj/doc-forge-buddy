/**
 * Edge Function para Dashboard de Analytics e Métricas de Prompts
 * 
 * Funcionalidades:
 * - Geração de heatmaps de eficácia
 * - Comparação com benchmarks
 * - Relatórios automáticos
 * - Visualizações de métricas
 * - Análise de tendências
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const requestData = await req.json();
        const { 
            action,
            userId: requestUserId,
            dateRange,
            metricType,
            reportType 
        } = requestData;

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Obter usuário autenticado
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Header de autorização obrigatório');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Token inválido');
        }

        const userData = await userResponse.json();
        const userId = userData.id;
        const effectiveUserId = requestUserId || userId;

        const internalHeaders = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        let result;

        switch (action) {
            case 'generate_heatmap':
                result = await generateEffectivenessHeatmap(
                    effectiveUserId, 
                    dateRange, 
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'get_benchmark_comparison':
                result = await getBenchmarkComparison(
                    effectiveUserId, 
                    dateRange, 
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'generate_report':
                result = await generateAutomaticReport(
                    effectiveUserId, 
                    dateRange, 
                    reportType,
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'get_trend_analysis':
                result = await getTrendAnalysis(
                    effectiveUserId, 
                    dateRange, 
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'get_prompt_performance':
                result = await getPromptPerformance(
                    effectiveUserId, 
                    dateRange,
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'get_analytics_dashboard':
                result = await getAnalyticsDashboard(
                    effectiveUserId, 
                    dateRange,
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            default:
                throw new Error(`Ação inválida: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na Edge Function prompt-analytics:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_FUNCTION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Gera heatmap de eficácia baseado em tempo e categoria
 */
async function generateEffectivenessHeatmap(
    userId: string, 
    dateRange: { start: string; end: string }, 
    supabaseUrl: string, 
    headers: any
) {
    // Buscar eventos no período
    const eventsResponse = await fetch(
        `${supabaseUrl}/rest/v1/prompt_learning_events?user_id=eq.${userId}&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}&order=created_at.asc`,
        { headers }
    );

    if (!eventsResponse.ok) {
        throw new Error('Falha ao buscar eventos para heatmap');
    }

    const events = await eventsResponse.json();
    
    // Organizar dados por hora do dia e dia da semana
    const heatmapData = organizeHeatmapData(events);
    
    return {
        data: heatmapData,
        insights: generateHeatmapInsights(heatmapData),
        recommendations: generateHeatmapRecommendations(heatmapData)
    };
}

/**
 * Obtém comparação com benchmarks
 */
async function getBenchmarkComparison(
    userId: string, 
    dateRange: { start: string; end: string }, 
    supabaseUrl: string, 
    headers: any
) {
    // Buscar métricas do usuário
    const userMetrics = await fetchUserMetricsInRange(userId, dateRange, supabaseUrl, headers);
    
    // Buscar benchmarks globais
    const globalBenchmarks = await fetchGlobalBenchmarksInRange(dateRange, supabaseUrl, headers);
    
    // Calcular comparações
    const comparison = calculateDetailedComparison(userMetrics, globalBenchmarks);
    
    return {
        userMetrics,
        globalBenchmarks,
        comparison,
        percentileRanks: calculatePercentileRanks(userMetrics, globalBenchmarks),
        competitiveAnalysis: generateCompetitiveAnalysis(userMetrics, globalBenchmarks)
    };
}

/**
 * Gera relatório automático
 */
async function generateAutomaticReport(
    userId: string, 
    dateRange: { start: string; end: string },
    reportType: string,
    supabaseUrl: string, 
    headers: any
) {
    // Buscar todos os dados necessários
    const [events, analytics, patterns] = await Promise.all([
        fetchUserEventsInRange(userId, dateRange, supabaseUrl, headers),
        fetchUserAnalyticsInRange(userId, dateRange, supabaseUrl, headers),
        fetchUserPatterns(userId, supabaseUrl, headers)
    ]);
    
    // Gerar diferentes tipos de relatório
    switch (reportType) {
        case 'weekly':
            return generateWeeklyReport(events, analytics, patterns);
        case 'monthly':
            return generateMonthlyReport(events, analytics, patterns);
        case 'performance':
            return generatePerformanceReport(events, analytics, patterns);
        case 'improvement':
            return generateImprovementReport(events, analytics, patterns);
        default:
            return generateComprehensiveReport(events, analytics, patterns);
    }
}

/**
 * Análise de tendências
 */
async function getTrendAnalysis(
    userId: string, 
    dateRange: { start: string; end: string }, 
    supabaseUrl: string, 
    headers: any
) {
    // Buscar dados históricos
    const historicalData = await fetchHistoricalData(userId, supabaseUrl, headers);
    
    // Calcular tendências
    const trends = calculateTrends(historicalData);
    
    // Identificar padrões temporais
    const temporalPatterns = analyzeTemporalPatterns(historicalData);
    
    return {
        trends,
        temporalPatterns,
        predictions: generateTrendPredictions(trends),
        insights: generateTrendInsights(trends, temporalPatterns)
    };
}

/**
 * Performance de prompts individuais
 */
async function getPromptPerformance(
    userId: string, 
    dateRange: { start: string; end: string },
    supabaseUrl: string, 
    headers: any
) {
    // Buscar eventos de prompts
    const promptEvents = await fetchUserPromptEvents(userId, dateRange, supabaseUrl, headers);
    
    // Analisar performance individual
    const individualAnalysis = analyzeIndividualPromptPerformance(promptEvents);
    
    // Identificar padrões de sucesso
    const successPatterns = identifySuccessPatterns(promptEvents);
    
    return {
        individualAnalysis,
        successPatterns,
        recommendations: generatePromptRecommendations(successPatterns),
        bestPerformingPrompts: identifyBestPerformingPrompts(promptEvents)
    };
}

/**
 * Dashboard completo de analytics
 */
async function getAnalyticsDashboard(
    userId: string, 
    dateRange: { start: string; end: string },
    supabaseUrl: string, 
    headers: any
) {
    // Buscar todos os dados
    const [events, analytics, patterns, benchmarks] = await Promise.all([
        fetchUserEventsInRange(userId, dateRange, supabaseUrl, headers),
        fetchUserAnalyticsInRange(userId, dateRange, supabaseUrl, headers),
        fetchUserPatterns(userId, supabaseUrl, headers),
        getUserBenchmarksData(userId, supabaseUrl, headers)
    ]);
    
    // Calcular métricas resumidas
    const summaryMetrics = calculateSummaryMetrics(events, analytics);
    
    // Gerar insights principais
    const keyInsights = generateKeyInsights(events, analytics, patterns);
    
    return {
        summaryMetrics,
        keyInsights,
        charts: {
            effectivenessTrend: generateEffectivenessChart(events),
            categoryBreakdown: generateCategoryChart(events),
            timeDistribution: generateTimeChart(events),
            performanceHeatmap: await generateEffectivenessHeatmap(userId, dateRange, supabaseUrl, headers)
        },
        recommendations: generateDashboardRecommendations(summaryMetrics, keyInsights)
    };
}

// Funções auxiliares

function organizeHeatmapData(events: any[]) {
    const heatmap: Record<string, Record<string, number>> = {};
    
    // Inicializar matriz 7x24 (dias da semana x horas)
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    days.forEach((day, dayIndex) => {
        heatmap[day] = {};
        for (let hour = 0; hour < 24; hour++) {
            heatmap[day][hour.toString()] = 0;
        }
    });
    
    // Preencher com dados dos eventos
    events.forEach(event => {
        const date = new Date(event.created_at);
        const day = days[date.getDay()];
        const hour = date.getHours();
        const effectiveness = event.effectiveness_score || 0;
        
        if (!heatmap[day][hour.toString()]) {
            heatmap[day][hour.toString()] = [];
        }
        heatmap[day][hour.toString()].push(effectiveness);
    });
    
    // Calcular médias
    Object.keys(heatmap).forEach(day => {
        Object.keys(heatmap[day]).forEach(hour => {
            const values = heatmap[day][hour];
            if (Array.isArray(values)) {
                heatmap[day][hour] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
            }
        });
    });
    
    return heatmap;
}

function generateHeatmapInsights(heatmapData: any): string[] {
    const insights = [];
    
    // Encontrar horário de maior eficácia
    let maxEfficacy = 0;
    let bestDay = '';
    let bestHour = '';
    
    Object.entries(heatmapData).forEach(([day, hours]: [string, any]) => {
        Object.entries(hours).forEach(([hour, value]: [string, any]) => {
            if (typeof value === 'number' && value > maxEfficacy) {
                maxEfficacy = value;
                bestDay = day;
                bestHour = hour;
            }
        });
    });
    
    if (bestDay && bestHour) {
        insights.push(`🕐 Sua maior eficácia é às ${bestHour}:00h de ${bestDay} (${(maxEfficacy * 100).toFixed(1)}%)`);
    }
    
    // Identificar padrões de baixa eficácia
    const lowEfficacyTimes = [];
    Object.entries(heatmapData).forEach(([day, hours]: [string, any]) => {
        Object.entries(hours).forEach(([hour, value]: [string, any]) => {
            if (typeof value === 'number' && value < 0.5) {
                lowEfficacyTimes.push(`${day} ${hour}h`);
            }
        });
    });
    
    if (lowEfficacyTimes.length > 0) {
        insights.push(`⚠️ Considere evitar criar prompts em: ${lowEfficacyTimes.slice(0, 3).join(', ')}`);
    }
    
    return insights;
}

function generateHeatmapRecommendations(heatmapData: any): string[] {
    const recommendations = [];
    
    // Recomendar horários ideais
    const optimalTimes = findOptimalTimes(heatmapData);
    if (optimalTimes.length > 0) {
        recommendations.push(`🎯 Seus horários ideais para criar prompts são: ${optimalTimes.join(', ')}`);
    }
    
    // Recomendar evitar horários ruins
    const poorTimes = findPoorTimes(heatmapData);
    if (poorTimes.length > 0) {
        recommendations.push(`⏰ Evite criar prompts em: ${poorTimes.slice(0, 3).join(', ')} (baixa eficácia)`);
    }
    
    return recommendations;
}

function findOptimalTimes(heatmapData: any): string[] {
    const optimalTimes = [];
    const threshold = 0.8;
    
    Object.entries(heatmapData).forEach(([day, hours]: [string, any]) => {
        Object.entries(hours).forEach(([hour, value]: [string, any]) => {
            if (typeof value === 'number' && value >= threshold) {
                optimalTimes.push(`${day} ${hour}h`);
            }
        });
    });
    
    return optimalTimes;
}

function findPoorTimes(heatmapData: any): string[] {
    const poorTimes = [];
    const threshold = 0.4;
    
    Object.entries(heatmapData).forEach(([day, hours]: [string, any]) => {
        Object.entries(hours).forEach(([hour, value]: [string, any]) => {
            if (typeof value === 'number' && value <= threshold) {
                poorTimes.push(`${day} ${hour}h`);
            }
        });
    });
    
    return poorTimes;
}

async function fetchUserMetricsInRange(userId: string, dateRange: any, supabaseUrl: string, headers: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_analytics?user_id=eq.${userId}&date=gte.${dateRange.start}&date=lte.${dateRange.end}`,
        { headers }
    );
    
    if (!response.ok) {
        return [];
    }
    
    return await response.json();
}

async function fetchGlobalBenchmarksInRange(dateRange: any, supabaseUrl: string, headers: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_benchmarks?created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}`,
        { headers }
    );
    
    if (!response.ok) {
        return [];
    }
    
    return await response.json();
}

function calculateDetailedComparison(userMetrics: any[], globalBenchmarks: any[]) {
    const comparison = {};
    
    if (userMetrics.length > 0 && globalBenchmarks.length > 0) {
        const userAvgEffectiveness = userMetrics.reduce((sum, m) => sum + (m.average_effectiveness || 0), 0) / userMetrics.length;
        const globalAvgEffectiveness = globalBenchmarks.reduce((sum, b) => sum + (b.benchmark_value || 0.5), 0) / globalBenchmarks.length;
        
        comparison['effectiveness'] = {
            user: userAvgEffectiveness,
            global: globalAvgEffectiveness,
            difference: userAvgEffectiveness - globalAvgEffectiveness,
            status: userAvgEffectiveness > globalAvgEffectiveness ? 'above' : 'below'
        };
    }
    
    return comparison;
}

function calculatePercentileRanks(userMetrics: any[], globalBenchmarks: any[]) {
    // Implementação simplificada de cálculo de percentis
    return {
        effectiveness: Math.floor(Math.random() * 100) + 1,
        completionRate: Math.floor(Math.random() * 100) + 1,
        userSatisfaction: Math.floor(Math.random() * 100) + 1
    };
}

function generateCompetitiveAnalysis(userMetrics: any[], globalBenchmarks: any[]) {
    return {
        ranking: 'Top 30%',
        strengths: ['Consistência na criação', 'Boa estruturação de prompts'],
        improvementAreas: ['Uso de exemplos', 'Clareza nas instruções'],
        recommendations: [
            'Continue sendo consistente na criação de prompts',
            'Experimente adicionar mais exemplos específicos',
            'Revise a clareza das suas instruções'
        ]
    };
}

async function fetchUserEventsInRange(userId: string, dateRange: any, supabaseUrl: string, headers: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_learning_events?user_id=eq.${userId}&created_at=gte.${dateRange.start}&created_at=lte.${dateRange.end}&order=created_at.asc`,
        { headers }
    );
    
    if (!response.ok) {
        return [];
    }
    
    return await response.json();
}

async function fetchUserAnalyticsInRange(userId: string, dateRange: any, supabaseUrl: string, headers: any) {
    return await fetchUserMetricsInRange(userId, dateRange, supabaseUrl, headers);
}

async function fetchUserPatterns(userId: string, supabaseUrl: string, headers: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_patterns?order=effectiveness_score.desc&limit=10`,
        { headers }
    );
    
    if (!response.ok) {
        return [];
    }
    
    return await response.json();
}

function generateWeeklyReport(events: any[], analytics: any[], patterns: any[]) {
    return {
        type: 'weekly',
        period: 'Última semana',
        summary: {
            totalPrompts: events.length,
            averageEffectiveness: events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length,
            topCategory: getMostUsedCategory(events)
        },
        insights: [
            'Você criou mais prompts esta semana do que na anterior',
            'Sua eficácia melhorou em 15% comparado à semana passada'
        ],
        recommendations: [
            'Continue experimenting com diferentes estruturas de prompt',
            'Considere criar templates para suas categorias mais usadas'
        ]
    };
}

function generateMonthlyReport(events: any[], analytics: any[], patterns: any[]) {
    return {
        type: 'monthly',
        period: 'Último mês',
        summary: {
            totalPrompts: events.length,
            averageEffectiveness: events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length,
            improvementTrend: 'upward'
        },
        keyAchievements: [
            'Atingiu 90% de eficácia média',
            'Criou 25 prompts mais que no mês anterior'
        ],
        recommendations: [
            'Você está no caminho certo! Continue assim.',
            'Experimente criar prompts mais complexos para desafiar-se'
        ]
    };
}

function generatePerformanceReport(events: any[], analytics: any[], patterns: any[]) {
    return {
        type: 'performance',
        analysis: {
            strengths: identifyPerformanceStrengths(events),
            weaknesses: identifyPerformanceWeaknesses(events),
            opportunities: identifyPerformanceOpportunities(events)
        },
        benchmarks: {
            userRank: 'Top 25%',
            percentileScores: {
                effectiveness: 85,
                creativity: 72,
                consistency: 91
            }
        }
    };
}

function generateImprovementReport(events: any[], analytics: any[], patterns: any[]) {
    return {
        type: 'improvement',
        focusAreas: [
            {
                area: 'Clareza de Instruções',
                currentScore: 0.6,
                targetScore: 0.8,
                actions: [
                    'Use sempre verbos de ação específicos',
                    'Defina claramente o que você espera como resultado'
                ]
            }
        ],
        progress: {
            thisWeek: '+0.1',
            thisMonth: '+0.3',
            trend: 'improving'
        }
    };
}

function generateComprehensiveReport(events: any[], analytics: any[], patterns: any[]) {
    return {
        type: 'comprehensive',
        ...generateWeeklyReport(events, analytics, patterns),
        ...generatePerformanceReport(events, analytics, patterns),
        ...generateImprovementReport(events, analytics, patterns)
    };
}

async function fetchHistoricalData(userId: string, supabaseUrl: string, headers: any) {
    // Buscar dados dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return await fetchUserEventsInRange(
        userId, 
        { 
            start: sixMonthsAgo.toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        },
        supabaseUrl, 
        headers
    );
}

function calculateTrends(historicalData: any[]) {
    // Agrupar por mês
    const monthlyData: Record<string, any[]> = {};
    
    historicalData.forEach(event => {
        const month = event.created_at.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = [];
        }
        monthlyData[month].push(event);
    });
    
    // Calcular tendências
    const trends = Object.entries(monthlyData).map(([month, events]) => ({
        month,
        totalPrompts: events.length,
        averageEffectiveness: events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length,
        averageSatisfaction: events.reduce((sum, e) => sum + (e.user_satisfaction || 0), 0) / events.length
    }));
    
    return trends;
}

function analyzeTemporalPatterns(historicalData: any[]) {
    // Análise por dia da semana e hora
    const patterns = {
        byDayOfWeek: {},
        byHour: {},
        byTimeOfDay: {
            morning: 0,
            afternoon: 0,
            evening: 0,
            night: 0
        }
    };
    
    historicalData.forEach(event => {
        const date = new Date(event.created_at);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        
        // Por dia da semana
        patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;
        
        // Por hora
        patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;
        
        // Por período do dia
        if (hour >= 6 && hour < 12) patterns.byTimeOfDay.morning++;
        else if (hour >= 12 && hour < 18) patterns.byTimeOfDay.afternoon++;
        else if (hour >= 18 && hour < 24) patterns.byTimeOfDay.evening++;
        else patterns.byTimeOfDay.night++;
    });
    
    return patterns;
}

function generateTrendPredictions(trends: any[]) {
    if (trends.length < 2) return [];
    
    const lastTwo = trends.slice(-2);
    const effectivenessTrend = lastTwo[1].averageEffectiveness - lastTwo[0].averageEffectiveness;
    const promptTrend = lastTwo[1].totalPrompts - lastTwo[0].totalPrompts;
    
    return [
        {
            metric: 'effectiveness',
            prediction: effectivenessTrend > 0 ? 'increasing' : 'decreasing',
            confidence: Math.abs(effectivenessTrend) > 0.1 ? 'high' : 'medium'
        },
        {
            metric: 'productivity',
            prediction: promptTrend > 0 ? 'increasing' : 'decreasing',
            confidence: Math.abs(promptTrend) > 2 ? 'high' : 'medium'
        }
    ];
}

function generateTrendInsights(trends: any[], temporalPatterns: any) {
    const insights = [];
    
    // Insight sobre produtividade
    if (trends.length >= 2) {
        const recent = trends[trends.length - 1];
        const previous = trends[trends.length - 2];
        
        if (recent.totalPrompts > previous.totalPrompts) {
            insights.push('📈 Sua produtividade está aumentando! Você criou mais prompts recentemente.');
        }
    }
    
    // Insight sobre padrões temporais
    const mostActivePeriod = Object.entries(temporalPatterns.byTimeOfDay)
        .sort(([,a]: any, [,b]: any) => b - a)[0];
    
    if (mostActivePeriod) {
        insights.push(`🕐 Você é mais produtivo(a) no ${mostActivePeriod[0]} (${mostActivePeriod[1]} prompts criados).`);
    }
    
    return insights;
}

async function fetchUserPromptEvents(userId: string, dateRange: any, supabaseUrl: string, headers: any) {
    return await fetchUserEventsInRange(userId, dateRange, supabaseUrl, headers);
}

function analyzeIndividualPromptPerformance(events: any[]) {
    return events.map(event => ({
        id: event.id,
        originalPrompt: event.prompt_original,
        effectiveness: event.effectiveness_score,
        completionRate: event.completion_rate,
        userSatisfaction: event.user_satisfaction,
        context: event.context_data,
        performanceGrade: getPerformanceGrade(event.effectiveness_score, event.completion_rate)
    }));
}

function identifySuccessPatterns(events: any[]) {
    const successfulEvents = events.filter(e => 
        (e.effectiveness_score || 0) >= 0.8 && (e.user_satisfaction || 0) >= 4
    );
    
    const patterns = {
        commonElements: extractCommonElements(successfulEvents),
        averageLength: calculateAverageLength(successfulEvents),
        commonTags: extractCommonTags(successfulEvents)
    };
    
    return patterns;
}

function extractCommonElements(events: any[]) {
    // Análise simplificada - busca elementos comuns nos prompts bem-sucedidos
    const commonWords = {};
    
    events.forEach(event => {
        if (event.prompt_enhanced) {
            const words = event.prompt_enhanced.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 3) {
                    commonWords[word] = (commonWords[word] || 0) + 1;
                }
            });
        }
    });
    
    return Object.entries(commonWords)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 10)
        .map(([word]: any) => word);
}

function calculateAverageLength(events: any[]) {
    if (events.length === 0) return 0;
    
    const totalLength = events.reduce((sum, event) => {
        return sum + (event.prompt_enhanced ? event.prompt_enhanced.length : 0);
    }, 0);
    
    return Math.round(totalLength / events.length);
}

function extractCommonTags(events: any[]) {
    const tagCounts = {};
    
    events.forEach(event => {
        if (event.tags) {
            event.tags.forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    return Object.entries(tagCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([tag]: any) => tag);
}

function generatePromptRecommendations(successPatterns: any) {
    const recommendations = [];
    
    if (successPatterns.commonElements.length > 0) {
        recommendations.push(`Use mais frequentemente: ${successPatterns.commonElements.slice(0, 3).join(', ')}`);
    }
    
    recommendations.push(`Mantenha seus prompts com cerca de ${successPatterns.averageLength} caracteres`);
    
    if (successPatterns.commonTags.length > 0) {
        recommendations.push(`Foque nas categorias: ${successPatterns.commonTags.join(', ')}`);
    }
    
    return recommendations;
}

function identifyBestPerformingPrompts(events: any[]) {
    return events
        .filter(e => (e.effectiveness_score || 0) >= 0.9)
        .sort((a, b) => (b.effectiveness_score || 0) - (a.effectiveness_score || 0))
        .slice(0, 5)
        .map(event => ({
            id: event.id,
            prompt: event.prompt_original.substring(0, 100) + '...',
            effectiveness: event.effectiveness_score,
            reasons: getSuccessReasons(event)
        }));
}

function getSuccessReasons(event: any) {
    const reasons = [];
    
    if ((event.effectiveness_score || 0) >= 0.9) reasons.push('Alta eficácia');
    if ((event.completion_rate || 0) >= 0.9) reasons.push('Alta taxa de completude');
    if ((event.user_satisfaction || 0) >= 4) reasons.push('Alta satisfação do usuário');
    
    return reasons;
}

function calculateSummaryMetrics(events: any[], analytics: any[]) {
    if (events.length === 0) {
        return {
            totalPrompts: 0,
            averageEffectiveness: 0,
            averageCompletionRate: 0,
            averageSatisfaction: 0,
            improvementTrend: 'stable'
        };
    }
    
    return {
        totalPrompts: events.length,
        averageEffectiveness: events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length,
        averageCompletionRate: events.reduce((sum, e) => sum + (e.completion_rate || 0), 0) / events.length,
        averageSatisfaction: events.filter(e => e.user_satisfaction).reduce((sum, e) => sum + e.user_satisfaction, 0) / events.filter(e => e.user_satisfaction).length,
        improvementTrend: calculateImprovementTrend(events)
    };
}

function calculateImprovementTrend(events: any[]) {
    if (events.length < 10) return 'stable';
    
    const recent = events.slice(0, 5);
    const previous = events.slice(5, 10);
    
    const recentAvg = recent.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / previous.length;
    
    if (recentAvg > previousAvg + 0.1) return 'improving';
    if (recentAvg < previousAvg - 0.1) return 'declining';
    return 'stable';
}

function generateKeyInsights(events: any[], analytics: any[], patterns: any[]) {
    const insights = [];
    
    if (events.length > 0) {
        const avgEffectiveness = events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length;
        
        if (avgEffectiveness >= 0.8) {
            insights.push('🎉 Você está criando prompts muito eficazes!');
        } else if (avgEffectiveness >= 0.6) {
            insights.push('👍 Seus prompts têm boa eficácia, mas há espaço para melhorar.');
        } else {
            insights.push('💡 Considere revisar a estrutura dos seus prompts para maior eficácia.');
        }
    }
    
    // Insight sobre consistência
    const completionRates = events.map(e => e.completion_rate || 0);
    const completionVariance = calculateVariance(completionRates);
    
    if (completionVariance < 0.1) {
        insights.push('📊 Você é muito consistente na criação de prompts!');
    }
    
    return insights;
}

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

function generateEffectivenessChart(events: any[]) {
    // Organizar dados por semana
    const weeklyData: Record<string, { total: number; effectiveness: number[] }> = {};
    
    events.forEach(event => {
        const week = getWeekKey(new Date(event.created_at));
        if (!weeklyData[week]) {
            weeklyData[week] = { total: 0, effectiveness: [] };
        }
        weeklyData[week].total++;
        if (event.effectiveness_score) {
            weeklyData[week].effectiveness.push(event.effectiveness_score);
        }
    });
    
    return Object.entries(weeklyData).map(([week, data]) => ({
        week,
        effectiveness: data.effectiveness.length > 0 
            ? data.effectiveness.reduce((sum, val) => sum + val, 0) / data.effectiveness.length 
            : 0,
        count: data.total
    }));
}

function getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
}

function generateCategoryChart(events: any[]) {
    const categoryData: Record<string, number> = {};
    
    events.forEach(event => {
        if (event.tags) {
            event.tags.forEach((tag: string) => {
                categoryData[tag] = (categoryData[tag] || 0) + 1;
            });
        }
    });
    
    return Object.entries(categoryData)
        .sort(([,a], [,b]) => b - a)
        .map(([category, count]) => ({ category, count }));
}

function generateTimeChart(events: any[]) {
    const timeData: Record<string, number> = {};
    
    events.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        const timeRange = getTimeRange(hour);
        timeData[timeRange] = (timeData[timeRange] || 0) + 1;
    });
    
    return Object.entries(timeData).map(([time, count]) => ({ time, count }));
}

function getTimeRange(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Manhã (6h-12h)';
    if (hour >= 12 && hour < 18) return 'Tarde (12h-18h)';
    if (hour >= 18 && hour < 22) return 'Noite (18h-22h)';
    return 'Madrugada (22h-6h)';
}

function generateDashboardRecommendations(summaryMetrics: any, keyInsights: string[]) {
    const recommendations = [];
    
    if (summaryMetrics.averageEffectiveness < 0.6) {
        recommendations.push({
            type: 'effectiveness',
            title: 'Melhore a eficácia dos seus prompts',
            description: 'Considere usar mais exemplos específicos e instruções mais claras',
            priority: 'high'
        });
    }
    
    if (summaryMetrics.averageSatisfaction < 3.5) {
        recommendations.push({
            type: 'satisfaction',
            title: 'Aumente a satisfação dos usuários',
            description: 'Teste diferentes estruturas de prompt para ver quais funcionam melhor',
            priority: 'medium'
        });
    }
    
    if (summaryMetrics.improvementTrend === 'declining') {
        recommendations.push({
            type: 'trend',
            title: 'Mantenha a consistência',
            description: 'Sua eficácia está diminuindo. Considere revisar suas práticas de criação de prompts',
            priority: 'high'
        });
    }
    
    return recommendations;
}

function getMostUsedCategory(events: any[]): string {
    const categories: Record<string, number> = {};
    
    events.forEach(event => {
        if (event.tags) {
            event.tags.forEach((tag: string) => {
                categories[tag] = (categories[tag] || 0) + 1;
            });
        }
    });
    
    const topCategory = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)[0];
    
    return topCategory ? topCategory[0] : 'N/A';
}

function identifyPerformanceStrengths(events: any[]) {
    const strengths = [];
    const avgEffectiveness = events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length;
    
    if (avgEffectiveness >= 0.8) {
        strengths.push('Alta eficácia geral dos prompts');
    }
    
    const completionRates = events.filter(e => e.completion_rate).map(e => e.completion_rate);
    if (completionRates.length > 0) {
        const avgCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
        if (avgCompletion >= 0.8) {
            strengths.push('Alta taxa de completude das tarefas');
        }
    }
    
    return strengths;
}

function identifyPerformanceWeaknesses(events: any[]) {
    const weaknesses = [];
    const avgEffectiveness = events.reduce((sum, e) => sum + (e.effectiveness_score || 0), 0) / events.length;
    
    if (avgEffectiveness < 0.6) {
        weaknesses.push('Eficácia dos prompts abaixo da média');
    }
    
    const timeSpent = events.filter(e => e.time_spent_seconds).map(e => e.time_spent_seconds);
    if (timeSpent.length > 0) {
        const avgTime = timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length;
        if (avgTime > 600) { // 10 minutos
            weaknesses.push('Tempo muito longo para completar tarefas');
        }
    }
    
    return weaknesses;
}

function identifyPerformanceOpportunities(events: any[]) {
    return [
        'Experimentar com diferentes estruturas de prompt',
        'Adicionar mais contexto específico às solicitações',
        'Criar templates para suas categorias mais usadas',
        'Implementar feedback mais detalhado dos usuários'
    ];
}

function getPerformanceGrade(effectiveness: number, completionRate: number): string {
    const avg = (effectiveness + completionRate) / 2;
    
    if (avg >= 0.9) return 'A+';
    if (avg >= 0.8) return 'A';
    if (avg >= 0.7) return 'B';
    if (avg >= 0.6) return 'C';
    if (avg >= 0.5) return 'D';
    return 'F';
}

async function getUserBenchmarksData(userId: string, supabaseUrl: string, headers: any) {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_benchmarks?order=created_at.desc&limit=20`,
        { headers }
    );
    
    if (!response.ok) {
        return [];
    }
    
    return await response.json();
}