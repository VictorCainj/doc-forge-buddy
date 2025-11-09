import { Contract, ContractTag } from '@/types/contract';
/**
 * Utilitários para gerar tags automáticas baseadas em status e prazos de contratos
 */

'@/utils/contractStatus';

/**
 * Tipos de tags automáticas
 */
export type AutomaticTagType = 'expiry_soon' | 'expired_30_days' | 'none';

/**
 * Cores para tags automáticas
 */
const AUTOMATIC_TAG_COLORS = {
  expiry_soon: '#f59e0b', // laranja/amber
  expired_30_days: '#ef4444', // vermelho
};

/**
 * Labels para tags automáticas
 */
const AUTOMATIC_TAG_LABELS = {
  expiry_soon: 'Vencendo em 30 dias',
  expired_30_days: 'Vencido há mais de 30 dias',
};

/**
 * Calcula se um contrato está dentro do prazo de 30 dias até o vencimento
 */
function calculateDaysUntilExpiry(contract: Contract): number | null {
  const formData = contract.form_data;
  const dataTerminoRescisao = parseBrazilianDate(formData.dataTerminoRescisao || '');

  if (!dataTerminoRescisao) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasAteVencimento = Math.ceil(
    (dataTerminoRescisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diasAteVencimento;
}

/**
 * Determina qual tag automática deve ser aplicada ao contrato
 */
export function getAutomaticTagType(contract: Contract): AutomaticTagType {
  const diasAteVencimento = calculateDaysUntilExpiry(contract);

  if (diasAteVencimento === null) {
    return 'none';
  }

  // Se já passou mais de 30 dias do vencimento
  if (diasAteVencimento < -30) {
    return 'expired_30_days';
  }

  // Se está dentro do prazo de 30 dias até o vencimento (ainda não venceu)
  // Considera apenas contratos que vão vencer nos próximos 30 dias (não os que já venceram)
  if (diasAteVencimento >= 0 && diasAteVencimento <= 30) {
    return 'expiry_soon';
  }

  return 'none';
}

/**
 * Gera a tag automática para um contrato
 */
export function generateAutomaticTag(
  contract: Contract,
  userId: string
): ContractTag | null {
  const tagType = getAutomaticTagType(contract);

  if (tagType === 'none') {
    return null;
  }

  // Criar ID único baseado no tipo de tag e ID do contrato
  const tagId = `auto-${tagType}-${contract.id}`;

  return {
    id: tagId,
    contract_id: contract.id,
    tag_name: AUTOMATIC_TAG_LABELS[tagType],
    color: AUTOMATIC_TAG_COLORS[tagType],
    user_id: userId,
    created_at: new Date().toISOString(),
    is_automatic: true, // Marcar como automática
  };
}

/**
 * Filtra tags automáticas de uma lista de tags
 */
export function filterAutomaticTags(tags: ContractTag[]): ContractTag[] {
  return tags.filter((tag) => tag.id.startsWith('auto-'));
}

/**
 * Filtra apenas tags manuais (não automáticas)
 */
export function filterManualTags(tags: ContractTag[]): ContractTag[] {
  return tags.filter((tag) => !tag.id.startsWith('auto-'));
}

