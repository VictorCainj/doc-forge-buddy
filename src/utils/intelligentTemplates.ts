import {
  analyzeTextAdvanced,
  TextAnalysisResult,
} from './advancedTextAnalysis';

export interface SmartTemplate {
  id: string;
  name: string;
  category: 'contract' | 'communication' | 'report' | 'legal' | 'marketing';
  description: string;
  template: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  suggestions: string[];
  usage: number;
  rating: number;
  lastUsed?: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  validation?: (value: string | number | boolean) => boolean;
  description: string;
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'require' | 'optional';
}

export interface DocumentGenerationResult {
  content: string;
  metadata: {
    templateUsed: string;
    variablesFilled: string[];
    analysis: TextAnalysisResult;
    suggestions: string[];
    completeness: number;
  };
}

interface ContextAnalysis {
  intent: string;
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

interface _TemplateAnalysis {
  keywords: string[];
  intent: string;
  entities: string[];
  context: string;
}

// Templates inteligentes pré-definidos
export const INTELLIGENT_TEMPLATES: SmartTemplate[] = [
  {
    id: 'contract_analysis_report',
    name: 'Relatório de Análise de Contratos',
    category: 'report',
    description:
      'Gera relatório completo de análise de contratos com insights e recomendações',
    template: `
# RELATÓRIO DE ANÁLISE DE CONTRATOS
**Período:** {{startDate}} a {{endDate}}
**Gerado em:** {{generationDate}}

## RESUMO EXECUTIVO
{{executiveSummary}}

## MÉTRICAS PRINCIPAIS
- **Total de Contratos:** {{totalContracts}}
- **Contratos Ativos:** {{activeContracts}}
- **Taxa de Ocupação:** {{occupationRate}}%
- **Contratos Expirando (30 dias):** {{expiringContracts}}

## ANÁLISE POR REGIÃO
{{regionAnalysis}}

## TENDÊNCIAS E INSIGHTS
{{trendsAnalysis}}

## RECOMENDAÇÕES
{{recommendations}}

## PRÓXIMAS AÇÕES
{{nextActions}}
    `,
    variables: [
      {
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Data de início do período de análise',
      },
      {
        name: 'endDate',
        type: 'date',
        required: true,
        description: 'Data de fim do período de análise',
      },
      {
        name: 'includePredictions',
        type: 'boolean',
        required: false,
        defaultValue: true,
        description: 'Incluir previsões e análises preditivas',
      },
      {
        name: 'reportLevel',
        type: 'select',
        required: false,
        defaultValue: 'detailed',
        options: ['summary', 'detailed', 'executive'],
        description: 'Nível de detalhamento do relatório',
      },
    ],
    conditions: [
      {
        field: 'reportLevel',
        operator: 'equals',
        value: 'executive',
        action: 'hide',
      },
    ],
    suggestions: [
      'Inclua gráficos visuais para melhor apresentação',
      'Considere segmentar por tipo de contrato',
      'Adicione comparação com períodos anteriores',
    ],
    usage: 0,
    rating: 4.8,
  },
  {
    id: 'contract_expiry_notification',
    name: 'Notificação de Expiração de Contrato',
    category: 'communication',
    description:
      'Template inteligente para notificar sobre contratos próximos ao vencimento',
    template: `
Prezado(a) {{recipientName}},

Esperamos que esteja bem.

Gostaríamos de informar que o contrato de locação {{contractNumber}}, referente ao imóvel situado em {{propertyAddress}}, está próximo ao vencimento.

**Dados do Contrato:**
- Número: {{contractNumber}}
- Locatário: {{tenantName}}
- Endereço: {{propertyAddress}}
- Data de Vencimento: {{expiryDate}}
- Dias restantes: {{daysRemaining}}

{{#if daysRemaining <= 7}}
**⚠️ ATENÇÃO:** Este contrato vence em menos de 7 dias. Solicitamos que entre em contato conosco o mais breve possível para definirmos os próximos passos.
{{else}}
**Próximos Passos:**
1. Renovação do contrato (se desejado)
2. Processo de desocupação (se necessário)
3. Agendamento de vistoria

Solicitamos que nos informe sobre sua intenção até {{responseDeadline}} para que possamos proceder adequadamente.
{{/if}}

Para qualquer dúvida ou esclarecimento, estamos à disposição.

Atenciosamente,
{{senderName}}
{{companyName}}
    `,
    variables: [
      {
        name: 'recipientName',
        type: 'text',
        required: true,
        description: 'Nome do destinatário',
      },
      {
        name: 'contractNumber',
        type: 'text',
        required: true,
        description: 'Número do contrato',
      },
      {
        name: 'tenantName',
        type: 'text',
        required: true,
        description: 'Nome do locatário',
      },
      {
        name: 'propertyAddress',
        type: 'text',
        required: true,
        description: 'Endereço do imóvel',
      },
      {
        name: 'expiryDate',
        type: 'date',
        required: true,
        description: 'Data de vencimento do contrato',
      },
      {
        name: 'daysRemaining',
        type: 'number',
        required: true,
        description: 'Dias restantes até o vencimento',
      },
      {
        name: 'responseDeadline',
        type: 'date',
        required: false,
        description: 'Prazo para resposta',
      },
      {
        name: 'senderName',
        type: 'text',
        required: true,
        description: 'Nome do remetente',
      },
      {
        name: 'companyName',
        type: 'text',
        required: true,
        description: 'Nome da empresa',
      },
    ],
    conditions: [
      {
        field: 'daysRemaining',
        operator: 'less',
        value: 7,
        action: 'show',
      },
    ],
    suggestions: [
      'Personalize o tom baseado no histórico do cliente',
      'Inclua opções de renovação com desconto',
      'Adicione informações sobre novos imóveis disponíveis',
    ],
    usage: 0,
    rating: 4.6,
  },
  {
    id: 'market_analysis_report',
    name: 'Relatório de Análise de Mercado',
    category: 'report',
    description:
      'Análise inteligente do mercado imobiliário baseada nos dados dos contratos',
    template: `
# ANÁLISE DE MERCADO IMOBILIÁRIO
**Região:** {{region}}
**Período:** {{analysisPeriod}}
**Data de Análise:** {{analysisDate}}

## VISÃO GERAL DO MERCADO
{{marketOverview}}

## ANÁLISE DE PREÇOS
{{priceAnalysis}}

## DEMANDA POR REGIÃO
{{regionalDemand}}

## TENDÊNCIAS DE LOCAÇÃO
{{rentalTrends}}

## COMPETIÇÃO
{{competitionAnalysis}}

## OPORTUNIDADES IDENTIFICADAS
{{opportunities}}

## RECOMENDAÇÕES ESTRATÉGICAS
{{strategicRecommendations}}
    `,
    variables: [
      {
        name: 'region',
        type: 'select',
        required: true,
        options: ['Valinhos', 'Campinas', 'São Paulo', 'Região Metropolitana'],
        description: 'Região para análise',
      },
      {
        name: 'analysisPeriod',
        type: 'select',
        required: true,
        options: ['Últimos 3 meses', 'Últimos 6 meses', 'Último ano'],
        defaultValue: 'Últimos 6 meses',
        description: 'Período de análise',
      },
      {
        name: 'includeCompetitorAnalysis',
        type: 'boolean',
        required: false,
        defaultValue: true,
        description: 'Incluir análise de concorrência',
      },
      {
        name: 'marketSegment',
        type: 'select',
        required: false,
        options: ['Residencial', 'Comercial', 'Misto'],
        defaultValue: 'Residencial',
        description: 'Segmento de mercado',
      },
    ],
    conditions: [],
    suggestions: [
      'Compare com dados históricos para identificar tendências',
      'Inclua previsões baseadas em dados sazonais',
      'Analise fatores externos que podem afetar o mercado',
    ],
    usage: 0,
    rating: 4.7,
  },
  {
    id: 'client_satisfaction_survey',
    name: 'Pesquisa de Satisfação do Cliente',
    category: 'communication',
    description:
      'Template inteligente para pesquisas de satisfação personalizadas',
    template: `
Prezado(a) {{clientName}},

Esperamos que esteja tudo bem!

Gostaríamos de conhecer sua opinião sobre nossos serviços para continuarmos oferecendo a melhor experiência possível.

**Sobre o Contrato {{contractNumber}}:**
- Imóvel: {{propertyAddress}}
- Período: {{contractPeriod}}

## QUESTIONÁRIO DE SATISFAÇÃO

### 1. Como você avalia nossa comunicação durante o processo?
[ ] Excelente [ ] Bom [ ] Regular [ ] Ruim

### 2. A documentação foi entregue de forma clara e organizada?
[ ] Excelente [ ] Bom [ ] Regular [ ] Ruim

### 3. Nossos profissionais foram cordiais e prestativos?
[ ] Excelente [ ] Bom [ ] Regular [ ] Ruim

### 4. O atendimento às suas solicitações foi eficiente?
[ ] Excelente [ ] Bom [ ] Regular [ ] Ruim

### 5. Você recomendaria nossos serviços?
[ ] Com certeza [ ] Provavelmente [ ] Talvez [ ] Provavelmente não [ ] Com certeza não

### Comentários adicionais:
{{commentSpace}}

## PRÓXIMOS PASSOS
{{nextStepsInfo}}

Agradecemos sua participação e confiança em nossos serviços.

Atenciosamente,
Equipe {{companyName}}
    `,
    variables: [
      {
        name: 'clientName',
        type: 'text',
        required: true,
        description: 'Nome do cliente',
      },
      {
        name: 'contractNumber',
        type: 'text',
        required: true,
        description: 'Número do contrato',
      },
      {
        name: 'propertyAddress',
        type: 'text',
        required: true,
        description: 'Endereço do imóvel',
      },
      {
        name: 'contractPeriod',
        type: 'text',
        required: true,
        description: 'Período do contrato',
      },
      {
        name: 'commentSpace',
        type: 'text',
        required: false,
        description: 'Espaço para comentários',
      },
      {
        name: 'nextStepsInfo',
        type: 'text',
        required: false,
        description: 'Informações sobre próximos passos',
      },
      {
        name: 'companyName',
        type: 'text',
        required: true,
        description: 'Nome da empresa',
      },
    ],
    conditions: [],
    suggestions: [
      'Personalize as perguntas baseadas no tipo de contrato',
      'Inclua perguntas específicas sobre melhorias',
      'Ofereça incentivos para participação',
    ],
    usage: 0,
    rating: 4.5,
  },
];

// Sistema de geração inteligente de documentos
export class IntelligentTemplateEngine {
  private templates: SmartTemplate[];
  private usageStats: Map<string, number>;

  constructor() {
    this.templates = INTELLIGENT_TEMPLATES;
    this.usageStats = new Map();
    this.loadUsageStats();
  }

  // Carregar estatísticas de uso
  private loadUsageStats(): void {
    try {
      const stored = localStorage.getItem('template-usage-stats');
      if (stored) {
        this.usageStats = new Map(JSON.parse(stored));
      }
    } catch {
      // console.error('Erro ao carregar estatísticas de templates');
    }
  }

  // Salvar estatísticas de uso
  private saveUsageStats(): void {
    try {
      localStorage.setItem(
        'template-usage-stats',
        JSON.stringify([...this.usageStats])
      );
    } catch {
      // console.error('Erro ao salvar estatísticas de templates');
    }
  }

  // Sugerir templates baseados no contexto
  public suggestTemplates(context: string, userInput: string): SmartTemplate[] {
    const analysis = this.analyzeContext(context, userInput);

    return this.templates
      .filter((template) => this.isTemplateRelevant(template, analysis))
      .sort((a, b) => {
        const relevanceA = this.calculateRelevance(a, analysis);
        const relevanceB = this.calculateRelevance(b, analysis);
        return relevanceB - relevanceA;
      })
      .slice(0, 5);
  }

  // Analisar contexto do usuário
  private analyzeContext(context: string, userInput: string): ContextAnalysis {
    const contextLower = context.toLowerCase();
    const inputLower = userInput.toLowerCase();

    return {
      isContractRelated:
        contextLower.includes('contrato') || inputLower.includes('contrato'),
      isReportNeeded:
        contextLower.includes('relatório') || inputLower.includes('relatório'),
      isCommunicationNeeded:
        contextLower.includes('comunicação') || inputLower.includes('email'),
      isExpiryRelated:
        inputLower.includes('expir') || inputLower.includes('vencimento'),
      isMarketAnalysis:
        inputLower.includes('mercado') || inputLower.includes('análise'),
      urgency: this.detectUrgency(userInput),
      complexity: this.detectComplexity(userInput),
    };
  }

  // Verificar se template é relevante
  private isTemplateRelevant(
    template: SmartTemplate,
    analysis: ContextAnalysis
  ): boolean {
    if (analysis.isContractRelated && template.category === 'contract')
      return true;
    if (analysis.isReportNeeded && template.category === 'report') return true;
    if (analysis.isCommunicationNeeded && template.category === 'communication')
      return true;
    if (
      analysis.isExpiryRelated &&
      template.id === 'contract_expiry_notification'
    )
      return true;
    if (analysis.isMarketAnalysis && template.id === 'market_analysis_report')
      return true;

    return false;
  }

  // Calcular relevância do template
  private calculateRelevance(
    template: SmartTemplate,
    _analysis: ContextAnalysis
  ): number {
    let relevance = template.rating * 10;

    // Bonificação por uso recente
    if (template.lastUsed) {
      const daysSinceLastUse =
        (Date.now() - template.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse < 7) relevance += 20;
    }

    // Bonificação por popularidade
    relevance += Math.min(this.usageStats.get(template.id) || 0, 50);

    return relevance;
  }

  // Detectar urgência
  private detectUrgency(input: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgente', 'imediato', 'hoje', 'agora', 'rápido'];
    const mediumWords = ['breve', 'logo', 'próximo'];

    const inputLower = input.toLowerCase();

    if (urgentWords.some((word) => inputLower.includes(word))) return 'high';
    if (mediumWords.some((word) => inputLower.includes(word))) return 'medium';
    return 'low';
  }

  // Detectar complexidade
  private detectComplexity(input: string): 'simple' | 'moderate' | 'complex' {
    const complexWords = ['análise', 'relatório', 'estratégia', 'pesquisa'];
    const moderateWords = ['avaliação', 'resumo', 'comunicação'];

    const inputLower = input.toLowerCase();

    if (complexWords.some((word) => inputLower.includes(word)))
      return 'complex';
    if (moderateWords.some((word) => inputLower.includes(word)))
      return 'moderate';
    return 'simple';
  }

  // Gerar documento a partir de template
  public async generateDocument(
    templateId: string,
    variables: Record<string, string | number | boolean>
  ): Promise<DocumentGenerationResult> {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    // Validar variáveis obrigatórias
    const missingVariables = template.variables
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.name);

    if (missingVariables.length > 0) {
      throw new Error(
        `Variáveis obrigatórias não fornecidas: ${missingVariables.join(', ')}`
      );
    }

    // Aplicar condições
    const processedVariables = this.applyConditions(template, variables);

    // Gerar conteúdo
    let content = template.template;

    // Substituir variáveis
    for (const [key, value] of Object.entries(processedVariables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value || ''));
    }

    // Processar condicionais Handlebars-like
    content = this.processConditionals(content, processedVariables);

    // Registrar uso
    this.usageStats.set(templateId, (this.usageStats.get(templateId) || 0) + 1);
    template.usage++;
    template.lastUsed = new Date();
    this.saveUsageStats();

    // Analisar o conteúdo gerado
    const analysis = await analyzeTextAdvanced(content);

    // Gerar sugestões
    const suggestions = this.generateSuggestions(template, content, analysis);

    return {
      content,
      metadata: {
        templateUsed: template.name,
        variablesFilled: Object.keys(processedVariables),
        analysis,
        suggestions,
        completeness: this.calculateCompleteness(content, template),
      },
    };
  }

  // Aplicar condições do template
  private applyConditions(
    template: SmartTemplate,
    variables: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    const processedVariables = { ...variables };

    for (const condition of template.conditions) {
      const fieldValue = variables[condition.field];
      let conditionMet = false;

      switch (condition.operator) {
        case 'equals':
          conditionMet = fieldValue === condition.value;
          break;
        case 'contains':
          conditionMet = String(fieldValue).includes(String(condition.value));
          break;
        case 'greater':
          conditionMet = Number(fieldValue) > Number(condition.value);
          break;
        case 'less':
          conditionMet = Number(fieldValue) < Number(condition.value);
          break;
        case 'exists':
          conditionMet = fieldValue !== undefined && fieldValue !== null;
          break;
      }

      if (conditionMet) {
        switch (condition.action) {
          case 'show':
          case 'require':
            // Mostrar ou tornar obrigatório
            break;
          case 'hide':
            // Ocultar seção
            break;
          case 'optional':
            // Tornar opcional
            break;
        }
      }
    }

    return processedVariables;
  }

  // Processar condicionais no template
  private processConditionals(
    content: string,
    variables: Record<string, string | number | boolean>
  ): string {
    // Processar condicionais simples {{#if condition}}...{{/if}}
    const ifPattern = /{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g;

    content = content.replace(ifPattern, (match, condition, block) => {
      const conditionResult = this.evaluateCondition(condition, variables);
      return conditionResult ? block : '';
    });

    return content;
  }

  // Avaliar condição
  private evaluateCondition(
    condition: string,
    variables: Record<string, string | number | boolean>
  ): boolean {
    // Suporte para condições simples como "daysRemaining <= 7"
    const operators = ['<=', '>=', '==', '!=', '<', '>'];

    for (const op of operators) {
      if (condition.includes(op)) {
        const [field, value] = condition.split(op).map((s) => s.trim());
        const fieldValue = variables[field];

        switch (op) {
          case '<=':
            return Number(fieldValue) <= Number(value);
          case '>=':
            return Number(fieldValue) >= Number(value);
          case '==':
            return fieldValue == value;
          case '!=':
            return fieldValue != value;
          case '<':
            return Number(fieldValue) < Number(value);
          case '>':
            return Number(fieldValue) > Number(value);
        }
      }
    }

    // Condição simples de existência
    return Boolean(variables[condition.trim()]);
  }

  // Gerar sugestões
  private generateSuggestions(
    template: SmartTemplate,
    content: string,
    analysis: TextAnalysisResult
  ): string[] {
    const suggestions = [...template.suggestions];

    // Sugestões baseadas na análise
    if (analysis.readabilityScore < 30) {
      suggestions.push(
        'Considere simplificar o texto para melhorar a legibilidade'
      );
    }

    if (analysis.sentiment === 'negative') {
      suggestions.push('Reformule para um tom mais positivo e construtivo');
    }

    if (analysis.complexity === 'complex') {
      suggestions.push('Adicione um resumo executivo no início');
    }

    return suggestions;
  }

  // Calcular completude do documento
  private calculateCompleteness(
    content: string,
    template: SmartTemplate
  ): number {
    const totalVariables = template.variables.length;
    const filledVariables = template.variables.filter(
      (v) =>
        content.includes(`{{${v.name}}}`) &&
        content.indexOf(`{{${v.name}}}`) !==
          content.lastIndexOf(`{{${v.name}}}`)
    ).length;

    return Math.round((filledVariables / totalVariables) * 100);
  }

  // Obter template por ID
  public getTemplate(templateId: string): SmartTemplate | undefined {
    return this.templates.find((t) => t.id === templateId);
  }

  // Listar todos os templates
  public getAllTemplates(): SmartTemplate[] {
    return this.templates.sort((a, b) => b.rating - a.rating);
  }

  // Obter templates por categoria
  public getTemplatesByCategory(category: string): SmartTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  // Obter estatísticas de uso
  public getUsageStats(): Map<string, number> {
    return new Map(this.usageStats);
  }
}

// Instância global do engine
export const templateEngine = new IntelligentTemplateEngine();
