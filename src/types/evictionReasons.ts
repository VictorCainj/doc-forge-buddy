/**
 * Tipos para motivos de desocupação
 */

export interface EvictionReason {
  id: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface UseEvictionReasonsReturn {
  reasons: EvictionReason[];
  isLoading: boolean;
  error: Error | null;
}

export interface UseEvictionReasonsAdminReturn {
  reasons: EvictionReason[];
  isLoading: boolean;
  error: Error | null;
  createReason: (description: string) => Promise<void>;
  updateReason: (id: string, description: string, is_active: boolean) => Promise<void>;
  deleteReason: (id: string) => Promise<void>;
}
