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

  // Função para processar fotos e converter para base64
  const processarFotos = async (
    fotos: Array<{
      name?: string;
      size?: number;
      type?: string;
      url?: string;
      isFromDatabase?: boolean;
    }>
  ) => {
    // console.log('=== PROCESSAR FOTOS ===');
    // console.log('Fotos recebidas:', fotos);
    // console.log('Quantidade:', fotos?.length || 0);

    if (!fotos || fotos.length === 0) {
      // Nenhuma foto para processar
      return [];
    }

    const fotosBase64 = await Promise.all(
      fotos.map(async (foto, _index) => {
        // console.log(`\n--- Processando foto ${index + 1} ---`);
        // console.log('Foto:', foto);
        // console.log('- isFromDatabase:', foto?.isFromDatabase);
        // console.log('- URL:', foto?.url);
        // console.log('- É File?:', foto instanceof File);

        try {
          // Se é uma imagem do banco de dados, usar a URL diretamente
          if (foto.isFromDatabase && foto.url) {
            // console.log('✅ Usando URL do banco:', foto.url);
            return { nome: foto.name, base64: foto.url };
          }

          // Verificar se o arquivo é válido
          if (!foto || !(foto instanceof File) || foto.size === 0) {
            // console.log('❌ Foto inválida');
            return null;
          }

          const base64 = await fileToBase64(foto);
          // console.log('✅ Foto File convertida para base64');
          return { nome: foto.name, base64 };
        } catch {
          // console.error('❌ Erro ao processar foto:', error);
          return null;
        }
      })
    );

    // console.log('Fotos processadas:', fotosBase64);
    // Filtrar fotos que falharam no processamento
    const fotosValidas = fotosBase64.filter((foto) => foto !== null);
    // console.log('✅ Fotos válidas finais:', fotosValidas.length);
    return fotosValidas;
  };

  let template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4; max-width: 900px; margin: 0 auto; padding: 20px; color: #2c3e50; background: #fff;">
      <!-- Cabeçalho Minimalista -->
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #E5E7EB;">
        <h1 style="color: #000000; font-size: 24px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ANÁLISE COMPARATIVA DE VISTORIA
        </h1>
        <p style="color: #6B7280; font-size: 14px; margin: 12px 0 0 0; font-weight: 400;">
          Relatório de Contestação de Vistoria de Saída
        </p>
      </div>

      <!-- Informações do Contrato - Design Limpo -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding: 20px 24px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
        <div>
          <span style="color: #374151; font-size: 16px; font-weight: 600;">Contrato:</span>
          <span style="color: #000000; font-size: 16px; margin-left: 12px; font-weight: 700;">${dados.locatario}</span>
        </div>
        <div style="text-align: right;">
          <span style="color: #6B7280; font-size: 14px; font-weight: 400;">${dados.endereco}</span>
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

      // console.log(`\n--- RESULTADO APONTAMENTO ${index + 1} ---`);
      // console.log('✅ Fotos Inicial processadas:', fotosInicial.length);
      // console.log('✅ Fotos Final processadas:', fotosFinal.length);

      template += `
      <div style="margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header do Apontamento - Design Minimalista -->
        <div style="background: #374151; color: #FFFFFF; padding: 16px 20px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #FFFFFF; text-transform: uppercase;">
            ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
          </h3>
        </div>
        
        <!-- Descrição do Laudo de Entrada -->
        <div style="padding: 16px 20px; background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
          <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.6; font-weight: 500;">
            <strong>Descritivo do Laudo de Entrada:</strong> ${apontamento.descricao}
          </p>
        </div>
        
        <!-- Vistorias Lado a Lado -->
        <div style="display: grid; grid-template-columns: 1fr 1fr;">
          <!-- Vistoria Inicial -->
          <div style="border-right: 1px solid #E5E7EB; padding: 20px; background: #FFFFFF;">
            <h4 style="margin: 0 0 20px 0; font-size: 14px; color: #000000; font-weight: bold; text-align: center; background: #F3F4F6; padding: 12px; border-radius: 6px; border: 1px solid #E5E7EB; text-transform: uppercase;">VISTORIA INICIAL</h4>
            <div style="display: grid; grid-template-columns: ${fotosInicial.length > 2 ? '1fr 1fr' : '1fr'}; gap: 12px;">
              ${
                fotosInicial.length > 0
                  ? fotosInicial
                      .map((foto, fotoIndex) => {
                        const alturaMaxima =
                          fotosInicial.length === 1
                            ? '300px'
                            : fotosInicial.length === 2
                              ? '200px'
                              : fotosInicial.length <= 4
                                ? '150px'
                                : '120px';
                        return `
                      <div style="text-align: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                        <img src="${foto.base64}" 
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border-radius: 4px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<p style="color: #9CA3AF; font-style: italic; font-size: 13px; text-align: center; padding: 20px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">Sem fotos</p>'
              }
              ${
                apontamento.vistoriaInicial.descritivoLaudo
                  ? `
              <div style="margin-top: 16px; padding: 12px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                <p style="margin: 0; font-size: 13px; color: #374151; font-weight: 600;">Descritivo do Laudo de Entrada:</p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.5; font-weight: 400;">${apontamento.vistoriaInicial.descritivoLaudo}</p>
              </div>
              `
                  : ''
              }
            </div>
          </div>
          
          <!-- Vistoria Final -->
          <div style="padding: 20px; background: #FFFFFF;">
            <h4 style="margin: 0 0 20px 0; font-size: 14px; color: #000000; font-weight: bold; text-align: center; background: #F3F4F6; padding: 12px; border-radius: 6px; border: 1px solid #E5E7EB; text-transform: uppercase;">VISTORIA FINAL</h4>
            <div style="display: grid; grid-template-columns: ${fotosFinal.length > 2 ? '1fr 1fr' : '1fr'}; gap: 12px;">
              ${
                fotosFinal.length > 0
                  ? fotosFinal
                      .map((foto, fotoIndex) => {
                        const alturaMaxima =
                          fotosFinal.length === 1
                            ? '300px'
                            : fotosFinal.length === 2
                              ? '200px'
                              : fotosFinal.length <= 4
                                ? '150px'
                                : '120px';
                        return `
                      <div style="text-align: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                        <img src="${foto.base64}" 
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border-radius: 4px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<p style="color: #9CA3AF; font-style: italic; font-size: 13px; text-align: center; padding: 20px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">Sem fotos</p>'
              }
            </div>
          </div>
        </div>
        
        ${
          apontamento.observacao
            ? `
        <div style="background: #374151; color: #FFFFFF; padding: 16px 20px; border-top: 1px solid #E5E7EB;">
          <h4 style="color: #FFFFFF; margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">OBSERVAÇÃO</h4>
          <p style="margin: 0; color: #FFFFFF; font-size: 13px; line-height: 1.6; font-weight: 400; font-style: italic;">${apontamento.observacao}</p>
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
