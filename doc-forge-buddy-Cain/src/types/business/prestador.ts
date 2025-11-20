export interface Prestador {
  id: string;
  user_id: string | null;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  especialidade: string | null;
  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
  ativo?: boolean; // Added optional because it was used in the form, though not in the hook's interface initially
}

export interface CreatePrestadorData {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  especialidade?: string;
  observacoes?: string;
  ativo?: boolean;
}

