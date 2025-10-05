import { File } from 'buffer';

export type BudgetItemType = 'material' | 'servico';

export interface BudgetItem {
  id: string;
  ambiente: string;
  subtitulo: string;
  descricao: string;
  tipo: BudgetItemType;
  valor: number;
  quantidade: number;
  unidade: string;
  fotoAntes?: {
    fotos: File[];
    descritivoLaudo?: string;
  };
  fotoDepois?: {
    fotos: File[];
    descritivoLaudo?: string;
  };
  observacao: string;
}

export interface DadosPrestador {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
}

export interface DadosOrcamento {
  cliente: string;
  endereco: string;
  dataOrcamento: string;
  validadeOrcamento?: string;
  formaPagamento?: string;
  observacoesGerais?: string;
  prestador?: DadosPrestador;
}

export interface Orcamento {
  id?: string;
  title: string;
  contract_id?: string | null;
  dados_orcamento: DadosOrcamento;
  itens: BudgetItem[];
  valorTotal: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado';
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface OrcamentoImage {
  id?: string;
  orcamento_id: string;
  item_id: string;
  tipo_foto: 'antes' | 'depois';
  image_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
  user_id?: string | null;
}

export interface OrcamentoWithImages extends Orcamento {
  images: OrcamentoImage[];
}

export interface CreateOrcamentoData {
  title: string;
  contract_id?: string | null;
  dados_orcamento: DadosOrcamento;
  itens: BudgetItem[];
}

export interface UpdateOrcamentoData {
  title?: string;
  contract_id?: string | null;
  dados_orcamento?: DadosOrcamento;
  itens?: BudgetItem[];
  status?: Orcamento['status'];
}
