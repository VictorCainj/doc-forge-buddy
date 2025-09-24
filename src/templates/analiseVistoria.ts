export const ANALISE_VISTORIA_TEMPLATE = async (dados: {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  apontamentos: Array<{
    ambiente: string;
    subtitulo: string;
    descricao: string;
    vistoriaInicial: { fotos: File[]; descritivoLaudo?: string };
    vistoriaFinal: { fotos: File[] };
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
  const processarFotos = async (fotos: File[]) => {
    if (!fotos || fotos.length === 0) {
      return [];
    }

    const fotosBase64 = await Promise.all(
      fotos.map(async (foto) => {
        try {
          // Verificar se o arquivo é válido
          if (!foto || !(foto instanceof File) || foto.size === 0) {
            return null;
          }

          const base64 = await fileToBase64(foto);
          return { nome: foto.name, base64 };
        } catch {
          // Erro ao processar foto - retornar null para ignorar
          return null;
        }
      })
    );

    // Filtrar fotos que falharam no processamento
    return fotosBase64.filter((foto) => foto !== null);
  };

  let template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.3; max-width: 900px; margin: 0 auto; padding: 15px; color: #2c3e50; background: #fff;">
      <!-- Cabeçalho Compacto -->
      <div style="text-align: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #333;">
        <h1 style="color: #333; font-size: 18px; margin: 0; font-weight: bold; text-transform: uppercase;">
          ANÁLISE COMPARATIVA DE VISTORIA
        </h1>
        <p style="color: #666; font-size: 11px; margin: 3px 0 0 0;">
          Relatório de Contestação de Vistoria de Saída
        </p>
      </div>

      <!-- Informações do Contrato Compactas -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #333;">
        <div>
          <span style="color: #333; font-size: 13px; font-weight: bold;">Contrato:</span>
          <span style="color: #333; font-size: 13px; margin-left: 6px;">${dados.locatario}</span>
        </div>
        <div style="text-align: right;">
          <span style="color: #666; font-size: 11px;">${dados.endereco}</span>
        </div>
      </div>
  `;

  // Processar todos os apontamentos
  for (let index = 0; index < dados.apontamentos.length; index++) {
    const apontamento = dados.apontamentos[index];

    try {
      // Processar fotos da vistoria inicial
      const fotosInicial = await processarFotos(
        apontamento.vistoriaInicial?.fotos || []
      );

      // Processar fotos da vistoria final
      const fotosFinal = await processarFotos(
        apontamento.vistoriaFinal?.fotos || []
      );

      template += `
      <div style="margin-bottom: 15px; page-break-inside: avoid; border: 1px solid #bdc3c7; border-radius: 6px; overflow: hidden;">
        <!-- Header do Apontamento -->
        <div style="background: #333; color: white; padding: 8px 12px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: bold;">
            ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
          </h3>
        </div>
        
        <!-- Descrição Compacta -->
        <div style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
          <p style="margin: 0; color: #333; font-size: 12px; line-height: 1.3;"><strong>Laudo de Entrada:</strong> ${apontamento.descricao}</p>
        </div>
        
        <!-- Vistorias Lado a Lado -->
        <div style="display: grid; grid-template-columns: 1fr 1fr;">
          <div style="border-right: 1px solid #e9ecef; padding: 12px; background: #f8f9fa;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #333; font-weight: bold; text-align: center; background: #e9e9e9; padding: 4px; border-radius: 3px;">VISTORIA INICIAL</h4>
            <div style="display: grid; grid-template-columns: ${fotosInicial.length > 2 ? '1fr 1fr' : '1fr'}; gap: 8px;">
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
                      <div style="text-align: center;">
                        <img src="${foto.base64}" 
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border: 1px solid #bdc3c7; border-radius: 4px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<p style="color: #95a5a6; font-style: italic; font-size: 12px; text-align: center; padding: 15px;">Sem fotos</p>'
              }
              ${
                apontamento.vistoriaInicial.descritivoLaudo
                  ? `
              <div style="margin-top: 8px; padding: 8px; background: #f0f0f0; border-radius: 4px; border-left: 3px solid #333;">
                <p style="margin: 0; font-size: 11px; color: #333; font-weight: bold;">Descritivo do Laudo de Entrada:</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #555; line-height: 1.3;">${apontamento.vistoriaInicial.descritivoLaudo}</p>
              </div>
              `
                  : ''
              }
            </div>
          </div>
          <div style="padding: 12px; background: #f8f9fa;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #333; font-weight: bold; text-align: center; background: #e9e9e9; padding: 4px; border-radius: 3px;">VISTORIA FINAL</h4>
            <div style="display: grid; grid-template-columns: ${fotosFinal.length > 2 ? '1fr 1fr' : '1fr'}; gap: 8px;">
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
                      <div style="text-align: center;">
                        <img src="${foto.base64}" 
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border: 1px solid #bdc3c7; border-radius: 4px; object-fit: contain;" 
                             alt="Foto ${fotoIndex + 1}" />
                      </div>
                    `;
                      })
                      .join('')
                  : '<p style="color: #95a5a6; font-style: italic; font-size: 12px; text-align: center; padding: 15px;">Sem fotos</p>'
              }
            </div>
          </div>
        </div>
        
        ${
          apontamento.observacao
            ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 12px; margin-top: 8px;">
          <h4 style="color: #dc2626; margin: 0 0 6px 0; font-size: 12px; font-weight: 600;">OBSERVAÇÃO</h4>
          <p style="margin: 0; color: #991b1b; font-size: 11px; line-height: 1.4;">${apontamento.observacao}</p>
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
