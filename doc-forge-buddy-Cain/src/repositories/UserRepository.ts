/**
 * Repository específico para Usuários/Perfis
 * Implementa operações especializadas para a entidade User
 */

import type { UserProfile, CreateUserPayload, UpdateUserPayload, UserFilters } from '@/types/shared/user';
import { UserRole } from '@/types/shared/base';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<UserProfile, string> {
  constructor(userId?: string | null) {
    super('profiles', 'User', userId);
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    return this.findWithConditions([
      {
        column: 'email',
        operator: 'eq',
        value: email
      }
    ]).then(users => users[0] || null);
  }

  /**
   * Busca usuários por role
   */
  async findByRole(role: UserRole): Promise<UserProfile[]> {
    return this.findMany({ role } as any);
  }

  /**
   * Busca usuários ativos
   */
  async findActiveUsers(): Promise<UserProfile[]> {
    return this.findMany({ is_active: true } as any);
  }

  /**
   * Busca usuários inativos
   */
  async findInactiveUsers(): Promise<UserProfile[]> {
    return this.findMany({ is_active: false } as any);
  }

  /**
   * Busca usuários com filtros avançados
   */
  async findWithFilters(filters: UserFilters): Promise<UserProfile[]> {
    const conditions: Array<{
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in';
      value: any;
    }> = [];

    if (filters.role) {
      conditions.push({
        column: 'role',
        operator: 'eq',
        value: filters.role
      });
    }

    if (filters.is_active !== undefined) {
      conditions.push({
        column: 'is_active',
        operator: 'eq',
        value: filters.is_active
      });
    }

    if (filters.email) {
      conditions.push({
        column: 'email',
        operator: 'ilike',
        value: `%${filters.email}%`
      });
    }

    if (conditions.length === 0) {
      return this.findMany();
    }

    return this.findWithConditions(conditions, { column: 'created_at', ascending: false });
  }

  /**
   * Busca usuários por termo de busca (nome ou email)
   */
  async searchUsers(searchTerm: string, limit = 20): Promise<UserProfile[]> {
    return this.findWithConditions([
      {
        column: 'full_name',
        operator: 'ilike',
        value: `%${searchTerm}%`
      }
    ], { column: 'full_name', ascending: true }, limit);
  }

  /**
   * Busca usuários administrativos
   */
  async findAdmins(): Promise<UserProfile[]> {
    return this.findByRole(UserRole.ADMIN);
  }

  /**
   * Busca usuários normais
   */
  async findRegularUsers(): Promise<UserProfile[]> {
    return this.findByRole(UserRole.USER);
  }

  /**
   * Cria usuário com validações
   */
  async create(data: CreateUserPayload): Promise<UserProfile> {
    // Validações
    this.validateUserData(data);

    // Dados padrão
    const userData = {
      user_id: crypto.randomUUID(), // Gera UUID para o user_id
      email: data.email,
      full_name: data.full_name || null,
      role: data.role || UserRole.USER,
      is_active: true,
      exp: 0,
      level: 1,
      last_password_change: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: null,
      updated_at: new Date().toISOString()
    };

    return super.create(userData as any);
  }

  /**
   * Atualiza usuário com validações
   */
  async update(id: string, data: UpdateUserPayload): Promise<UserProfile> {
    // Validações
    if (data.email) {
      this.validateEmail(data.email);
    }

    if (data.full_name !== undefined) {
      this.validateName(data.full_name);
    }

    return super.update(id, data as any);
  }

  /**
   * Ativa usuário
   */
  async activateUser(id: string): Promise<UserProfile> {
    return this.update(id, { is_active: true } as any);
  }

  /**
   * Desativa usuário
   */
  async deactivateUser(id: string): Promise<UserProfile> {
    return this.update(id, { is_active: false } as any);
  }

  /**
   * Altera role do usuário
   */
  async changeUserRole(id: string, role: UserRole): Promise<UserProfile> {
    return this.update(id, { role } as any);
  }

  /**
   * Incrementa experiência do usuário
   */
  async addExperience(id: string, amount: number): Promise<UserProfile> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const newExp = user.exp + amount;
    const newLevel = this.calculateLevel(newExp);

    return this.update(id, { 
      exp: newExp, 
      level: newLevel,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Verifica se email já existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const existingUser = await this.findByEmail(email);
    return existingUser !== null && existingUser.id !== excludeId;
  }

  /**
   * Obtém estatísticas dos usuários
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    recentRegistrations: UserProfile[];
  }> {
    const allUsers = await this.findMany();
    
    const stats = {
      total: allUsers.length,
      active: 0,
      inactive: 0,
      byRole: {} as Record<string, number>,
      recentRegistrations: [] as UserProfile[]
    };

    allUsers.forEach(user => {
      // Conta ativos/inativos
      if (user.is_active) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Conta por role
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    });

    // Usuários recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentRegistrations = allUsers
      .filter(user => new Date(user.created_at) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return stats;
  }

  /**
   * Busca usuários com sessões ativas
   */
  async findUsersWithActiveSessions(): Promise<UserProfile[]> {
    // Esta funcionalidade dependeria de uma query com JOIN na tabela de sessões
    // Por enquanto, retorna todos os usuários ativos
    return this.findActiveUsers();
  }

  /**
   * Limpa dados de usuário (soft delete)
   */
  async softDelete(id: string): Promise<void> {
    // Em vez de deletar, desativa o usuário
    await this.deactivateUser(id);
    
    // Opcionalmente, pode limpar dados sensíveis
    await this.update(id, {
      two_factor_secret: null,
      two_factor_backup_codes: null,
      full_name: '[Usuário removido]',
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Valida dados do usuário
   */
  private validateUserData(data: CreateUserPayload): void {
    if (!data.email || data.email.trim() === '') {
      throw new Error('Email é obrigatório');
    }

    this.validateEmail(data.email);

    if (data.full_name && data.full_name.trim().length < 2) {
      throw new Error('Nome completo deve ter pelo menos 2 caracteres');
    }

    if (data.role && !Object.values(UserRole).includes(data.role)) {
      throw new Error('Role inválido');
    }
  }

  /**
   * Valida formato de email
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email deve ter formato válido');
    }
  }

  /**
   * Valida nome
   */
  private validateName(name: string): void {
    if (name && name.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
  }

  /**
   * Calcula nível baseado na experiência
   */
  private calculateLevel(exp: number): number {
    // Fórmula simples: cada 100xp = 1 nível
    return Math.floor(exp / 100) + 1;
  }

  /**
   * Busca usuários que precisam de verificação de email
   */
  async findUsersNeedingEmailVerification(): Promise<UserProfile[]> {
    // Esta funcionalidade dependeria de uma lógica específica de verificação
    // Por enquanto, retorna usuários que não confirmaram email recentemente
    const allUsers = await this.findMany();
    
    return allUsers.filter(user => {
      // Lógica para determinar se precisa verificar email
      // Exemplo: usuários criados há mais de 1 hora sem confirmação
      const createdTime = new Date(user.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return createdTime < oneHourAgo;
    });
  }

  /**
   * Expiria sessões antigas de um usuário
   */
  async expireUserSessions(userId: string): Promise<void> {
    // Esta funcionalidade dependeria de acesso à tabela de sessões
    // Por enquanto, apenas registra o evento
    console.log(`Expirando sessões do usuário ${userId}`);
  }
}