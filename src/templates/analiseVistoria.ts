import { fileToBase64HD, urlToBase64HD } from '@/utils/imageHD';
import { log } from '@/utils/logger';

export const ANALISE_VISTORIA_TEMPLATE = async (dados: {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  documentMode?: 'analise' | 'orcamento';
  prestador?: {
    nome: string;
    cnpj?: string;
    telefone?: string;
    email?: string;
  };
  apontamentos: Array<{
    id?: string;
    ambiente: string;
    subtitulo: string;
    descricao: string;
    descricaoServico?: string;
    vistoriaInicial: {
      fotos: Array<
        | File
        | {
            name: string;
            url: string;
            isFromDatabase: boolean;
            isExternal?: boolean;
          }
      >;
      descritivoLaudo?: string;
    };
    vistoriaFinal: {
      fotos: Array<
        | File
        | {
            name: string;
            url: string;
            isFromDatabase: boolean;
            isExternal?: boolean;
          }
      >;
    };
    observacao: string;
    // Campo de classificação manual
    classificacao?: 'responsabilidade' | 'revisao';
    // Campos de orçamento
    tipo?: 'material' | 'mao_de_obra' | 'ambos';
    valor?: number;
    quantidade?: number;
  }>;
}) => {
  // Função para processar fotos e converter para base64 HD
  const processarFotos = async (
    fotos: Array<{
      name?: string;
      size?: number;
      type?: string;
      url?: string;
      isFromDatabase?: boolean;
      isExternal?: boolean;
    }>,
    tipoVistoria: string = 'desconhecido'
  ) => {
    if (!fotos || fotos.length === 0) {
      log.debug(`${tipoVistoria}: Nenhuma foto para processar`);
      return [];
    }

    log.debug(`${tipoVistoria}: Processando ${fotos.length} foto(s)`);

    const fotosBase64 = await Promise.all(
      fotos.map(async (foto, index) => {
        try {
          log.debug(`${tipoVistoria}: Foto ${index + 1}`, {
            isFromDatabase: foto.isFromDatabase,
            isExternal: foto.isExternal,
            hasUrl: !!foto.url,
            isFile: foto instanceof File,
            name: foto.name,
            url: foto.url,
          });

          // Se é uma imagem do banco de dados
          if (foto.isFromDatabase && foto.url) {
            log.debug(`${tipoVistoria}: Processando imagem do banco`, {
              url: foto.url,
            });
            try {
              // Tentar converter URL para base64 HD
              const base64HD = await urlToBase64HD(foto.url, {
                maxWidth: 2560,
                maxHeight: 1440,
                quality: 0.95,
                format: 'jpeg',
              });
              log.debug(
                `${tipoVistoria}: Imagem do banco convertida com sucesso`
              );
              return { nome: foto.name || 'imagem', base64: base64HD };
            } catch {
              // Se falhar, usar URL diretamente
              return { nome: foto.name || 'imagem', base64: foto.url };
            }
          }

          // Se é uma imagem externa
          if (foto.isExternal && foto.url) {
            log.debug(`${tipoVistoria}: Processando imagem externa`, {
              url: foto.url,
            });

            // Detectar URLs do Devolus Vistoria
            const isDevolusUrl = foto.url.includes('devolusvistoria.com.br');

            if (isDevolusUrl) {
              // Para URLs do Devolus, usar URL diretamente (evita CORS)
              // O template irá renderizar com headers específicos

              return {
                nome: foto.name || 'imagem_devolus',
                base64: foto.url,
                isExternal: true,
                isDevolusUrl: true, // Flag especial para URLs do Devolus
              };
            } else {
              // Para outras URLs externas, usar diretamente sem conversão
              log.debug(
                `${tipoVistoria}: Usando URL externa diretamente (evita CORS)`
              );

              // Validar se a URL é válida
              try {
                new URL(foto.url);
                log.debug(`${tipoVistoria}: URL externa válida`, {
                  url: foto.url,
                });
              } catch {
                // URL inválida, continuar
              }

              return {
                nome: foto.name || 'imagem_externa',
                base64: foto.url,
                isExternal: true,
              };
            }
          }

          // Verificar se o arquivo é válido
          if (!foto || !(foto instanceof File) || foto.size === 0) {
            return null;
          }

          // Converter File para base64 HD
          log.debug(`${tipoVistoria}: Processando File`, { name: foto.name });
          const base64HD = await fileToBase64HD(foto, {
            maxWidth: 2560,
            maxHeight: 1440,
            quality: 0.95,
            format: 'jpeg',
          });
          log.debug(`${tipoVistoria}: File convertido com sucesso`);
          return { nome: foto.name, base64: base64HD };
        } catch {
          return null;
        }
      })
    );

    // Filtrar fotos que falharam no processamento
    const fotosValidas = fotosBase64.filter((foto) => foto !== null);
    log.debug(`${tipoVistoria}: Resultado`, {
      fotosValidas: fotosValidas.length,
      totalFotos: fotos.length,
    });
    return fotosValidas;
  };

  let template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4; max-width: 900px; margin: 0 auto; padding: 20px; color: #2c3e50; background: #fff;">
      <!-- Cabeçalho Minimalista -->
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #E5E7EB;">
        <h1 style="color: #000000; font-size: 24px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ${dados.documentMode === 'orcamento' ? 'ORÇAMENTO DE REPAROS' : 'ANÁLISE COMPARATIVA DE VISTORIA'}
        </h1>
        <p style="color: #6B7280; font-size: 14px; margin: 12px 0 0 0; font-weight: 400;">
          ${dados.documentMode === 'orcamento' ? 'Orçamento Detalhado para Reparos' : 'Relatório de Contestação de Vistoria de Saída'}
        </p>
      </div>
      
      ${
        dados.documentMode === 'orcamento' &&
        dados.prestador &&
        dados.prestador.nome
          ? `
      <!-- Informações do Prestador -->
      <div style="margin-bottom: 32px; padding: 20px 24px; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #374151; text-transform: uppercase; border-bottom: 2px solid #374151; padding-bottom: 8px;">Dados do Prestador</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 14px;">
          <div>
            <span style="color: #6B7280; font-weight: 600;">Nome/Razão Social:</span>
            <span style="color: #000000; margin-left: 8px;">${dados.prestador.nome}</span>
          </div>
          ${
            dados.prestador.cnpj
              ? `
          <div>
            <span style="color: #6B7280; font-weight: 600;">CNPJ/CPF:</span>
            <span style="color: #000000; margin-left: 8px;">${dados.prestador.cnpj}</span>
          </div>
          `
              : ''
          }
          ${
            dados.prestador.telefone
              ? `
          <div>
            <span style="color: #6B7280; font-weight: 600;">Telefone:</span>
            <span style="color: #000000; margin-left: 8px;">${dados.prestador.telefone}</span>
          </div>
          `
              : ''
          }
          ${
            dados.prestador.email
              ? `
          <div>
            <span style="color: #6B7280; font-weight: 600;">E-mail:</span>
            <span style="color: #000000; margin-left: 8px;">${dados.prestador.email}</span>
          </div>
          `
              : ''
          }
        </div>
      </div>
      `
          : ''
      }

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

  // Classificar apontamentos por tipo - APENAS MANUAL (apenas para modo análise)
  log.debug('Classificando apontamentos', {
    documentMode: dados.documentMode,
    totalApontamentos: dados.apontamentos.length,
  });

  if (dados.documentMode !== 'orcamento') {
    const responsabilidadesLocatario: Array<
      (typeof dados.apontamentos)[0] & { index: number }
    > = [];
    const passiveisRevisao: Array<
      (typeof dados.apontamentos)[0] & { index: number }
    > = [];

    dados.apontamentos.forEach((apontamento, index) => {
      log.debug(`Apontamento ${index + 1}`, {
        ambiente: apontamento.ambiente,
        classificacao: apontamento.classificacao,
      });

      // Classificação TOTALMENTE MANUAL - só adiciona se usuário escolheu
      if (apontamento.classificacao === 'responsabilidade') {
        responsabilidadesLocatario.push({ ...apontamento, index: index + 1 });
      } else if (apontamento.classificacao === 'revisao') {
        passiveisRevisao.push({ ...apontamento, index: index + 1 });
      }
      // Se for 'automatico' ou não tiver classificacao, não aparece no resumo
    });

    log.debug('Classificação concluída', {
      responsabilidades: responsabilidadesLocatario.length,
      revisoes: passiveisRevisao.length,
    });

    // Adicionar seções de resumo visual apenas se houver apontamentos
    if (responsabilidadesLocatario.length > 0 || passiveisRevisao.length > 0) {
      log.debug('Gerando resumo visual');
    } else {
      log.warn('Nenhum apontamento classificado - resumo não será gerado');
    }

    if (responsabilidadesLocatario.length > 0 || passiveisRevisao.length > 0) {
      // Determinar layout: centralizado se só tiver responsabilidades, grid se tiver ambos
      const gridStyle =
        responsabilidadesLocatario.length > 0 && passiveisRevisao.length > 0
          ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px;'
          : 'display: flex; justify-content: center;';

      template += `
      <!-- Resumo Visual de Classificação -->
      <div style="margin-bottom: 40px;">
        <h2 style="text-align: center; color: #374151; font-size: 20px; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">
          Resumo de Apontamentos
        </h2>
        <div style="${gridStyle}">
      `;

      // Seção Responsabilidades do Locatário (design profissional simplificado)
      if (responsabilidadesLocatario.length > 0) {
        // Se não há revisões, adicionar largura máxima para centralizar melhor
        const cardWidthStyle =
          passiveisRevisao.length === 0 ? 'max-width: 600px; width: 100%;' : '';
        template += `
          <div style="background: #F8F9FA; border: 1px solid #6C757D; border-left: 4px solid #495057; border-radius: 6px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); ${cardWidthStyle}">
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #DEE2E6;">
              <div style="display: inline-block; background: #495057; color: white; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px;">
                Responsabilidades do Locatário
              </div>
            </div>
            <div style="background: white; border-radius: 4px; padding: 16px; border: 1px solid #DEE2E6;">
              <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 13px; line-height: 1.7;">
                ${responsabilidadesLocatario
                  .map(
                    (ap) => `
                  <li style="margin-bottom: 6px;">
                    <strong style="color: #212529;">${ap.index}. ${ap.ambiente}</strong>${ap.subtitulo ? ` - ${ap.subtitulo}` : ''}
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
            <div style="text-align: center; margin-top: 12px;">
              <span style="background: #495057; color: white; padding: 5px 12px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                ${responsabilidadesLocatario.length} ${responsabilidadesLocatario.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>
        `;
      }

      // Seção Passíveis de Revisão (design profissional simplificado)
      if (passiveisRevisao.length > 0) {
        template += `
          <div style="background: #FFF9E6; border: 1px solid #B8860B; border-left: 4px solid #8B6914; border-radius: 6px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #E6D5A0;">
              <div style="display: inline-block; background: #8B6914; color: white; padding: 6px 14px; border-radius: 4px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px;">
                Passíveis de Revisão
              </div>
            </div>
            <div style="background: white; border-radius: 4px; padding: 16px; border: 1px solid #E6D5A0;">
              <ul style="margin: 0; padding-left: 20px; color: #6B5416; font-size: 13px; line-height: 1.7;">
                ${passiveisRevisao
                  .map(
                    (ap) => `
                  <li style="margin-bottom: 6px;">
                    <strong style="color: #4A3A0F;">${ap.index}. ${ap.ambiente}</strong>${ap.subtitulo ? ` - ${ap.subtitulo}` : ''}
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
            <div style="text-align: center; margin-top: 12px;">
              <span style="background: #8B6914; color: white; padding: 5px 12px; border-radius: 4px; font-weight: 600; font-size: 12px;">
                ${passiveisRevisao.length} ${passiveisRevisao.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>
        `;
      }

      template += `
        </div>
      </div>
      `;
    }
  }

  // Processar todos os apontamentos
  for (let index = 0; index < dados.apontamentos.length; index++) {
    const apontamento = dados.apontamentos[index];

    try {
      // console.log(`\n=== PROCESSANDO APONTAMENTO ${index + 1}: ${apontamento.ambiente} ===`);
      // console.log('Fotos Inicial antes do processamento:', apontamento.vistoriaInicial?.fotos);
      // console.log('Fotos Final antes do processamento:', apontamento.vistoriaFinal?.fotos);

      // Processar fotos da vistoria inicial
      const fotosInicial = await processarFotos(
        apontamento.vistoriaInicial?.fotos || [],
        `Apontamento ${index + 1} - ${apontamento.ambiente} - Inicial`
      );

      // Processar fotos da vistoria final
      const fotosFinal = await processarFotos(
        apontamento.vistoriaFinal?.fotos || [],
        `Apontamento ${index + 1} - ${apontamento.ambiente} - Final`
      );

      // console.log(`\n--- RESULTADO APONTAMENTO ${index + 1} ---`);
      // console.log('✅ Fotos Inicial processadas:', fotosInicial.length);
      // console.log('✅ Fotos Final processadas:', fotosFinal.length);

      // Modo Orçamento: Exibir apenas informações essenciais (sem imagens)
      if (dados.documentMode === 'orcamento') {
        template += `
        <div style="margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header do Apontamento -->
          <div style="background: #374151; color: #FFFFFF; padding: 16px 20px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #FFFFFF; text-transform: uppercase;">
              ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
            </h3>
          </div>
          
          <!-- Descrição do Serviço -->
          <div style="padding: 20px; background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #6B7280; text-transform: uppercase;">Descrição do Serviço</h4>
            <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.6;">
              ${apontamento.descricaoServico || apontamento.descricao}
            </p>
          </div>
          
          ${
            apontamento.tipo &&
            apontamento.valor !== undefined &&
            apontamento.quantidade !== undefined
              ? `
          <!-- Valor do Orçamento (compacto) -->
          <div style="background: #F9FAFB; padding: 12px 20px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 24px; align-items: center; flex: 1;">
              <span style="color: #6B7280; font-size: 13px;">
                <strong style="color: #374151;">${apontamento.tipo === 'material' ? 'Material' : apontamento.tipo === 'mao_de_obra' ? 'Mão de Obra' : 'Material + Mão de Obra'}</strong>
              </span>
              <span style="color: #6B7280; font-size: 13px;">Qtd: <strong style="color: #000000;">${apontamento.quantidade}</strong></span>
              <span style="color: #6B7280; font-size: 13px;">Valor Unit.: <strong style="color: #000000; font-family: 'Courier New', monospace;">${apontamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
            </div>
            <div style="text-align: right;">
              <span style="color: #6B7280; font-size: 12px; display: block; margin-bottom: 2px;">Subtotal</span>
              <strong style="color: #374151; font-size: 16px; font-family: 'Courier New', monospace;">
                ${(apontamento.valor * apontamento.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>
          `
              : ''
          }
        </div>
      `;
      } else {
        // Modo Análise: Exibir comparação de imagens
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
              <strong>Apontamento realizado pelo vistoriador:</strong> ${apontamento.descricao}
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
                          ${
                            foto.isDevolusUrl
                              ? `
                          <img src="${foto.base64}" 
                               style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border-radius: 4px; object-fit: contain;" 
                               alt="Foto ${fotoIndex + 1}"
                               crossorigin="anonymous"
                               referrerpolicy="no-referrer" />
                          <p style="font-size: 10px; color: #6B7280; margin: 4px 0 0 0; font-style: italic;">Imagem Externa (Devolus)</p>
                          `
                              : `
                          <img src="${foto.base64}" 
                               style="max-width: 100%; max-height: ${alturaMaxima}; width: auto; height: auto; border-radius: 4px; object-fit: contain;" 
                               alt="Foto ${fotoIndex + 1}" />
                          `
                          }
                        </div>
                      `;
                        })
                        .join('')
                    : '<p style="color: #9CA3AF; font-style: italic; font-size: 13px; text-align: center; padding: 20px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">Sem fotos</p>'
                }
              </div>
            </div>
          </div>
          
          <!-- Seção de Considerações -->
          <div style="background: #374151; color: #FFFFFF; padding: 16px 20px; border-top: 1px solid #E5E7EB;">
            <div style="margin-bottom: 12px;">
              <h4 style="color: #FFFFFF; margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">CONSIDERAÇÕES DO DEPARTAMENTO DE RESCISÃO</h4>
            </div>
            ${
              apontamento.observacao
                ? `<p style="margin: 0; color: #FFFFFF; font-size: 13px; line-height: 1.6; font-weight: 400; font-style: italic;">${apontamento.observacao}</p>`
                : `<p style="margin: 0; color: #E5E7EB; font-size: 13px; line-height: 1.6; font-weight: 400; font-style: italic; opacity: 0.7;">Nenhuma consideração registrada.</p>`
            }
          </div>
        </div>
      `;
      }
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

  // Adicionar resumo do orçamento no final (se modo orçamento)
  if (dados.documentMode === 'orcamento') {
    const itensComValor = dados.apontamentos.filter(
      (ap) =>
        ap.valor !== undefined &&
        ap.quantidade !== undefined &&
        ap.valor > 0 &&
        ap.quantidade > 0
    );

    if (itensComValor.length > 0) {
      const totalGeral = itensComValor.reduce(
        (total, ap) => total + (ap.valor || 0) * (ap.quantidade || 0),
        0
      );

      const totalMaterial = itensComValor
        .filter((ap) => ap.tipo === 'material' || ap.tipo === 'ambos')
        .reduce(
          (total, ap) => total + (ap.valor || 0) * (ap.quantidade || 0),
          0
        );

      const totalMaoDeObra = itensComValor
        .filter((ap) => ap.tipo === 'mao_de_obra' || ap.tipo === 'ambos')
        .reduce(
          (total, ap) => total + (ap.valor || 0) * (ap.quantidade || 0),
          0
        );

      template += `
        <!-- Resumo Total do Orçamento -->
        <div style="margin-top: 40px; margin-bottom: 32px; page-break-inside: avoid; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Cabeçalho do Resumo -->
          <div style="background: #374151; color: #FFFFFF; padding: 16px 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">
              Resumo do Orçamento
            </h2>
          </div>
          
          <!-- Totais Parciais -->
          ${
            totalMaterial > 0 || totalMaoDeObra > 0
              ? `
          <div style="background: #FFFFFF; padding: 20px; border-bottom: 1px solid #E5E7EB;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              ${
                totalMaterial > 0
                  ? `
              <div style="text-align: center; padding: 16px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                <div style="font-size: 12px; color: #6B7280; margin-bottom: 6px; text-transform: uppercase;">Total Material</div>
                <div style="font-size: 18px; font-weight: 700; color: #374151; font-family: 'Courier New', monospace;">
                  ${totalMaterial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              `
                  : ''
              }
              ${
                totalMaoDeObra > 0
                  ? `
              <div style="text-align: center; padding: 16px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
                <div style="font-size: 12px; color: #6B7280; margin-bottom: 6px; text-transform: uppercase;">Total Mão de Obra</div>
                <div style="font-size: 18px; font-weight: 700; color: #374151; font-family: 'Courier New', monospace;">
                  ${totalMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              `
                  : ''
              }
            </div>
          </div>
          `
              : ''
          }
          
          <!-- Total Geral -->
          <div style="background: #374151; color: #FFFFFF; padding: 24px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 18px; font-weight: 700; text-transform: uppercase;">Valor Total do Orçamento</div>
              <div style="font-size: 28px; font-weight: bold; font-family: 'Courier New', monospace;">
                ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
          
          <!-- Observações Finais -->
          <div style="background: #F9FAFB; padding: 16px 20px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 1.6;">
              <strong>Validade:</strong> Este orçamento tem validade de 30 dias a partir da data de emissão. 
              Os valores estão sujeitos a alteração sem aviso prévio. Não inclui custos adicionais não especificados.
            </p>
          </div>
        </div>
      `;
    }
  }

  template += `
      <!-- Nota sobre Fotos Completas -->
      <div style="margin-top: 32px; padding: 12px 20px; background: #F9FAFB; border-radius: 6px; border-left: 3px solid #6B7280; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #6B7280; font-style: italic;">
          As fotos completas em alta resolução estão disponíveis nos laudos de vistoria de entrada e saída.
        </p>
      </div>
    </div>

  `;

  return template;
};
