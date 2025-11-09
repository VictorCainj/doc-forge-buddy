/**
 * Query Builder Seguro
 * Prevenção de SQL injection com validação de queries
 */

import { validateId } from '../validators/dataValidators';

/**
 * Tipos de operação suportadas
 */
type QueryOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN' | 'NOT BETWEEN';

/**
 * Tipos de sort
 */
type SortDirection = 'ASC' | 'DESC';

/**
 * Interface para condições WHERE
 */
interface WhereCondition {
  column: string;
  operator: QueryOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Interface para JOIN
 */
interface JoinCondition {
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  on: string;
}

/**
 * Classe Query Builder Seguro
 */
export class SecureQueryBuilder {
  private sql = '';
  private params: any[] = [];
  private whereConditions: WhereCondition[] = [];
  private joins: JoinCondition[] = [];
  private orderBy: Array<{ column: string; direction: SortDirection }> = [];
  private groupBy: string[] = [];
  private limit: number | null = null;
  private offset: number | null = null;

  // Colunas permitidas para seleção
  private allowedSelectColumns: string[] = [];
  // Colunas permitidas para WHERE
  private allowedWhereColumns: string[] = [];
  // Colunas permitidas para ORDER BY
  private allowedOrderColumns: string[] = [];
  // Tabelas permitidas para JOIN
  private allowedTables: string[] = [];

  /**
   * Construtor com configuração de segurança
   */
  constructor(config?: {
    selectColumns?: string[];
    whereColumns?: string[];
    orderColumns?: string[];
    tables?: string[];
  }) {
    this.allowedSelectColumns = config?.selectColumns || [];
    this.allowedWhereColumns = config?.whereColumns || [];
    this.allowedOrderColumns = config?.orderColumns || [];
    this.allowedTables = config?.tables || [];
  }

  /**
   * SELECT com validação de colunas
   */
  select(columns: string[] = ['*']): SecureQueryBuilder {
    // Validar colunas permitidas
    if (columns.length > 0 && !columns.includes('*')) {
      const validColumns = columns.filter(col => 
        this.allowedSelectColumns.length === 0 || 
        this.allowedSelectColumns.includes(col)
      );
      
      if (validColumns.length !== columns.length) {
        throw new Error(`Colunas não permitidas: ${columns.filter(col => !validColumns.includes(col)).join(', ')}`);
      }
      
      this.sql += `SELECT ${validColumns.join(', ')}`;
    } else {
      this.sql += 'SELECT *';
    }
    
    return this;
  }

  /**
   * FROM com validação de tabela
   */
  from(table: string): SecureQueryBuilder {
    this.sql += ` FROM ${this.validateTable(table)}`;
    return this;
  }

  /**
   * INNER JOIN com validação
   */
  innerJoin(table: string, on: string): SecureQueryBuilder {
    this.joins.push({ table: this.validateTable(table), type: 'INNER', on });
    return this;
  }

  /**
   * LEFT JOIN com validação
   */
  leftJoin(table: string, on: string): SecureQueryBuilder {
    this.joins.push({ table: this.validateTable(table), type: 'LEFT', on });
    return this;
  }

  /**
   * RIGHT JOIN com validação
   */
  rightJoin(table: string, on: string): SecureQueryBuilder {
    this.joins.push({ table: this.validateTable(table), type: 'RIGHT', on });
    return this;
  }

  /**
   * FULL JOIN com validação
   */
  fullJoin(table: string, on: string): SecureQueryBuilder {
    this.joins.push({ table: this.validateTable(table), type: 'FULL', on });
    return this;
  }

  /**
   * WHERE com validação de colunas e operadores
   */
  where(column: string, operator: QueryOperator, value: any, logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    // Validar coluna
    this.validateColumn(column, 'WHERE');
    
    // Validar operador
    this.validateOperator(operator);
    
    // Validar valor
    this.validateValue(value, operator);
    
    this.whereConditions.push({ column, operator, value, logicalOperator });
    return this;
  }

  /**
   * WHERE com objeto
   */
  whereObject(conditions: Record<string, any>, logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    for (const [column, value] of Object.entries(conditions)) {
      this.where(column, '=', value, logicalOperator);
    }
    return this;
  }

  /**
   * WHERE IN com validação
   */
  whereIn(column: string, values: any[], logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    this.validateColumn(column, 'WHERE');
    
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Valores para WHERE IN devem ser um array não vazio');
    }
    
    this.whereConditions.push({ column, operator: 'IN', value: values, logicalOperator });
    return this;
  }

  /**
   * WHERE IS NULL
   */
  whereIsNull(column: string, logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    this.validateColumn(column, 'WHERE');
    this.whereConditions.push({ column, operator: 'IS NULL', value: null, logicalOperator });
    return this;
  }

  /**
   * WHERE IS NOT NULL
   */
  whereIsNotNull(column: string, logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    this.validateColumn(column, 'WHERE');
    this.whereConditions.push({ column, operator: 'IS NOT NULL', value: null, logicalOperator });
    return this;
  }

  /**
   * WHERE BETWEEN
   */
  whereBetween(column: string, min: any, max: any, logicalOperator: 'AND' | 'OR' = 'AND'): SecureQueryBuilder {
    this.validateColumn(column, 'WHERE');
    this.validateValue(min, 'BETWEEN');
    this.validateValue(max, 'BETWEEN');
    
    this.whereConditions.push({ 
      column, 
      operator: 'BETWEEN', 
      value: { min, max }, 
      logicalOperator 
    });
    return this;
  }

  /**
   * GROUP BY com validação
   */
  groupBy(columns: string[]): SecureQueryBuilder {
    const validColumns = columns.filter(col => 
      this.allowedSelectColumns.length === 0 || 
      this.allowedSelectColumns.includes(col) ||
      this.allowedWhereColumns.includes(col)
    );
    
    if (validColumns.length !== columns.length) {
      throw new Error(`Colunas não permitidas para GROUP BY: ${columns.filter(col => !validColumns.includes(col)).join(', ')}`);
    }
    
    this.groupBy = validColumns;
    this.sql += ` GROUP BY ${validColumns.join(', ')}`;
    return this;
  }

  /**
   * ORDER BY com validação
   */
  orderBy(column: string, direction: SortDirection = 'ASC'): SecureQueryBuilder {
    this.validateColumn(column, 'ORDER BY');
    
    if (!['ASC', 'DESC'].includes(direction)) {
      throw new Error('Direction deve ser ASC ou DESC');
    }
    
    this.orderBy.push({ column, direction });
    return this;
  }

  /**
   * LIMIT com validação
   */
  limit(count: number): SecureQueryBuilder {
    if (typeof count !== 'number' || count <= 0 || count > 10000) {
      throw new Error('Limit deve ser um número entre 1 e 10000');
    }
    
    this.limit = count;
    this.sql += ` LIMIT ${count}`;
    return this;
  }

  /**
   * OFFSET com validação
   */
  offset(count: number): SecureQueryBuilder {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('Offset deve ser um número não negativo');
    }
    
    this.offset = count;
    this.sql += ` OFFSET ${count}`;
    return this;
  }

  /**
   * Compilar query final
   */
  build(): { sql: string; params: any[] } {
    // Adicionar JOINs
    if (this.joins.length > 0) {
      for (const join of this.joins) {
        this.sql += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
      }
    }
    
    // Adicionar WHERE
    if (this.whereConditions.length > 0) {
      let whereClause = ' WHERE ';
      let first = true;
      
      for (const condition of this.whereConditions) {
        if (!first) {
          whereClause += ` ${condition.logicalOperator || 'AND'} `;
        }
        first = false;
        
        whereClause += this.buildWhereClause(condition);
      }
      
      this.sql += whereClause;
    }
    
    // Adicionar ORDER BY
    if (this.orderBy.length > 0) {
      const orderClause = this.orderBy
        .map(order => `${order.column} ${order.direction}`)
        .join(', ');
      this.sql += ` ORDER BY ${orderClause}`;
    }
    
    return {
      sql: this.sql,
      params: this.params
    };
  }

  /**
   * Compilar COUNT query
   */
  buildCount(): { sql: string; params: any[] } {
    const originalSelect = this.sql;
    this.sql = 'SELECT COUNT(*) as total';
    
    // Adicionar apenas FROM, WHERE, GROUP BY
    const parts = originalSelect.split(' FROM ');
    if (parts.length > 1) {
      const fromAndJoins = parts[1];
      const selectIndex = fromAndJoins.indexOf(' WHERE ');
      const selectGroup = fromAndJoins.indexOf(' GROUP BY ');
      
      let fromClause = fromAndJoins;
      if (selectIndex > 0) {
        fromClause = fromAndJoins.substring(0, selectIndex);
      } else if (selectGroup > 0) {
        fromClause = fromAndJoins.substring(0, selectGroup);
      }
      
      this.sql += ` FROM ${fromClause}`;
      
      // Adicionar WHERE
      if (selectIndex > 0) {
        const whereClause = fromAndJoins.substring(selectIndex);
        const groupIndex = whereClause.indexOf(' GROUP BY ');
        if (groupIndex > 0) {
          this.sql += whereClause.substring(0, groupIndex);
        } else {
          this.sql += whereClause;
        }
      }
      
      // Adicionar GROUP BY
      if (selectGroup > 0) {
        const groupClause = fromAndJoins.substring(selectGroup);
        this.sql += groupClause;
      }
    }
    
    const result = this.build();
    return result;
  }

  /**
   * Reset builder
   */
  reset(): void {
    this.sql = '';
    this.params = [];
    this.whereConditions = [];
    this.joins = [];
    this.orderBy = [];
    this.groupBy = [];
    this.limit = null;
    this.offset = null;
  }

  /**
   * Validar tabela
   */
  private validateTable(table: string): string {
    if (!table || typeof table !== 'string') {
      throw new Error('Nome da tabela é obrigatório');
    }
    
    if (this.allowedTables.length > 0 && !this.allowedTables.includes(table)) {
      throw new Error(`Tabela ${table} não permitida`);
    }
    
    // Sanitizar nome da tabela (apenas letras, números, underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error('Nome da tabela contém caracteres inválidos');
    }
    
    return table;
  }

  /**
   * Validar coluna
   */
  private validateColumn(column: string, context: string): void {
    if (!column || typeof column !== 'string') {
      throw new Error(`Coluna é obrigatória para ${context}`);
    }
    
    const allowedColumns = this.getAllowedColumnsForContext(context);
    if (allowedColumns.length > 0 && !allowedColumns.includes(column)) {
      throw new Error(`Coluna ${column} não permitida para ${context}`);
    }
    
    // Sanitizar nome da coluna (apenas letras, números, underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error(`Nome da coluna contém caracteres inválidos: ${column}`);
    }
  }

  /**
   * Validar operador
   */
  private validateOperator(operator: QueryOperator): void {
    const allowedOperators: QueryOperator[] = [
      '=', '!=', '>', '<', '>=', '<=', 
      'LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL',
      'BETWEEN', 'NOT BETWEEN'
    ];
    
    if (!allowedOperators.includes(operator)) {
      throw new Error(`Operador ${operator} não permitido`);
    }
  }

  /**
   * Validar valor
   */
  private validateValue(value: any, operator: QueryOperator): void {
    if (['IS NULL', 'IS NOT NULL'].includes(operator)) {
      return; // Estos operadores não requerem valor
    }
    
    if (value === null || value === undefined) {
      throw new Error(`Valor é obrigatório para operador ${operator}`);
    }
  }

  /**
   * Obter colunas permitidas para contexto
   */
  private getAllowedColumnsForContext(context: string): string[] {
    switch (context) {
      case 'SELECT':
        return this.allowedSelectColumns;
      case 'WHERE':
        return this.allowedWhereColumns;
      case 'ORDER BY':
        return this.allowedOrderColumns;
      default:
        return [];
    }
  }

  /**
   * Construir cláusula WHERE
   */
  private buildWhereClause(condition: WhereCondition): string {
    const { column, operator, value, logicalOperator } = condition;
    
    // Adicionar parâmetro
    this.params.push(value);
    
    switch (operator) {
      case 'IS NULL':
      case 'IS NOT NULL':
        return `${column} ${operator}`;
      
      case 'IN':
      case 'NOT IN':
        if (Array.isArray(value) && value.length > 0) {
          const placeholders = value.map(() => `$${this.params.length - value.length + value.indexOf(value) + 1}`);
          return `${column} ${operator} (${placeholders.join(', ')})`;
        }
        return `1=0`; // Retornar false se array vazio
      
      case 'BETWEEN':
      case 'NOT BETWEEN':
        if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
          return `${column} ${operator} $${this.params.length - 1} AND $${this.params.length}`;
        }
        return `1=0`;
      
      default:
        return `${column} ${operator} $${this.params.length}`;
    }
  }
}

/**
 * Factory para criar query builders com configurações pré-definidas
 */
export class QueryBuilderFactory {
  /**
   * Query builder para usuários
   */
  static createUserQueryBuilder(): SecureQueryBuilder {
    return new SecureQueryBuilder({
      selectColumns: ['id', 'name', 'email', 'created_at', 'updated_at', 'status'],
      whereColumns: ['id', 'email', 'status', 'created_at'],
      orderColumns: ['id', 'name', 'email', 'created_at'],
      tables: ['users', 'user_profiles']
    });
  }

  /**
   * Query builder para documentos
   */
  static createDocumentQueryBuilder(): SecureQueryBuilder {
    return new SecureQueryBuilder({
      selectColumns: ['id', 'title', 'type', 'status', 'created_at', 'updated_at', 'user_id'],
      whereColumns: ['id', 'title', 'type', 'status', 'user_id', 'created_at'],
      orderColumns: ['id', 'title', 'created_at'],
      tables: ['documents', 'document_versions']
    });
  }

  /**
   * Query builder genérico
   */
  static createGenericQueryBuilder(allowedColumns: string[]): SecureQueryBuilder {
    return new SecureQueryBuilder({
      selectColumns: allowedColumns,
      whereColumns: allowedColumns,
      orderColumns: allowedColumns
    });
  }
}

/**
 * Helper para validar IDs
 */
export function validateQueryId(id: string | number): void {
  const result = validateId(id);
  if (!result.isValid) {
    throw new Error(`ID inválido: ${result.errors.join(', ')}`);
  }
}

/**
 * Helper para paginação segura
 */
export function validatePagination(page: number, limit: number): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.floor(page || 1));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)));
  const offset = (safePage - 1) * safeLimit;
  
  return { page: safePage, limit: safeLimit, offset };
}
