/**
 * Edge Function para Sistema de Aprendizado Inteligente de Prompts
 * 
 * Funcionalidades:
 * - Análise de padrões em prompts
 * - Predição de eficácia 
 * - Cálculo de métricas de aprendizado
 * - Geração de recomendações personalizadas
 * - Atualização de benchmarks
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
            sessionId, 
            promptData, 
            contextData, 
            feedbackData,
            userId: requestUserId 
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

        // Headers para chamadas internas
        const internalHeaders = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        let result;

        switch (action) {
            case 'analyze_pattern':
                result = await analyzePromptPatterns(promptData, contextData, supabaseUrl, internalHeaders);
                break;

            case 'calculate_effectiveness':
                result = await calculateEffectivenessScore(promptData, feedbackData, supabaseUrl, internalHeaders);
                break;

            case 'log_learning_event':
                result = await logLearningEvent(
                    effectiveUserId, 
                    sessionId, 
                    promptData, 
                    contextData, 
                    supabaseUrl, 
                    internalHeaders
                );
                break;

            case 'generate_recommendations':
                result = await generatePersonalizedRecommendations(effectiveUserId, supabaseUrl, internalHeaders);
                break;

            case 'update_analytics':
                result = await updateAnalytics(effectiveUserId, supabaseUrl, internalHeaders);
                break;

            case 'get_benchmarks':
                result = await getUserBenchmarks(effectiveUserId, supabaseUrl, internalHeaders);
                break;

            default:
                throw new Error(`Ação inválida: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na Edge Function prompt-learning:', error);

        const errorResponse = {
            error: {
                code: 'LEARNING_FUNCTION_ERROR',
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
 * Analisa padrões nos prompts e identifica melhorias
 */
async function analyzePromptPatterns(promptData: any, contextData: any, supabaseUrl: string, headers: any) {
    const { original, enhanced, context } = promptData;
    
    // Análise de padrões básicos
    const patterns = {
        complexityLevel: analyzeComplexity(enhanced),
        contextDepth: analyzeContextDepth(context),
        structureScore: analyzeStructure(enhanced),
        clarityScore: analyzeClarity(enhanced),
        keywordDensity: analyzeKeywords(enhanced),
        improvementSuggestions: generateImprovementSuggestions(original, enhanced, context)
    };

    // Salvar padrão identificado
    await fetch(`${supabaseUrl}/rest/v1/prompt_patterns`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
            pattern_type: 'context_pattern',
            pattern_data: patterns,
            frequency: 1,
            effectiveness_score: 0.5, // Será atualizado baseado em feedback
            user_segment: determineUserSegment(contextData),
            confidence_level: 0.7
        })
    });

    return patterns;
}

/**
 * Calcula score de eficácia baseado em vários fatores
 */
async function calculateEffectivenessScore(promptData: any, feedbackData: any, supabaseUrl: string, headers: any) {
    const { userSatisfaction, completionRate, timeSpent, context } = feedbackData;
    
    // Algoritmo de scoring baseado em múltiplos fatores
    const scores = {
        userSatisfaction: (userSatisfaction / 5) * 0.4, // 40% peso
        completionRate: completionRate * 0.3, // 30% peso
        timeEfficiency: calculateTimeEfficiency(timeSpent, context) * 0.2, // 20% peso
        contextRelevance: analyzeContextRelevance(promptData, context) * 0.1 // 10% peso
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    return {
        overall: totalScore,
        breakdown: scores,
        grade: getEffectivenessGrade(totalScore),
        recommendations: generateScoreBasedRecommendations(scores, totalScore)
    };
}

/**
 * Registra evento de aprendizado
 */
async function logLearningEvent(
    userId: string, 
    sessionId: string, 
    promptData: any, 
    contextData: any, 
    supabaseUrl: string, 
    headers: any
) {
    const event = {
        user_id: userId,
        session_id: sessionId || crypto.randomUUID(),
        action_type: promptData.actionType || 'prompt_created',
        prompt_original: promptData.original || '',
        prompt_enhanced: promptData.enhanced || '',
        context_data: contextData || {},
        effectiveness_score: promptData.effectivenessScore || 0.0,
        completion_rate: promptData.completionRate || 0.0,
        time_spent_seconds: promptData.timeSpent || 0,
        user_satisfaction: promptData.userSatisfaction || null,
        tags: promptData.tags || [],
        metadata: {
            complexity: promptData.complexity,
            model: promptData.model,
            timestamp: new Date().toISOString()
        }
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/prompt_learning_events`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(event)
    });

    if (!response.ok) {
        throw new Error('Falha ao registrar evento de aprendizado');
    }

    return await response.json();
}

/**
 * Gera recomendações personalizadas baseadas no histórico do usuário
 */
async function generatePersonalizedRecommendations(userId: string, supabaseUrl: string, headers: any) {
    // Buscar histórico do usuário
    const historyResponse = await fetch(
        `${supabaseUrl}/rest/v1/prompt_learning_events?user_id=eq.${userId}&order=created_at.desc&limit=100`, 
        { headers }
    );

    if (!historyResponse.ok) {
        throw new Error('Falha ao buscar histórico do usuário');
    }

    const history = await historyResponse.json();
    
    // Analisar padrões no histórico
    const patterns = analyzeUserPatterns(history);
    
    // Gerar recomendações
    const recommendations = {
        promptImprovements: generatePromptImprovements(patterns),
        templateSuggestions: generateTemplateSuggestions(patterns),
        bestPractices: generateBestPractices(patterns),
        skillDevelopment: identifySkillGaps(patterns),
        personalizedTips: generatePersonalizedTips(patterns)
    };

    return recommendations;
}

/**
 * Atualiza analytics diários
 */
async function updateAnalytics(userId: string, supabaseUrl: string, headers: any) {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar eventos do dia
    const eventsResponse = await fetch(
        `${supabaseUrl}/rest/v1/prompt_learning_events?user_id=eq.${userId}&created_at=gte.${today}T00:00:00&created_at=lt.${today}T23:59:59`,
        { headers }
    );

    if (!eventsResponse.ok) {
        throw new Error('Falha ao buscar eventos do dia');
    }

    const events = await eventsResponse.json();
    
    // Calcular métricas do dia
    const analytics = calculateDailyMetrics(events);
    
    // Inserir ou atualizar analytics
    const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/prompt_analytics`, {
        method: 'POST',
        headers: { 
            ...headers, 
            'Prefer': 'resolution=merge-duplicates' 
        },
        body: JSON.stringify({
            user_id: userId,
            date: today,
            ...analytics
        })
    });

    if (!upsertResponse.ok) {
        throw new Error('Falha ao atualizar analytics');
    }

    return analytics;
}

/**
 * Obtém benchmarks do usuário
 */
async function getUserBenchmarks(userId: string, supabaseUrl: string, headers: any) {
    // Buscar métricas do usuário
    const userMetrics = await fetchUserMetrics(userId, supabaseUrl, headers);
    
    // Buscar benchmarks globais
    const globalBenchmarks = await fetchGlobalBenchmarks(supabaseUrl, headers);
    
    // Calcular comparações
    const comparison = calculateBenchmarkComparison(userMetrics, globalBenchmarks);
    
    return {
        userMetrics,
        globalBenchmarks,
        comparison,
        percentileRank: calculatePercentileRank(userMetrics, globalBenchmarks),
        improvementAreas: identifyImprovementAreas(userMetrics, globalBenchmarks)
    };
}

// Funções auxiliares para análise

function analyzeComplexity(prompt: string): string {
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = prompt.split(/\s+/).length / sentences.length;
    
    if (avgWordsPerSentence < 10) return 'low';
    if (avgWordsPerSentence < 20) return 'medium';
    return 'high';
}

function analyzeContextDepth(context: any): number {
    if (!context) return 0;
    
    let depth = 0;
    if (context.sections) depth += context.sections.length * 0.3;
    if (context.variables) depth += context.variables.length * 0.2;
    if (context.suggestedImprovements) depth += context.suggestedImprovements.length * 0.5;
    
    return Math.min(depth, 1.0);
}

function analyzeStructure(prompt: string): number {
    let score = 0;
    
    // Verificar estrutura com seções numeradas
    if (/^\d+\./m.test(prompt)) score += 0.3;
    
    // Verificar uso de marcadores
    if (/[-*•]/.test(prompt)) score += 0.2;
    
    // Verificar parágrafos bem estruturados
    const paragraphs = prompt.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 0.3;
    
    // Verificar palavras de transição
    if (/\b(primeiro|segundo|em seguida|finalmente|portanto|assim|logo)\b/i.test(prompt)) {
        score += 0.2;
    }
    
    return Math.min(score, 1.0);
}

function analyzeClarity(prompt: string): number {
    let score = 1.0;
    
    // Penalizar frases muito longas
    const sentences = prompt.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
    if (longSentences.length > 0) score -= 0.2;
    
    // Verificar clareza das instruções
    const instructionWords = /\b(instrua|explique|descreva|analise|crie|defina|especifique)\b/i;
    if (instructionWords.test(prompt)) score += 0.1;
    
    // Verificar ambiguidade
    const ambiguousWords = /\b(coisa|algo|qualquer|talvez|possivelmente)\b/i;
    if (ambiguousWords.test(prompt)) score -= 0.1;
    
    return Math.max(Math.min(score, 1.0), 0.0);
}

function analyzeKeywords(prompt: string): Record<string, number> {
    const words = prompt.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    const keywordCategories = {
        action: ['crie', 'desenvolva', 'construa', 'implemente', 'gera', 'produza'],
        analysis: ['analise', 'examine', 'avalie', 'estude', 'investigue', 'compreenda'],
        structure: ['estrutura', 'formato', 'organize', 'organize', 'sistema', 'layout'],
        context: ['contexto', 'situação', 'cenário', 'ambiente', 'condições', 'circunstâncias']
    };
    
    const results: Record<string, number> = {};
    
    Object.entries(keywordCategories).forEach(([category, keywords]) => {
        const count = keywords.filter(keyword => 
            words.some(word => word.includes(keyword))
        ).length;
        results[category] = count / totalWords;
    });
    
    return results;
}

function generateImprovementSuggestions(original: string, enhanced: string, context: any): string[] {
    const suggestions = [];
    
    if (enhanced.length / original.length < 1.2) {
        suggestions.push('Considere adicionar mais detalhes ao prompt');
    }
    
    if (!context.sections || context.sections.length < 3) {
        suggestions.push('Organize o prompt em seções claras');
    }
    
    if (!context.variables || context.variables.length === 0) {
        suggestions.push('Defina variáveis específicas para personalização');
    }
    
    if (!enhanced.includes('exemplo') && !enhanced.includes('por exemplo')) {
        suggestions.push('Adicione exemplos para maior clareza');
    }
    
    return suggestions;
}

function determineUserSegment(contextData: any): string {
    if (!contextData) return 'beginner';
    
    const complexity = contextData.complexity || 'low';
    const experience = contextData.userExperience || 'beginner';
    
    return experience || (complexity === 'high' ? 'advanced' : 'intermediate');
}

function calculateTimeEfficiency(timeSpent: number, context: any): number {
    // Baseado no tempo esperado para diferentes tipos de prompt
    const expectedTime = context?.expectedTime || 300; // 5 minutos padrão
    const efficiency = expectedTime / Math.max(timeSpent, 1);
    return Math.min(efficiency, 1.0);
}

function analyzeContextRelevance(promptData: any, context: any): number {
    // Algoritmo simples baseado na presença de palavras-chave contextuais
    if (!context || !promptData.enhanced) return 0.5;
    
    const prompt = promptData.enhanced.toLowerCase();
    const contextKeywords = context.keywords || [];
    
    const matches = contextKeywords.filter((keyword: string) => 
        prompt.includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(matches / Math.max(contextKeywords.length, 1), 1.0);
}

function getEffectivenessGrade(score: number): string {
    if (score >= 0.9) return 'Excelente';
    if (score >= 0.8) return 'Muito Bom';
    if (score >= 0.7) return 'Bom';
    if (score >= 0.6) return 'Regular';
    return 'Precisa Melhorar';
}

function generateScoreBasedRecommendations(scores: any, totalScore: number): string[] {
    const recommendations = [];
    
    if (scores.userSatisfaction < 0.6) {
        recommendations.push('Considere usar linguagem mais clara e específica');
    }
    
    if (scores.completionRate < 0.7) {
        recommendations.push('Divida o prompt em etapas menores e mais focadas');
    }
    
    if (scores.timeEfficiency < 0.5) {
        recommendations.push('Reduza a complexidade do prompt para maior eficiência');
    }
    
    if (scores.contextRelevance < 0.6) {
        recommendations.push('Inclua mais contexto específico na sua solicitação');
    }
    
    return recommendations;
}

function analyzeUserPatterns(history: any[]): any {
    const patterns = {
        mostUsedCategories: {},
        effectivenessTrends: [],
        commonImprovements: {},
        timePatterns: {},
        userSatisfactionTrend: []
    };
    
    history.forEach((event, index) => {
        // Categorias mais usadas
        if (event.tags) {
            event.tags.forEach((tag: string) => {
                patterns.mostUsedCategories[tag] = (patterns.mostUsedCategories[tag] || 0) + 1;
            });
        }
        
        // Tendências de eficácia
        if (event.effectiveness_score) {
            patterns.effectivenessTrends.push({
                date: event.created_at,
                score: event.effectiveness_score
            });
        }
        
        // Satisfação do usuário
        if (event.user_satisfaction) {
            patterns.userSatisfactionTrend.push({
                date: event.created_at,
                satisfaction: event.user_satisfaction
            });
        }
    });
    
    return patterns;
}

function generatePromptImprovements(patterns: any): string[] {
    const improvements = [];
    
    if (patterns.effectivenessTrends.length > 0) {
        const recentEffectiveness = patterns.effectivenessTrends
            .slice(-5)
            .reduce((sum: number, trend: any) => sum + trend.score, 0) / 5;
        
        if (recentEffectiveness < 0.7) {
            improvements.push('Seus prompts recentes têm eficácia abaixo da média. Considere usar mais exemplos específicos.');
        }
    }
    
    return improvements;
}

function generateTemplateSuggestions(patterns: any): string[] {
    const suggestions = [];
    const topCategories = Object.entries(patterns.mostUsedCategories)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 3)
        .map(([category]: any) => category);
    
    if (topCategories.length > 0) {
        suggestions.push(`Crie templates para suas categorias mais usadas: ${topCategories.join(', ')}`);
    }
    
    return suggestions;
}

function generateBestPractices(patterns: any): string[] {
    return [
        'Use sempre seções numeradas para organizar suas solicitações',
        'Inclua exemplos específicos para maior clareza',
        'Defina variáveis para personalização quando relevante',
        'Mantenha os prompts focados em uma tarefa específica',
        'Use linguagem direta e específica'
    ];
}

function identifySkillGaps(patterns: any): string[] {
    const gaps = [];
    
    if (patterns.userSatisfactionTrend.length > 0) {
        const recentSatisfaction = patterns.userSatisfactionTrend
            .slice(-10)
            .reduce((sum: number, item: any) => sum + item.satisfaction, 0) / 10;
        
        if (recentSatisfaction < 3.5) {
            gaps.push('Clareza na comunicação');
        }
    }
    
    return gaps;
}

function generatePersonalizedTips(patterns: any): string[] {
    const tips = [];
    
    // Baseado no histórico de eficácia
    if (patterns.effectivenessTrends.length > 0) {
        const avgEffectiveness = patterns.effectivenessTrends
            .reduce((sum: number, trend: any) => sum + trend.score, 0) / patterns.effectivenessTrends.length;
        
        if (avgEffectiveness > 0.8) {
            tips.push('🎉 Parabéns! Você está criando prompts muito eficazes. Continue assim!');
        } else if (avgEffectiveness < 0.6) {
            tips.push('💡 Que tal experimentar com mais contexto e exemplos em seus próximos prompts?');
        }
    }
    
    return tips;
}

function calculateDailyMetrics(events: any[]): any {
    if (events.length === 0) {
        return {
            total_prompts_created: 0,
            total_prompts_used: 0,
            average_effectiveness: 0.0,
            average_completion_rate: 0.0,
            most_used_categories: {},
            most_effective_patterns: {},
            improvement_suggestions: [],
            benchmark_comparison: {}
        };
    }
    
    const totalPrompts = events.length;
    const totalEffectiveness = events.reduce((sum, event) => sum + (event.effectiveness_score || 0), 0);
    const totalCompletionRate = events.reduce((sum, event) => sum + (event.completion_rate || 0), 0);
    
    // Categorias mais usadas
    const categories: Record<string, number> = {};
    events.forEach(event => {
        if (event.tags) {
            event.tags.forEach((tag: string) => {
                categories[tag] = (categories[tag] || 0) + 1;
            });
        }
    });
    
    return {
        total_prompts_created: totalPrompts,
        total_prompts_used: totalPrompts, // Simplificação
        average_effectiveness: totalEffectiveness / totalPrompts,
        average_completion_rate: totalCompletionRate / totalPrompts,
        most_used_categories: categories,
        most_effective_patterns: {}, // Será preenchido pela análise de padrões
        improvement_suggestions: [],
        benchmark_comparison: {}
    };
}

async function fetchUserMetrics(userId: string, supabaseUrl: string, headers: any): Promise<any> {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_analytics?user_id=eq.${userId}&order=date.desc&limit=30`,
        { headers }
    );
    
    if (!response.ok) {
        return {};
    }
    
    return await response.json();
}

async function fetchGlobalBenchmarks(supabaseUrl: string, headers: any): Promise<any> {
    // Buscar benchmarks globais (média de todos os usuários)
    const response = await fetch(
        `${supabaseUrl}/rest/v1/prompt_benchmarks?order=created_at.desc&limit=50`,
        { headers }
    );
    
    if (!response.ok) {
        return {};
    }
    
    return await response.json();
}

function calculateBenchmarkComparison(userMetrics: any[], globalBenchmarks: any[]): any {
    // Implementação simplificada - comparar com médias globais
    return {
        effectiveness: 'Acima da média',
        completionRate: 'Na média',
        userSatisfaction: 'Abaixo da média'
    };
}

function calculatePercentileRank(userMetrics: any[], globalBenchmarks: any[]): number {
    // Cálculo simplificado de percentil
    return Math.floor(Math.random() * 100) + 1; // Placeholder
}

function identifyImprovementAreas(userMetrics: any[], globalBenchmarks: any[]): string[] {
    return [
        'Clareza nas instruções',
        'Uso de exemplos',
        'Estruturação de conteúdo'
    ];
}