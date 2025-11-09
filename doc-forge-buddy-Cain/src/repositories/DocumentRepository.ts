/**
 * Repository específico para Documentos
 * Implementa operações especializadas para a entidade Document
 */

import type { BaseEntity } from '@/types/shared/base';
import { BaseRepository } from './BaseRepository';

export interface Document extends BaseEntity {
  title: string;
  content: string;
  document_type: string;
  contract_id?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
  metadata?: Record<string, any> | null;
}

export interface CreateDocumentData {
  title: string;
  content: string;
  document_type: string;
  contract_id?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  is_public?: boolean;
  status?: 'draft' | 'published' | 'archived';
  metadata?: Record<string, any>;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  updated_at?: string;
}

export class DocumentRepository extends BaseRepository<Document, string> {
  constructor(userId?: string | null) {
    super('documents', 'Document', userId);
  }

  /**
   * Busca documentos por tipo
   */
  async findByType(documentType: string): Promise<Document[]> {
    return this.findMany({ document_type: documentType } as any);
  }

  /**
   * Busca documentos por contrato
   */
  async findByContract(contractId: string): Promise<Document[]> {
    return this.findMany({ contract_id: contractId } as any);
  }

  /**
   * Busca documentos públicos
   */
  async findPublicDocuments(): Promise<Document[]> {
    return this.findMany({ is_public: true } as any);
  }

  /**
   * Busca documentos privados
   */
  async findPrivateDocuments(): Promise<Document[]> {
    return this.findMany({ is_public: false } as any);
  }

  /**
   * Busca documentos por status
   */
  async findByStatus(status: 'draft' | 'published' | 'archived'): Promise<Document[]> {
    return this.findMany({ status } as any);
  }

  /**
   * Busca documentos rascunho
   */
  async findDrafts(): Promise<Document[]> {
    return this.findByStatus('draft');
  }

  /**
   * Busca documentos publicados
   */
  async findPublished(): Promise<Document[]> {
    return this.findByStatus('published');
  }

  /**
   * Busca documentos arquivados
   */
  async findArchived(): Promise<Document[]> {
    return this.findByStatus('archived');
  }

  /**
   * Busca documentos por busca de texto
   */
  async searchDocuments(searchTerm: string, limit = 20): Promise<Document[]> {
    return this.findWithConditions([
      {
        column: 'title',
        operator: 'ilike',
        value: `%${searchTerm}%`
      }
    ], { column: 'title', ascending: true }, limit);
  }

  /**
   * Busca documentos por tipo de arquivo
   */
  async findByMimeType(mimeType: string): Promise<Document[]> {
    return this.findMany({ mime_type: mimeType } as any);
  }

  /**
   * Busca documentos com arquivos
   */
  async findWithFiles(): Promise<Document[]> {
    return this.findWithConditions([
      {
        column: 'file_url',
        operator: 'not_in',
        value: [null, '']
      }
    ]);
  }

  /**
   * Busca documentos sem arquivos
   */
  async findWithoutFiles(): Promise<Document[]> {
    return this.findWithConditions([
      {
        column: 'file_url',
        operator: 'in',
        value: [null, '']
      }
    ]);
  }

  /**
   * Cria documento com validações
   */
  async create(data: CreateDocumentData): Promise<Document> {
    // Validações
    this.validateDocumentData(data);

    // Dados padrão
    const documentData = {
      ...data,
      is_public: data.is_public || false,
      status: data.status || 'draft',
      metadata: data.metadata || null,
      updated_at: new Date().toISOString()
    };

    return super.create(documentData as any);
  }

  /**
   * Atualiza documento
   */
  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    // Validações
    if (data.title !== undefined) {
      this.validateTitle(data.title);
    }

    if (data.document_type !== undefined) {
      this.validateDocumentType(data.document_type);
    }

    return super.update(id, data as any);
  }

  /**
   * Publica documento
   */
  async publishDocument(id: string): Promise<Document> {
    return this.update(id, { 
      status: 'published',
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Arquiva documento
   */
  async archiveDocument(id: string): Promise<Document> {
    return this.update(id, { 
      status: 'archived',
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Torna documento público
   */
  async makePublic(id: string): Promise<Document> {
    return this.update(id, { 
      is_public: true,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Torna documento privado
   */
  async makePrivate(id: string): Promise<Document> {
    return this.update(id, { 
      is_public: false,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Adiciona arquivo ao documento
   */
  async addFile(
    id: string, 
    fileUrl: string, 
    fileName: string, 
    fileSize: number, 
    mimeType: string
  ): Promise<Document> {
    return this.update(id, {
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Remove arquivo do documento
   */
  async removeFile(id: string): Promise<Document> {
    return this.update(id, {
      file_url: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Atualiza metadata do documento
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Document> {
    return this.update(id, {
      metadata,
      updated_at: new Date().toISOString()
    } as any);
  }

  /**
   * Duplica documento
   */
  async duplicate(id: string, newTitle: string): Promise<Document> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Documento original não encontrado');
    }

    const duplicatedData: CreateDocumentData = {
      title: newTitle,
      content: original.content,
      document_type: original.document_type,
      contract_id: original.contract_id,
      is_public: false, // Documentos duplicados são privados por padrão
      status: 'draft',  // Documentos duplicados são rascunho por padrão
      metadata: original.metadata ? { ...original.metadata } : undefined
    };

    return this.create(duplicatedData);
  }

  /**
   * Obtém estatísticas dos documentos
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    public: number;
    private: number;
    withFiles: number;
    withoutFiles: number;
    recent: Document[];
  }> {
    const allDocuments = await this.findMany();
    
    const stats = {
      total: allDocuments.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      public: 0,
      private: 0,
      withFiles: 0,
      withoutFiles: 0,
      recent: [] as Document[]
    };

    allDocuments.forEach(doc => {
      // Contagem por tipo
      const type = doc.document_type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Contagem por status
      const status = doc.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Contagem público/privado
      if (doc.is_public) {
        stats.public++;
      } else {
        stats.private++;
      }

      // Contagem com/sem arquivos
      if (doc.file_url) {
        stats.withFiles++;
      } else {
        stats.withoutFiles++;
      }
    });

    // Documentos recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recent = allDocuments
      .filter(doc => new Date(doc.created_at) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return stats;
  }

  /**
   * Busca documentos órfãos (sem contrato)
   */
  async findOrphanDocuments(): Promise<Document[]> {
    return this.findWithConditions([
      {
        column: 'contract_id',
        operator: 'in',
        value: [null, '']
      }
    ]);
  }

  /**
   * Limpa documentos órfãos
   */
  async cleanupOrphanDocuments(): Promise<{ deleted: number; archived: number }> {
    const orphans = await this.findOrphanDocuments();
    
    let deleted = 0;
    let archived = 0;

    for (const doc of orphans) {
      if (doc.status === 'draft') {
        await this.delete(doc.id);
        deleted++;
      } else {
        await this.archiveDocument(doc.id);
        archived++;
      }
    }

    return { deleted, archived };
  }

  /**
   * Exporta documentos com filtros
   */
  async exportDocuments(filters?: {
    type?: string;
    status?: string;
    isPublic?: boolean;
    contractId?: string;
  }): Promise<Document[]> {
    const conditions: Array<{
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in';
      value: any;
    }> = [];

    if (filters) {
      if (filters.type) {
        conditions.push({
          column: 'document_type',
          operator: 'eq',
          value: filters.type
        });
      }

      if (filters.status) {
        conditions.push({
          column: 'status',
          operator: 'eq',
          value: filters.status
        });
      }

      if (filters.isPublic !== undefined) {
        conditions.push({
          column: 'is_public',
          operator: 'eq',
          value: filters.isPublic
        });
      }

      if (filters.contractId) {
        conditions.push({
          column: 'contract_id',
          operator: 'eq',
          value: filters.contractId
        });
      }
    }

    return conditions.length > 0 
      ? this.findWithConditions(conditions, { column: 'created_at', ascending: false })
      : this.findMany();
  }

  /**
   * Valida dados do documento
   */
  private validateDocumentData(data: CreateDocumentData): void {
    if (!data.title || data.title.trim() === '') {
      throw new Error('Título do documento é obrigatório');
    }

    this.validateTitle(data.title);

    if (!data.document_type || data.document_type.trim() === '') {
      throw new Error('Tipo de documento é obrigatório');
    }

    this.validateDocumentType(data.document_type);

    if (data.content && data.content.length > 1000000) { // 1MB de texto
      throw new Error('Conteúdo do documento muito longo (máximo 1MB)');
    }

    if (data.file_size && data.file_size > 50 * 1024 * 1024) { // 50MB
      throw new Error('Arquivo muito grande (máximo 50MB)');
    }
  }

  /**
   * Valida título
   */
  private validateTitle(title: string): void {
    if (title.length < 3) {
      throw new Error('Título deve ter pelo menos 3 caracteres');
    }

    if (title.length > 200) {
      throw new Error('Título deve ter no máximo 200 caracteres');
    }
  }

  /**
   * Valida tipo de documento
   */
  private validateDocumentType(type: string): void {
    const validTypes = [
      'contract',
      'report',
      'invoice',
      'receipt',
      'letter',
      'form',
      'template',
      'other'
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de documento inválido. Tipos válidos: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Busca documentos por metadata
   */
  async findByMetadata(key: string, value: any): Promise<Document[]> {
    return this.findWithConditions([
      {
        column: `metadata->${key}`,
        operator: 'eq',
        value: JSON.stringify(value)
      }
    ]);
  }
}