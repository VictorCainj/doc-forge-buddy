/**
 * Utilitários para gradientes de cards baseados em status
 */

import { Contract } from '@/types/contract';

/**
 * Obtém a classe de gradiente CSS baseada no status do contrato
 * Por padrão, usa cores neutras. Favoritos devem usar laranja (ai-card-orange)
 */
export function getCardGradientClassByStatus(
  contract: Contract,
  fallbackIndex: number = 0
): string {
  // Gradientes neutros padrão (sem cores por status)
  const neutralGradients = [
    'ai-card-blue',
    'ai-card-purple',
    'ai-card-cyan',
    'ai-card-teal',
  ];
  
  return neutralGradients[fallbackIndex % neutralGradients.length];
}

/**
 * Obtém gradiente baseado apenas no índice (comportamento antigo)
 * Mantido para compatibilidade
 */
export function getCardGradientClassByIndex(index: number): string {
  const gradients = ['ai-card-blue', 'ai-card-purple', 'ai-card-cyan', 'ai-card-teal'];
  return gradients[index % gradients.length];
}

