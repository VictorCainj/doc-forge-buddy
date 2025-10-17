/**
 * Templates de resposta contextual para diferentes situações
 */

import { MessageAnalysis } from '@/types/conversationProfile';

export interface ResponseTemplate {
  id: string;
  situation: string;
  emotion: MessageAnalysis['emotion'];
  formality: MessageAnalysis['formality'];
  template: string;
  variables: string[];
  examples: string[];
}

/**
 * Templates para solicitação de informações
 */
export const INFORMATION_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'info_formal_neutral',
    situation: 'informação',
    emotion: 'neutral',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nAgradecemos seu contato. Vamos verificar {contexto} e retornaremos com as informações solicitadas no menor prazo possível.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['cor da tinta', 'documentos necessários', 'datas disponíveis'],
  },
  {
    id: 'info_informal_neutral',
    situation: 'informação',
    emotion: 'neutral',
    formality: 'informal',
    template:
      'Prezado(a) {nome},\n\nRecebemos sua solicitação. Vamos consultar {contexto} e retornaremos com as informações em breve.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['cor da tinta', 'documentos necessários', 'datas disponíveis'],
  },
  {
    id: 'info_formal_positive',
    situation: 'informação',
    emotion: 'positive',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nAgradecemos sua consulta. Vamos verificar {contexto} e retornaremos com as informações solicitadas em breve.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['cor da tinta', 'documentos necessários', 'datas disponíveis'],
  },
];

/**
 * Templates para agendamento de vistoria
 */
export const INSPECTION_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'inspection_formal_neutral',
    situation: 'agendamento',
    emotion: 'neutral',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nSolicitamos agendar a vistoria para {data} às {hora}. Por favor, confirme sua disponibilidade para este horário.\n\nAtenciosamente.',
    variables: ['nome', 'data', 'hora'],
    examples: ['segunda-feira, 15/01', '14:00', 'manhã'],
  },
  {
    id: 'inspection_informal_neutral',
    situation: 'agendamento',
    emotion: 'neutral',
    formality: 'informal',
    template:
      'Prezado(a) {nome},\n\nGostaríamos de agendar a vistoria para {data} às {hora}. Por favor, confirme se este horário é adequado.\n\nAtenciosamente.',
    variables: ['nome', 'data', 'hora'],
    examples: ['segunda-feira, 15/01', '14:00', 'manhã'],
  },
];

/**
 * Templates para reclamações
 */
export const COMPLAINT_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'complaint_formal_frustrated',
    situation: 'reclamação',
    emotion: 'frustrated',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nReconhecemos sua preocupação e lamentamos o inconveniente. Vamos analisar {contexto} e implementar as medidas necessárias para resolver a questão. Retornaremos em breve com uma solução adequada.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['a situação', 'os apontamentos', 'o problema relatado'],
  },
  {
    id: 'complaint_informal_concerned',
    situation: 'reclamação',
    emotion: 'concerned',
    formality: 'informal',
    template:
      'Prezado(a) {nome},\n\nEntendemos sua preocupação. Vamos analisar {contexto} e tomar as providências necessárias para resolver a questão. Retornaremos em breve com uma solução.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['a situação', 'os apontamentos', 'o problema relatado'],
  },
  {
    id: 'complaint_formal_reassuring',
    situation: 'reclamação',
    emotion: 'neutral',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nAgradecemos pelo retorno. Vamos analisar {contexto} e implementar as medidas necessárias para resolver a questão. Retornaremos em breve com as informações solicitadas.\n\nAtenciosamente.',
    variables: ['nome', 'contexto'],
    examples: ['a situação', 'os apontamentos', 'o problema relatado'],
  },
];

/**
 * Templates para dúvidas sobre contrato
 */
export const CONTRACT_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'contract_formal_neutral',
    situation: 'contrato',
    emotion: 'neutral',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nEm relação à sua consulta sobre {pergunta}, conforme estabelecido no contrato, {resposta}. Caso necessite de esclarecimentos adicionais, estamos à disposição.\n\nAtenciosamente.',
    variables: ['nome', 'pergunta', 'resposta'],
    examples: [
      'prazo de entrega',
      'está previsto em 30 dias',
      'valores',
      'conforme cláusula X',
    ],
  },
  {
    id: 'contract_informal_neutral',
    situation: 'contrato',
    emotion: 'neutral',
    formality: 'informal',
    template:
      'Prezado(a) {nome},\n\nEm relação à sua consulta, {resposta}. Caso tenha outras dúvidas, estamos à disposição para esclarecimentos.\n\nAtenciosamente.',
    variables: ['nome', 'resposta'],
    examples: [
      'Isso está previsto no contrato',
      'Conforme estabelecido',
      'Está correto',
    ],
  },
];

/**
 * Templates para cobrança/pagamento
 */
export const PAYMENT_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'payment_formal_neutral',
    situation: 'pagamento',
    emotion: 'neutral',
    formality: 'formal',
    template:
      'Prezado(a) {nome},\n\nSolicitamos a confirmação do pagamento de {valor} referente a {período}. Por favor, encaminhe o comprovante quando possível.\n\nAtenciosamente.',
    variables: ['nome', 'valor', 'período'],
    examples: ['R$ 1.200,00', 'janeiro/2024', 'taxa de condomínio'],
  },
  {
    id: 'payment_informal_neutral',
    situation: 'pagamento',
    emotion: 'neutral',
    formality: 'informal',
    template:
      'Prezado(a) {nome},\n\nSolicitamos a confirmação do pagamento de {valor} referente a {período}. Por favor, encaminhe o comprovante quando possível.\n\nAtenciosamente.',
    variables: ['nome', 'valor', 'período'],
    examples: ['R$ 1.200,00', 'janeiro/2024', 'taxa de condomínio'],
  },
];

/**
 * Todos os templates organizados por categoria
 */
export const ALL_TEMPLATES: Record<string, ResponseTemplate[]> = {
  information: INFORMATION_TEMPLATES,
  inspection: INSPECTION_TEMPLATES,
  complaint: COMPLAINT_TEMPLATES,
  contract: CONTRACT_TEMPLATES,
  payment: PAYMENT_TEMPLATES,
};

/**
 * Encontra o template mais adequado baseado na análise da mensagem
 */
export const findBestTemplate = (
  analysis: MessageAnalysis,
  situation: string,
  context?: string
): ResponseTemplate | null => {
  const categoryTemplates = ALL_TEMPLATES[situation];
  if (!categoryTemplates) return null;

  // Buscar template que combine com a análise
  let bestTemplate = categoryTemplates.find(
    (template) =>
      template.emotion === analysis.emotion &&
      template.formality === analysis.formality
  );

  // Se não encontrar combinação exata, buscar por formalidade
  if (!bestTemplate) {
    bestTemplate = categoryTemplates.find(
      (template) => template.formality === analysis.formality
    );
  }

  // Se ainda não encontrar, pegar o primeiro template da categoria
  if (!bestTemplate) {
    bestTemplate = categoryTemplates[0];
  }

  return bestTemplate;
};

/**
 * Aplica um template substituindo as variáveis
 */
export const applyTemplate = (
  template: ResponseTemplate,
  variables: Record<string, string>
): string => {
  let result = template.template;

  // Substituir variáveis
  template.variables.forEach((variable) => {
    const value = variables[variable] || `{${variable}}`;
    result = result.replace(new RegExp(`{${variable}}`, 'g'), value);
  });

  return result;
};

/**
 * Gera sugestões de resposta baseadas na análise
 */
export const generateResponseSuggestions = (
  analysis: MessageAnalysis,
  situation?: string,
  context?: string
): string[] => {
  const suggestions: string[] = [];

  // Sugestões baseadas na emoção
  switch (analysis.emotion) {
    case 'frustrated':
      suggestions.push('Demonstre compreensão e ofereça solução');
      suggestions.push('Seja empático e reconheça a frustração');
      break;
    case 'concerned':
      suggestions.push('Tranquilize e ofereça esclarecimentos');
      suggestions.push('Seja reconfortante e prestativo');
      break;
    case 'urgent':
      suggestions.push('Priorize rapidez na resposta');
      suggestions.push('Confirme urgência e dê prazo');
      break;
    case 'grateful':
      suggestions.push('Agradeça o feedback positivo');
      suggestions.push('Mantenha o tom cordial');
      break;
    case 'positive':
      suggestions.push('Mantenha o tom otimista');
      suggestions.push('Reinforce a positividade');
      break;
  }

  // Sugestões baseadas na intenção
  switch (analysis.intent) {
    case 'question':
      suggestions.push('Forneça informação clara e completa');
      break;
    case 'complaint':
      suggestions.push('Reconheça o problema e ofereça solução');
      break;
    case 'request':
      suggestions.push('Confirme o que será feito e quando');
      break;
    case 'greeting':
      suggestions.push('Responda de forma cordial');
      break;
    case 'gratitude':
      suggestions.push('Agradeça e mantenha o relacionamento');
      break;
  }

  return suggestions;
};
