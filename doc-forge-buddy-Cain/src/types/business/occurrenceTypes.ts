/**
 * Tipos para tipos de ocorrência de contrato
 */

export interface OccurrenceType {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface UseOccurrenceTypesReturn {
  types: OccurrenceType[];
  isLoading: boolean;
  error: Error | null;
}

export interface UseOccurrenceTypesAdminReturn {
  types: OccurrenceType[];
  isLoading: boolean;
  error: Error | null;
  createType: (name: string, description?: string) => Promise<void>;
  updateType: (
    id: string,
    name: string,
    description: string | null,
    is_active: boolean
  ) => Promise<void>;
  deleteType: (id: string) => Promise<void>;
}

