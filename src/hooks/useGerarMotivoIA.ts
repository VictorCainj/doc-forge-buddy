import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContratoDesocupacao } from '@/types/dashboardDesocupacao';
import {
  analisarMotivo,
  sugerirMotivo,
  gerarSugestoesKeyword,
  MOTIVO_KEYWORDS,
} from '@/utils/motivoKeywords';

interface GerarMotivoIAParams {
  contrato: ContratoDesocupacao;
  motivosExistentes: string[];
}

export const useGerarMotivoIA = () => {
  const [isLoading, setIsLoading] = useState(false);

  const gerarMotivoIA = async ({
    contrato,
    motivosExistentes,
  }: GerarMotivoIAParams) => {
    setIsLoading(true);

    try {
      // Buscar motivos existentes no banco se não foram fornecidos
      let motivosParaAnalise = motivosExistentes;

      if (motivosParaAnalise.length === 0) {
        try {
          // Buscar diretamente da tabela saved_terms onde os dados estão armazenados
          const { data: savedTerms, error: savedTermsError } = await supabase
            .from('saved_terms')
            .select('form_data');

          if (!savedTermsError && savedTerms) {
            motivosParaAnalise = savedTerms
              .map((s) => s.form_data?.motivoDesocupacao)
              .filter(Boolean) as string[];
          } else {
            console.warn('Erro ao buscar motivos existentes:', savedTermsError);
            motivosParaAnalise = [];
          }
        } catch (dbError) {
          console.warn('Erro ao buscar motivos existentes:', dbError);
          // Continuar com array vazio se houver erro na consulta
          motivosParaAnalise = [];
        }
      }

      // Criar prompt para a IA
      const prompt = criarPromptParaIA(contrato, motivosParaAnalise);

      // Chamar função do Supabase para gerar com IA
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: {
          action: 'chatCompletion',
          data: {
            prompt: prompt,
          },
        },
      });

      if (error) {
        console.error('Erro da função IA:', error);
        throw new Error(
          `Erro na API de IA: ${error.message || 'Erro desconhecido'}`
        );
      }

      if (!data) {
        throw new Error('Resposta da IA inválida');
      }

      // Processar resposta baseado no formato da função openai-proxy
      let motivoGerado = '';

      if (data && data.success && data.content) {
        motivoGerado = data.content.trim();
      } else {
        console.error('Formato de resposta inesperado:', data);
        throw new Error('Resposta da IA não contém conteúdo válido');
      }

      return motivoGerado;
    } catch (error) {
      console.error('Erro ao gerar motivo com IA:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    gerarMotivoIA,
    isLoading,
  };
};

function criarPromptParaIA(
  contrato: ContratoDesocupacao,
  motivosExistentes: string[]
): string {
  const motivoAtual = contrato.motivoDesocupacao || '';

  // Se não há motivo atual, usar o prompt original
  if (!motivoAtual.trim()) {
    return criarPromptParaNovoMotivo(contrato, motivosExistentes);
  }

  // Prompt para resumir o motivo existente
  return `
Você é um assistente especializado em resumir motivos de desocupação de contratos de locação.

TAREFA: Resuma o motivo existente em um formato mais conciso e padronizado.

MOTIVO ATUAL PARA RESUMIR:
"${motivoAtual}"

INFORMAÇÕES DO CONTRATO:
- Número: ${contrato.numeroContrato}
- Locador: ${contrato.nomeLocador || 'Não informado'}
- Locatário: ${contrato.nomeLocatario || 'Não informado'}
- Endereço: ${contrato.enderecoImovel || 'Não informado'}

PALAVRAS-CHAVE DISPONÍVEIS:
${MOTIVO_KEYWORDS.map((k) => `- ${k.keyword} (${k.category}): ${k.examples[0]}`).join('\n')}

INSTRUÇÕES PARA RESUMO:
1. MANTENHA o contexto e significado original do motivo
2. Use uma das palavras-chave disponíveis como base
3. Seja mais conciso e direto (máximo 100 caracteres)
4. Preserve informações importantes do motivo original
5. Use linguagem formal e profissional
6. Termine com a palavra-chave apropriada

FORMATO DE RESPOSTA:
Use o formato: "[Descrição resumida] - [Palavra-chave]"

Exemplos de resumo:
- Motivo original: "A empresa está passando por uma reestruturação organizacional e precisa reduzir custos operacionais" → "Reestruturação da empresa - Reestruturação"
- Motivo original: "O locatário não conseguiu pagar o aluguel por problemas financeiros" → "Problemas financeiros do locatário - Não Pagamento"

IMPORTANTE: Resuma SEMPRE mantendo o contexto original. Não invente informações novas.

Gere apenas o motivo resumido no formato especificado, sem explicações adicionais.
  `.trim();
}

function criarPromptParaNovoMotivo(
  contrato: ContratoDesocupacao,
  motivosExistentes: string[]
): string {
  const motivosUnicos = [...new Set(motivosExistentes)].slice(0, 20);

  // Analisar motivos existentes e extrair palavras-chave mais comuns
  const motivosAnalisados = motivosExistentes.map((motivo) => ({
    original: motivo,
    keyword: analisarMotivo(motivo),
  }));

  // Contar frequência de palavras-chave
  const keywordCount: Record<string, number> = {};
  motivosAnalisados.forEach(({ keyword }) => {
    if (keyword) {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    }
  });

  const keywordsComuns = Object.entries(keywordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // Gerar sugestões baseadas no contexto do contrato
  const contexto = `${contrato.enderecoImovel} ${contrato.nomeLocatario}`;
  const sugestoesContexto = gerarSugestoesKeyword(contexto);

  return `
Analise as informações do contrato e gere um motivo de desocupação apropriado usando o sistema de palavras-chave.

INFORMAÇÕES DO CONTRATO:
- Número: ${contrato.numeroContrato}
- Locador: ${contrato.nomeLocador || 'Não informado'}
- Locatário: ${contrato.nomeLocatario || 'Não informado'}
- Endereço: ${contrato.enderecoImovel || 'Não informado'}
- Data Início Rescisão: ${contrato.dataInicioRescisao || 'Não informada'}
- Data Fim Rescisão: ${contrato.dataTerminoRescisao || 'Não informada'}

PALAVRAS-CHAVE DISPONÍVEIS:
${MOTIVO_KEYWORDS.map((k) => `- ${k.keyword} (${k.category}): ${k.examples[0]}`).join('\n')}

MOTIVOS EXISTENTES PARA REFERÊNCIA:
${motivosUnicos.map((motivo, index) => `${index + 1}. ${motivo}`).join('\n')}

PALAVRAS-CHAVE MAIS USADAS:
${keywordsComuns.join(', ')}

SUGESTÕES BASEADAS NO CONTEXTO:
${sugestoesContexto.join(', ')}

INSTRUÇÕES CRÍTICAS:
1. SEMPRE use uma das palavras-chave disponíveis como base
2. Gere um motivo claro e objetivo (máximo 150 caracteres)
3. Se o contexto sugerir uma palavra-chave específica, priorize ela
4. Se não houver contexto claro, use palavras-chave mais comuns
5. Seja específico mas conciso
6. Evite informações pessoais desnecessárias
7. Use linguagem formal e profissional
8. SEMPRE termine com a palavra-chave principal

FORMATO DE RESPOSTA:
Use o formato: "[Descrição específica] - [Palavra-chave]"

Exemplos:
- "Expansão da empresa para novo mercado - Expansão"
- "Fim do período contratual sem renovação - Fim de Contrato"
- "Mudança de cidade por transferência - Mudança de Cidade"

Gere apenas o motivo da desocupação no formato especificado, sem explicações adicionais.
  `.trim();
}
