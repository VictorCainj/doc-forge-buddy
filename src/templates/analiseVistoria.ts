export const ANALISE_VISTORIA_TEMPLATE = async (dados: {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  apontamentos: Array<{
    ambiente: string;
    subtitulo: string;
    descricao: string;
    vistoriaInicial: {
      fotos: Array<
        File | { name: string; url: string; isFromDatabase: boolean }
      >;
      descritivoLaudo?: string;
    };
    vistoriaFinal: {
      fotos: Array<
        File | { name: string; url: string; isFromDatabase: boolean }
      >;
    };
    observacao: string;
  }>;
}) => {
  // Função para converter File para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Função para detectar dimensões da imagem
  const getImageDimensions = (base64: string): Promise<{ width: number; height: number; aspectRatio: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: aspectRatio
        });
      };
      img.onerror = () => {
        // Se não conseguir carregar, usar dimensões padrão
        resolve({ width: 400, height: 300, aspectRatio: 1.33 });
      };
      img.src = base64;
    });
  };

  // Função para calcular layout inteligente das imagens
  const calcularLayoutInteligente = (fotos: Array<{ width: number; height: number; aspectRatio: number; base64: string; nome: string }>) => {
    if (fotos.length === 0) return { layout: 'none', maxHeight: 0, columns: 1 };
    
    // Largura disponível para as imagens (considerando padding e gaps)
    const larguraDisponivel = 480; // Aproximadamente metade da largura do container
    const gap = 6;
    
    // Calcular altura máxima baseada na imagem mais alta
    const alturas = fotos.map(foto => {
      const larguraCalculada = Math.min(larguraDisponivel / (fotos.length > 1 ? 2 : 1) - gap, foto.width);
      return (larguraCalculada / foto.aspectRatio);
    });
    const maxHeight = Math.max(...alturas);
    
    // Determinar número de colunas baseado na quantidade e proporção das imagens
    let columns = 1;
    if (fotos.length === 1) {
      columns = 1;
    } else if (fotos.length === 2) {
      columns = 2;
    } else if (fotos.length <= 4) {
      // Para 3-4 fotos, usar 2 colunas
      columns = 2;
    } else {
      // Para 5+ fotos, usar 3 colunas
      columns = 3;
    }
    
    return {
      layout: fotos.length > 0 ? 'grid' : 'none',
      maxHeight: Math.min(maxHeight, 400), // Limitar altura máxima
      columns: columns,
      larguraDisponivel: larguraDisponivel
    };
  };

  // Função para processar fotos e converter para base64 com dimensões
  const processarFotos = async (
    fotos: Array<{
      name?: string;
      size?: number;
      type?: string;
      url?: string;
      isFromDatabase?: boolean;
    }>
  ) => {
    if (!fotos || fotos.length === 0) {
      return [];
    }

    const fotosBase64 = await Promise.all(
      fotos.map(async (foto, _index) => {
        try {
          let base64: string;
          
          // Se é uma imagem do banco de dados, usar a URL diretamente
          if (foto.isFromDatabase && foto.url) {
            base64 = foto.url;
          } else if (foto && foto instanceof File && foto.size > 0) {
            base64 = await fileToBase64(foto);
          } else {
            return null;
          }

          // Detectar dimensões da imagem
          const dimensions = await getImageDimensions(base64);
          
          return { 
            nome: foto.name, 
            base64,
            ...dimensions
          };
        } catch {
          return null;
        }
      })
    );

    // Filtrar fotos que falharam no processamento
    const fotosValidas = fotosBase64.filter((foto) => foto !== null);
    return fotosValidas;
  };

  let template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.3; max-width: 1000px; margin: 0 auto; padding: 15px; color: #2c3e50; background: #fff;">
      <!-- Cabeçalho Compacto -->
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #E5E7EB;">
        <h1 style="color: #000000; font-size: 20px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
          ANÁLISE COMPARATIVA DE VISTORIA
        </h1>
        <p style="color: #6B7280; font-size: 12px; margin: 8px 0 0 0; font-weight: 400;">
          Relatório de Contestação de Vistoria de Saída
        </p>
      </div>

      <!-- Informações do Contrato - Compacto -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px 16px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
        <div>
          <span style="color: #374151; font-size: 14px; font-weight: 600;">Contrato:</span>
          <span style="color: #000000; font-size: 14px; margin-left: 8px; font-weight: 700;">${dados.locatario}</span>
        </div>
        <div style="text-align: right;">
          <span style="color: #6B7280; font-size: 12px; font-weight: 400;">${dados.endereco}</span>
        </div>
      </div>
  `;

  // Processar todos os apontamentos
  for (let index = 0; index < dados.apontamentos.length; index++) {
    const apontamento = dados.apontamentos[index];

    try {
      // console.log(`\n=== PROCESSANDO APONTAMENTO ${index + 1}: ${apontamento.ambiente} ===`);
      // console.log('Fotos Inicial antes do processamento:', apontamento.vistoriaInicial?.fotos);
      // console.log('Fotos Final antes do processamento:', apontamento.vistoriaFinal?.fotos);

      // Processar fotos da vistoria inicial
      const fotosInicial = await processarFotos(
        apontamento.vistoriaInicial?.fotos || []
      );

      // Processar fotos da vistoria final
      const fotosFinal = await processarFotos(
        apontamento.vistoriaFinal?.fotos || []
      );

      // Calcular layouts inteligentes
      const layoutInicial = calcularLayoutInteligente(fotosInicial);
      const layoutFinal = calcularLayoutInteligente(fotosFinal);

      // console.log(`\n--- RESULTADO APONTAMENTO ${index + 1} ---`);
      // console.log('✅ Fotos Inicial processadas:', fotosInicial.length);
      // console.log('✅ Fotos Final processadas:', fotosFinal.length);

      template += `
      <div style="margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);">
        <!-- Header do Apontamento - Compacto -->
        <div style="background: #374151; color: #FFFFFF; padding: 10px 14px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #FFFFFF; text-transform: uppercase;">
            ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
          </h3>
        </div>
        
        <!-- Descrição do Laudo de Entrada - Compacta -->
        <div style="padding: 10px 14px; background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
          <p style="margin: 0; color: #000000; font-size: 12px; line-height: 1.4; font-weight: 500;">
            <strong>Descritivo:</strong> ${apontamento.descricao}
          </p>
        </div>
        
        <!-- Vistorias Lado a Lado - Layout Compacto Focado nas Imagens -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; min-height: 420px;">
          <!-- Vistoria Inicial -->
          <div style="border-right: 1px solid #E5E7EB; padding: 8px; background: #FFFFFF;">
            <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #000000; font-weight: bold; text-align: center; background: #F3F4F6; padding: 6px; border-radius: 3px; text-transform: uppercase;">VISTORIA INICIAL</h4>
            <div style="display: ${layoutInicial.layout}; grid-template-columns: repeat(${layoutInicial.columns}, 1fr); gap: 6px; height: calc(100% - 30px);">
              ${
                fotosInicial.length > 0
                  ? fotosInicial
                      .map((foto, fotoIndex) => {
                        // Calcular dimensões baseadas na proporção real da imagem
                        const larguraContainer = layoutInicial.larguraDisponivel / layoutInicial.columns - 6;
                        const larguraCalculada = Math.min(larguraContainer, foto.width);
                        const alturaCalculada = larguraCalculada / foto.aspectRatio;
                        const alturaFinal = Math.min(alturaCalculada, layoutInicial.maxHeight);
                        const larguraFinal = alturaFinal * foto.aspectRatio;
                        
                        return `
                      <div style="text-align: center; border: 1px solid #E5E7EB; border-radius: 3px; padding: 2px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; height: fit-content;">
                        <img src="${foto.base64}" 
                             style="width: ${larguraFinal}px; height: ${alturaFinal}px; border-radius: 2px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<div style="display: flex; align-items: center; justify-content: center; height: 250px;"><p style="color: #9CA3AF; font-style: italic; font-size: 11px; text-align: center; background: #F9FAFB; border-radius: 3px; border: 1px solid #E5E7EB; padding: 15px;">Sem fotos</p></div>'
              }
              ${
                apontamento.vistoriaInicial.descritivoLaudo
                  ? `
              <div style="margin-top: 6px; padding: 6px; background: #F9FAFB; border-radius: 3px; border: 1px solid #E5E7EB; grid-column: 1 / -1;">
                <p style="margin: 0; font-size: 10px; color: #374151; font-weight: 600;">Laudo:</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #6B7280; line-height: 1.3; font-weight: 400;">${apontamento.vistoriaInicial.descritivoLaudo}</p>
              </div>
              `
                  : ''
              }
            </div>
          </div>
          
          <!-- Vistoria Final -->
          <div style="padding: 8px; background: #FFFFFF;">
            <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #000000; font-weight: bold; text-align: center; background: #F3F4F6; padding: 6px; border-radius: 3px; text-transform: uppercase;">VISTORIA FINAL</h4>
            <div style="display: ${layoutFinal.layout}; grid-template-columns: repeat(${layoutFinal.columns}, 1fr); gap: 6px; height: calc(100% - 30px);">
              ${
                fotosFinal.length > 0
                  ? fotosFinal
                      .map((foto, fotoIndex) => {
                        // Calcular dimensões baseadas na proporção real da imagem
                        const larguraContainer = layoutFinal.larguraDisponivel / layoutFinal.columns - 6;
                        const larguraCalculada = Math.min(larguraContainer, foto.width);
                        const alturaCalculada = larguraCalculada / foto.aspectRatio;
                        const alturaFinal = Math.min(alturaCalculada, layoutFinal.maxHeight);
                        const larguraFinal = alturaFinal * foto.aspectRatio;
                        
                        return `
                      <div style="text-align: center; border: 1px solid #E5E7EB; border-radius: 3px; padding: 2px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; height: fit-content;">
                        <img src="${foto.base64}" 
                             style="width: ${larguraFinal}px; height: ${alturaFinal}px; border-radius: 2px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<div style="display: flex; align-items: center; justify-content: center; height: 250px;"><p style="color: #9CA3AF; font-style: italic; font-size: 11px; text-align: center; background: #F9FAFB; border-radius: 3px; border: 1px solid #E5E7EB; padding: 15px;">Sem fotos</p></div>'
              }
            </div>
          </div>
        </div>
        
        ${
          apontamento.observacao
            ? `
        <div style="background: #374151; color: #FFFFFF; padding: 10px 14px; border-top: 1px solid #E5E7EB;">
          <h4 style="color: #FFFFFF; margin: 0 0 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">OBSERVAÇÃO</h4>
          <p style="margin: 0; color: #FFFFFF; font-size: 11px; line-height: 1.4; font-weight: 400; font-style: italic;">${apontamento.observacao}</p>
        </div>
        `
            : ''
        }
      </div>
    `;
    } catch {
      // Adicionar um apontamento de erro no template
      template += `
        <div style="margin-bottom: 15px; page-break-inside: avoid; border: 1px solid #dc3545; border-radius: 6px; overflow: hidden; background: #f8d7da;">
          <div style="background: #dc3545; color: white; padding: 8px 12px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold;">
              ${index + 1}. ERRO NO APONTAMENTO
            </h3>
          </div>
          <div style="padding: 8px 12px; background: #f8d7da; color: #721c24;">
            <p style="margin: 0; font-size: 12px;">Erro ao processar este apontamento. Verifique os dados e tente novamente.</p>
          </div>
        </div>
      `;
    }
  }

  template += `
    </div>
  `;

  return template;
};
