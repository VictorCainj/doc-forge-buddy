/**
 * Verificador de Integridade de Dados
 * Identifica inconsistências e problemas no banco de dados
 */

import { supabase } from '@/integrations/supabase/client';

export interface IntegrityIssue {
  type:
    | 'orphan'
    | 'missing_reference'
    | 'duplicate'
    | 'invalid_data'
    | 'constraint_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity: string;
  entityId?: string;
  description: string;
  suggestedFix?: string;
}

export interface IntegrityReport {
  timestamp: Date;
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByType: Record<string, number>;
  issues: IntegrityIssue[];
  summary: string;
}

/**
 * Verifica usuários sem profile
 * NOTA: Esta verificação é limitada no frontend pois não temos acesso
 * à lista completa de usuários do Auth (requer service_role key).
 * A verificação completa deve ser feita via função RPC no backend.
 */
export async function checkUsersWithoutProfile(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    // No frontend, só podemos verificar profiles que existem
    // e verificar se há inconsistências visíveis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, email');

    if (profilesError) throw profilesError;

    // Verificar profiles com user_id nulo ou inválido
    profiles?.forEach((profile) => {
      if (!profile.user_id || profile.user_id.trim() === '') {
        issues.push({
          type: 'missing_reference',
          severity: 'high',
          entity: 'profiles',
          entityId: profile.id,
          description: `Profile ${profile.email} não possui user_id válido`,
          suggestedFix: 'Corrigir user_id ou remover profile',
        });
      }
    });

    // NOTA: Não podemos verificar usuários do Auth sem profile no frontend
    // Esta verificação completa requer uma função RPC com service_role key
  } catch (error) {
    console.error('Erro ao verificar usuários sem profile:', error);
  }

  return issues;
}

/**
 * Verifica contratos órfãos (sem usuário associado)
 */
export async function checkOrphanContracts(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, user_id, numero_contrato');

    if (error) throw error;

    // Buscar usuários válidos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id');
    const validUserIds = new Set(profiles?.map((p) => p.user_id) || []);

    contracts?.forEach((contract) => {
      if (contract.user_id && !validUserIds.has(contract.user_id)) {
        issues.push({
          type: 'orphan',
          severity: 'medium',
          entity: 'contracts',
          entityId: contract.id,
          description: `Contrato ${contract.numero_contrato} está órfão (usuário não existe)`,
          suggestedFix: 'Reatribuir contrato a usuário válido ou remover',
        });
      }
    });
  } catch (error) {
    console.error('Erro ao verificar contratos órfãos:', error);
  }

  return issues;
}

/**
 * Verifica prestadores órfãos
 */
export async function checkOrphanPrestadores(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: prestadores, error } = await supabase
      .from('prestadores')
      .select('id, user_id, nome');

    if (error) throw error;

    // Buscar usuários válidos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id');
    const validUserIds = new Set(profiles?.map((p) => p.user_id) || []);

    prestadores?.forEach((prestador) => {
      if (prestador.user_id && !validUserIds.has(prestador.user_id)) {
        issues.push({
          type: 'orphan',
          severity: 'medium',
          entity: 'prestadores',
          entityId: prestador.id,
          description: `Prestador ${prestador.nome} está órfão (usuário não existe)`,
          suggestedFix: 'Reatribuir prestador a usuário válido ou remover',
        });
      }
    });
  } catch (error) {
    console.error('Erro ao verificar prestadores órfãos:', error);
  }

  return issues;
}

/**
 * Verifica vistorias órfãs
 */
export async function checkOrphanVistorias(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: vistorias, error } = await supabase
      .from('vistoria_analises')
      .select('id, user_id, title');

    if (error) throw error;

    // Buscar usuários válidos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id');
    const validUserIds = new Set(profiles?.map((p) => p.user_id) || []);

    vistorias?.forEach((vistoria) => {
      if (vistoria.user_id && !validUserIds.has(vistoria.user_id)) {
        issues.push({
          type: 'orphan',
          severity: 'medium',
          entity: 'vistoria_analises',
          entityId: vistoria.id,
          description: `Vistoria "${vistoria.title}" está órfã (usuário não existe)`,
          suggestedFix: 'Reatribuir vistoria a usuário válido ou remover',
        });
      }
    });
  } catch (error) {
    console.error('Erro ao verificar vistorias órfãs:', error);
  }

  return issues;
}

/**
 * Verifica emails duplicados
 */
export async function checkDuplicateEmails(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email');

    if (error) throw error;

    const emailCounts = new Map<string, number>();
    profiles?.forEach((profile) => {
      const count = emailCounts.get(profile.email) || 0;
      emailCounts.set(profile.email, count + 1);
    });

    emailCounts.forEach((count, email) => {
      if (count > 1) {
        issues.push({
          type: 'duplicate',
          severity: 'high',
          entity: 'profiles',
          description: `Email ${email} está duplicado (${count} ocorrências)`,
          suggestedFix: 'Manter apenas um profile e remover duplicatas',
        });
      }
    });
  } catch (error) {
    console.error('Erro ao verificar emails duplicados:', error);
  }

  return issues;
}

/**
 * Verifica dados inválidos em profiles
 */
export async function checkInvalidProfileData(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role');

    if (error) throw error;

    profiles?.forEach((profile) => {
      // Verificar email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        issues.push({
          type: 'invalid_data',
          severity: 'high',
          entity: 'profiles',
          entityId: profile.id,
          description: `Profile possui email inválido: ${profile.email}`,
          suggestedFix: 'Corrigir ou remover email inválido',
        });
      }

      // Verificar role válido
      if (!['admin', 'user'].includes(profile.role)) {
        issues.push({
          type: 'invalid_data',
          severity: 'critical',
          entity: 'profiles',
          entityId: profile.id,
          description: `Profile possui role inválido: ${profile.role}`,
          suggestedFix: 'Corrigir role para "admin" ou "user"',
        });
      }
    });
  } catch (error) {
    console.error('Erro ao verificar dados inválidos:', error);
  }

  return issues;
}

/**
 * Verifica sessões expiradas não limpas
 */
export async function checkExpiredSessions(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  try {
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, expires_at')
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) throw error;

    sessions?.forEach((session) => {
      issues.push({
        type: 'constraint_violation',
        severity: 'low',
        entity: 'user_sessions',
        entityId: session.id,
        description: 'Sessão expirada ainda marcada como ativa',
        suggestedFix: 'Executar limpeza de sessões expiradas',
      });
    });
  } catch (error) {
    console.error('Erro ao verificar sessões expiradas:', error);
  }

  return issues;
}

/**
 * Executa verificação completa de integridade
 */
export async function runFullIntegrityCheck(): Promise<IntegrityReport> {
  const startTime = Date.now();
  const allIssues: IntegrityIssue[] = [];

  // Executar todas as verificações em paralelo
  const [
    usersWithoutProfile,
    orphanContracts,
    orphanPrestadores,
    orphanVistorias,
    duplicateEmails,
    invalidProfileData,
    expiredSessions,
  ] = await Promise.all([
    checkUsersWithoutProfile(),
    checkOrphanContracts(),
    checkOrphanPrestadores(),
    checkOrphanVistorias(),
    checkDuplicateEmails(),
    checkInvalidProfileData(),
    checkExpiredSessions(),
  ]);

  allIssues.push(
    ...usersWithoutProfile,
    ...orphanContracts,
    ...orphanPrestadores,
    ...orphanVistorias,
    ...duplicateEmails,
    ...invalidProfileData,
    ...expiredSessions
  );

  // Calcular estatísticas
  const issuesBySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const issuesByType: Record<string, number> = {
    orphan: 0,
    missing_reference: 0,
    duplicate: 0,
    invalid_data: 0,
    constraint_violation: 0,
  };

  allIssues.forEach((issue) => {
    issuesBySeverity[issue.severity]++;
    issuesByType[issue.type]++;
  });

  const executionTime = (Date.now() - startTime) / 1000;

  // Gerar resumo
  let summary = `Verificação concluída em ${executionTime.toFixed(2)}s. `;
  if (allIssues.length === 0) {
    summary += 'Nenhum problema encontrado! 🎉';
  } else {
    summary += `Encontrados ${allIssues.length} problemas: `;
    summary += `${issuesBySeverity.critical} críticos, `;
    summary += `${issuesBySeverity.high} altos, `;
    summary += `${issuesBySeverity.medium} médios, `;
    summary += `${issuesBySeverity.low} baixos.`;
  }

  return {
    timestamp: new Date(),
    totalIssues: allIssues.length,
    issuesBySeverity,
    issuesByType,
    issues: allIssues,
    summary,
  };
}

/**
 * Exporta relatório de integridade para CSV
 */
export function exportIntegrityReportCSV(report: IntegrityReport): string {
  const headers = [
    'Tipo',
    'Severidade',
    'Entidade',
    'ID',
    'Descrição',
    'Correção Sugerida',
  ];

  const rows = report.issues.map((issue) => [
    issue.type,
    issue.severity,
    issue.entity,
    issue.entityId || '-',
    issue.description,
    issue.suggestedFix || '-',
  ]);

  const csvContent = [
    `Relatório de Integridade de Dados`,
    `Gerado em: ${report.timestamp.toLocaleString('pt-BR')}`,
    `Total de problemas: ${report.totalIssues}`,
    ``,
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
