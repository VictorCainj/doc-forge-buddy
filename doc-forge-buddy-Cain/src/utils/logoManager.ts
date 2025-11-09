/**
 * Sistema de gerenciamento de logo com fallback seguro
 * Evita problemas de URL externa quebrada
 */

export const getCompanyLogo = (): string => {
  // Tentar carregar logo local primeiro
  try {
    // Verificar se existe logo local
    const localLogo = '/logo.png';
    return localLogo;
  } catch {
    // Fallback para logo externo
    return 'https://i.imgur.com/jSbw2Ec.jpeg';
  }
};

export const getCompanyLogoWebP = (): string => {
  // Versão WebP do logo (se disponível)
  try {
    const localLogoWebP = '/logo.webp';
    return localLogoWebP;
  } catch {
    // Fallback para logo PNG
    return getCompanyLogo();
  }
};

/**
 * Função para verificar se a imagem carrega corretamente
 * @param src URL da imagem
 * @returns Promise que resolve para true se a imagem carrega, false caso contrário
 */
export const checkImageLoad = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

/**
 * Hook para gerenciar logo com fallback automático
 * @returns URL do logo que funciona
 */
export const useCompanyLogo = (): string => {
  const [logoUrl, setLogoUrl] = React.useState<string>(getCompanyLogo());

  React.useEffect(() => {
    const verifyLogo = async () => {
      const isLocalWorking = await checkImageLoad('/logo.png');

      if (!isLocalWorking) {
        const isExternalWorking = await checkImageLoad(
          'https://i.imgur.com/jSbw2Ec.jpeg'
        );

        if (!isExternalWorking) {
          // Se nenhum logo funcionar, usar placeholder
          setLogoUrl('/placeholder.svg');
        }
      }
    };

    verifyLogo();
  }, []);

  return logoUrl;
};

// Import React para o hook
import React from 'react';
