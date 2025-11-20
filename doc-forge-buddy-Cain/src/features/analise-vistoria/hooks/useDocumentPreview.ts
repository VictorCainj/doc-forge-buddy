import { useCallback, useEffect } from 'react';
import { ANALISE_VISTORIA_TEMPLATE } from '@/templates/analiseVistoria';
import { log } from '@/utils/logger';
import { useAnaliseVistoriaContext } from '../context/AnaliseVistoriaContext';
import { usePrestadores } from '@/hooks/usePrestadores';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { anonymizeName, anonymizeAddress } from '@/utils/privacyUtils';

export const useDocumentPreview = () => {
  const {
    apontamentos,
    dadosVistoria,
    documentMode,
    selectedPrestadorId,
    setDocumentPreview,
  } = useAnaliseVistoriaContext();
  const { prestadores } = usePrestadores();
  const { isPrivacyModeActive } = usePrivacyMode();

  const updateDocumentPreview = useCallback(async () => {
    if (apontamentos.length === 0) {
      setDocumentPreview('');
      return;
    }

    try {
      // Validar se todos os apontamentos têm dados válidos
      const apontamentosValidos = apontamentos.filter((apontamento) => {
        return apontamento.ambiente && apontamento.descricao;
      });

      if (apontamentosValidos.length === 0) {
        setDocumentPreview('');
        return;
      }

      log.debug('Apontamentos antes da validação', {
        totalApontamentos: apontamentosValidos.length,
      });

      // Verificar se há fotos válidas nos apontamentos
      const apontamentosComFotos = apontamentosValidos.map((apontamento) => {
        const fotosInicialValidas =
          apontamento.vistoriaInicial?.fotos?.filter((foto) => {
            if (foto?.isFromDatabase) {
              return foto.url && foto.url.length > 0;
            }
            return foto instanceof File && foto.size > 0;
          }) || [];

        const fotosFinalValidas =
          apontamento.vistoriaFinal?.fotos?.filter((foto) => {
            if (foto?.isFromDatabase) {
              return foto.url && foto.url.length > 0;
            }
            if (foto?.isExternal) {
              return foto.url && foto.url.length > 0;
            }
            return foto instanceof File && foto.size > 0;
          }) || [];

        return {
          ...apontamento,
          vistoriaInicial: {
            ...apontamento.vistoriaInicial,
            fotos: fotosInicialValidas,
          },
          vistoriaFinal: {
            ...apontamento.vistoriaFinal,
            fotos: fotosFinalValidas,
          },
        };
      });

      // Aplicar anonimização se necessário
      const locatarioProcessado = isPrivacyModeActive
        ? anonymizeName(dadosVistoria.locatario)
        : dadosVistoria.locatario;
      const enderecoProcessado = isPrivacyModeActive
        ? anonymizeAddress(dadosVistoria.endereco)
        : dadosVistoria.endereco;

      // Gerar template do documento
      const template = await ANALISE_VISTORIA_TEMPLATE({
        locatario: locatarioProcessado,
        endereco: enderecoProcessado,
        dataVistoria: dadosVistoria.dataVistoria,
        documentMode,
        prestador:
          documentMode === 'orcamento' && selectedPrestadorId
            ? prestadores.find((p) => p.id === selectedPrestadorId)
            : undefined,
        apontamentos: apontamentosComFotos,
      });

      setDocumentPreview(template);
    } catch (error) {
      console.error('Erro ao atualizar pré-visualização:', error);
      setDocumentPreview('');
    }
  }, [
    apontamentos,
    dadosVistoria,
    documentMode,
    selectedPrestadorId,
    prestadores,
    setDocumentPreview,
    isPrivacyModeActive,
  ]);

  // Atualizar pré-visualização do documento em tempo real
  useEffect(() => {
    updateDocumentPreview();
  }, [updateDocumentPreview]);

  return { updateDocumentPreview };
};
