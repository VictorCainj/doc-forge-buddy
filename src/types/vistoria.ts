export type VistoriaFoto = File | {
  name: string;
  url: string;
  isFromDatabase: boolean;
  size: number;
  type: string;
};

export interface ApontamentoVistoria {
  id: string;
  ambiente: string;
  subtitulo: string;
  descricao: string;
  vistoriaInicial: {
    fotos: VistoriaFoto[];
    descritivoLaudo?: string;
  };
  vistoriaFinal: {
    fotos: VistoriaFoto[];
  };
  observacao: string;
  tipo?: 'material' | 'mao_de_obra';
  valor?: number;
  quantidade?: number;
  unidade?: string;
}

export interface DadosVistoria {
  locatario: string;
  endereco: string;
  dataVistoria: string;
}

export interface VistoriaAnalise {
  id?: string;
  title: string;
  contract_id?: string | null;
  dados_vistoria: DadosVistoria;
  apontamentos: ApontamentoVistoria[];
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
}

export interface VistoriaImage {
  id?: string;
  vistoria_id: string;
  apontamento_id: string;
  tipo_vistoria: string;
  image_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
  user_id?: string | null;
}

export interface VistoriaAnaliseWithImages extends VistoriaAnalise {
  images: VistoriaImage[];
}

export interface CreateVistoriaData {
  title: string;
  contract_id?: string | null;
  dados_vistoria: DadosVistoria;
  apontamentos: ApontamentoVistoria[];
}

export interface UpdateVistoriaData {
  title?: string;
  contract_id?: string | null;
  dados_vistoria?: DadosVistoria;
  apontamentos?: ApontamentoVistoria[];
}
