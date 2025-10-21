/**
 * Sistema de palavras-chave para motivos de desocupação
 * Agrupa motivos similares e sugere palavras-chave consistentes
 */

export interface MotivoKeyword {
  keyword: string;
  synonyms: string[];
  examples: string[];
  category: string;
}

export const MOTIVO_KEYWORDS: MotivoKeyword[] = [
  {
    keyword: 'Expansão',
    synonyms: ['expansão', 'crescimento', 'ampliação', 'aumento'],
    examples: [
      'Expansão da empresa',
      'Crescimento do negócio',
      'Ampliação das atividades',
    ],
    category: 'Crescimento',
  },
  {
    keyword: 'Reestruturação',
    synonyms: [
      'reestruturação',
      'reorganização',
      'reformulação',
      'mudança organizacional',
    ],
    examples: [
      'Reestruturação da empresa',
      'Reorganização interna',
      'Mudança de estratégia',
    ],
    category: 'Organizacional',
  },
  {
    keyword: 'Fim de Contrato',
    synonyms: ['fim de contrato', 'término', 'vencimento', 'não renovação'],
    examples: [
      'Fim do período contratual',
      'Não renovação do contrato',
      'Término do prazo',
    ],
    category: 'Contratual',
  },
  {
    keyword: 'Mudança de Cidade',
    synonyms: ['mudança', 'transferência', 'relocação', 'mudança de endereço'],
    examples: [
      'Mudança para outra cidade',
      'Transferência da empresa',
      'Relocação',
    ],
    category: 'Geográfica',
  },
  {
    keyword: 'Falência',
    synonyms: ['falência', 'falência', 'insolvência', 'fechamento'],
    examples: [
      'Falência da empresa',
      'Insolvência',
      'Fechamento das atividades',
    ],
    category: 'Financeira',
  },
  {
    keyword: 'Falecimento',
    synonyms: ['falecimento', 'óbito', 'morte'],
    examples: ['Falecimento do locatário', 'Óbito', 'Morte do responsável'],
    category: 'Pessoal',
  },
  {
    keyword: 'Não Pagamento',
    synonyms: ['não pagamento', 'inadimplência', 'atraso', 'descumprimento'],
    examples: [
      'Não pagamento do aluguel',
      'Inadimplência',
      'Atraso nas mensalidades',
    ],
    category: 'Financeira',
  },
  {
    keyword: 'Violação de Contrato',
    synonyms: ['violação', 'descumprimento', 'infração', 'quebra de contrato'],
    examples: [
      'Violação das cláusulas',
      'Descumprimento contratual',
      'Infração dos termos',
    ],
    category: 'Contratual',
  },
  {
    keyword: 'Uso Inadequado',
    synonyms: [
      'uso inadequado',
      'uso indevido',
      'uso irregular',
      'má utilização',
    ],
    examples: ['Uso inadequado do imóvel', 'Uso indevido', 'Má utilização'],
    category: 'Uso',
  },
  {
    keyword: 'Reforma',
    synonyms: ['reforma', 'renovação', 'melhoria', 'adequação'],
    examples: ['Reforma do imóvel', 'Renovação', 'Melhorias necessárias'],
    category: 'Obra',
  },
];

/**
 * Analisa um motivo e retorna a palavra-chave mais adequada
 */
export function analisarMotivo(motivo: string): string {
  if (!motivo || motivo.trim() === '') return '';

  const motivoLower = motivo.toLowerCase().trim();

  // Buscar palavra-chave mais adequada
  for (const keywordData of MOTIVO_KEYWORDS) {
    for (const synonym of keywordData.synonyms) {
      if (motivoLower.includes(synonym.toLowerCase())) {
        return keywordData.keyword;
      }
    }
  }

  // Se não encontrou correspondência, retornar o motivo original
  return motivo;
}

/**
 * Sugere melhorias para um motivo baseado nas palavras-chave
 */
export function sugerirMotivo(motivo: string): string {
  const keyword = analisarMotivo(motivo);

  if (keyword && keyword !== motivo) {
    // Encontrar exemplos da palavra-chave
    const keywordData = MOTIVO_KEYWORDS.find((k) => k.keyword === keyword);
    if (keywordData && keywordData.examples.length > 0) {
      // Retornar um exemplo mais estruturado
      return keywordData.examples[0];
    }
  }

  return motivo;
}

/**
 * Agrupa motivos por palavra-chave
 */
export function agruparMotivosPorKeyword(
  motivos: string[]
): Record<string, string[]> {
  const grupos: Record<string, string[]> = {};

  motivos.forEach((motivo) => {
    const keyword = analisarMotivo(motivo);
    const chave = keyword || 'Outros';

    if (!grupos[chave]) {
      grupos[chave] = [];
    }

    if (!grupos[chave].includes(motivo)) {
      grupos[chave].push(motivo);
    }
  });

  return grupos;
}

/**
 * Retorna estatísticas de palavras-chave
 */
export function getEstatisticasKeywords(motivos: string[]) {
  const grupos = agruparMotivosPorKeyword(motivos);
  const total = motivos.length;

  const estatisticas = Object.entries(grupos).map(
    ([keyword, motivosGrupo]) => ({
      keyword,
      quantidade: motivosGrupo.length,
      porcentagem: Math.round((motivosGrupo.length / total) * 100),
      motivos: motivosGrupo,
    })
  );

  // Ordenar por quantidade (maior primeiro)
  return estatisticas.sort((a, b) => b.quantidade - a.quantidade);
}

/**
 * Gera sugestões de palavras-chave para um contexto específico
 */
export function gerarSugestoesKeyword(contexto: string): string[] {
  const contextoLower = contexto.toLowerCase();
  const sugestoes: string[] = [];

  MOTIVO_KEYWORDS.forEach((keywordData) => {
    // Verificar se alguma palavra do contexto corresponde aos sinônimos
    const palavrasContexto = contextoLower.split(/\s+/);

    for (const palavra of palavrasContexto) {
      for (const synonym of keywordData.synonyms) {
        if (
          palavra.includes(synonym.toLowerCase()) ||
          synonym.toLowerCase().includes(palavra)
        ) {
          if (!sugestoes.includes(keywordData.keyword)) {
            sugestoes.push(keywordData.keyword);
          }
        }
      }
    }
  });

  return sugestoes;
}
