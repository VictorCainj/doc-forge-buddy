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
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #D9D9D9;">
        <h1 style="color: #000000; font-size: 22px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px;">
          ANÁLISE COMPARATIVA DE VISTORIA
        </h1>
        <p style="color: #000000; font-size: 13px; margin: 8px 0 0 0; font-weight: 400;">
          Relatório de Contestação de Vistoria de Saída
        </p>
      </div>

      <!-- Informações do Contrato Compactas -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px 20px; background: #F9FAFB; border-radius: 6px; border: 1px solid #D9D9D9; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <div>
          <span style="color: #000000; font-size: 15px; font-weight: bold;">Contrato:</span>
          <span style="color: #000000; font-size: 15px; margin-left: 10px; font-weight: 600;">${dados.locatario}</span>
        </div>
        <div style="text-align: right;">
          <span style="color: #000000; font-size: 13px; font-weight: 400;">${dados.endereco}</span>
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
      <div style="margin-bottom: 24px; page-break-inside: avoid; border: 1px solid #D9D9D9; border-radius: 6px; overflow: hidden; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);">
        <!-- Header do Apontamento -->
        <div style="background: #F9FAFB; color: #000000; padding: 14px 18px; border-bottom: 1px solid #D9D9D9;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">
            ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
          </h3>
        </div>
        
        <!-- Descrição Compacta -->
        <div style="padding: 14px 18px; background: #FFFFFF; border-bottom: 1px solid #D9D9D9;">
          <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.5; font-weight: 500;"><strong>Laudo de Entrada:</strong> ${apontamento.descricao}</p>
        </div>
        
        <!-- Vistorias Lado a Lado -->
        <div style="display: grid; grid-template-columns: 1fr 1fr;">
          <div style="border-right: 1px solid #D9D9D9; padding: 18px; background: #FFFFFF;">
            <h4 style="margin: 0 0 16px 0; font-size: 14px; color: #000000; font-weight: bold; text-align: center; background: #F9FAFB; padding: 10px; border-radius: 6px; border: 1px solid #D9D9D9;">VISTORIA INICIAL</h4>
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
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border: 1px solid #d1d5db; border-radius: 8px; object-fit: contain;" 
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
              <div style="margin-top: 16px; padding: 12px; background: #F9FAFB; border-radius: 6px; border: 1px solid #D9D9D9;">
                <p style="margin: 0; font-size: 13px; color: #000000; font-weight: bold;">Descritivo do Laudo de Entrada:</p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #000000; line-height: 1.5; font-weight: 400;">${apontamento.vistoriaInicial.descritivoLaudo}</p>
              </div>
              `
                  : ''
              }
            </div>
          </div>
          <div style="padding: 18px; background: #FFFFFF;">
            <h4 style="margin: 0 0 16px 0; font-size: 14px; color: #000000; font-weight: bold; text-align: center; background: #F9FAFB; padding: 10px; border-radius: 6px; border: 1px solid #D9D9D9;">VISTORIA FINAL</h4>
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
                             style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border: 1px solid #d1d5db; border-radius: 8px; object-fit: contain;" 
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
        <div style="background: #F9FAFB; border: 1px solid #D9D9D9; border-radius: 6px; padding: 16px 20px; margin-top: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
          <h4 style="color: #000000; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">OBSERVAÇÃO</h4>
          <p style="margin: 0; color: #000000; font-size: 13px; line-height: 1.5; font-weight: 500; font-style: italic;">${apontamento.observacao}</p>
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
