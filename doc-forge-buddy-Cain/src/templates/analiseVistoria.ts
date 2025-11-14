import { fileToBase64HD, urlToBase64HD } from '@/utils/imageHD';
import { log } from '@/utils/logger';
import { deduplicateImagesBySerial } from '@/utils/imageSerialGenerator';

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
      image_serial?: string;
    }>,
    tipoVistoria: string = 'desconhecido'
  ) => {
    if (!fotos || fotos.length === 0) {
      log.debug(`${tipoVistoria}: Nenhuma foto para processar`);
      return [];
    }

    // ✅ DEDUPLICAÇÃO: Remover fotos duplicadas por serial ou URL
    const fotosUnicas = deduplicateImagesBySerial(fotos);

    // Filtro adicional por URL para capturar duplicatas que não têm serial
    const fotosFiltradas = fotosUnicas.filter((foto, index, self) => {
      if (!foto.url) return true;
      return self.findIndex((f) => f.url === foto.url) === index;
    });

    if (fotosFiltradas.length < fotos.length) {
      log.warn(`${tipoVistoria}: Duplicatas removidas`, {
        original: fotos.length,
        unicas: fotosFiltradas.length,
        removidas: fotos.length - fotosFiltradas.length,
      });
    }

    log.debug(
      `${tipoVistoria}: Processando ${fotosFiltradas.length} foto(s) únicas`
    );

    const fotosBase64 = await Promise.all(
      fotosFiltradas.map(async (foto, index) => {
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
          <span style="color: #374151; font-size: 16px; font-weight: 600;">Contrato: N ° ${dados.locatario}</span>
          <span style="color: #000000; font-size: 16px; margin-left: 12px; font-weight: 400;">- Endereço ${dados.endereco}</span>
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

    // NOTA: O resumo de apontamentos foi removido do documento gerado
    // Ele agora é exibido apenas na interface interna
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
          <div style="background: #E5E7EB; padding: 16px 20px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1F2937; text-transform: uppercase;">
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
          <div style="background: #E5E7EB; padding: 16px 20px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1F2937; text-transform: uppercase;">
              ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
            </h3>
          </div>
          
          <!-- Descrição do Laudo de Entrada -->
          <div style="padding: 16px 20px; background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #000000; font-size: 14px; line-height: 1.6; font-weight: 500;">
              <strong>Apontamento realizado pelo vistoriador:</strong> ${apontamento.descricao}
            </p>
          </div>
          
          <!-- Comparativo de Imagens Lado a Lado -->
          <div style="padding: 20px; background: #FFFFFF;">
            ${(() => {
              const maxFotos = Math.max(fotosInicial.length, fotosFinal.length);
              if (maxFotos === 0) {
                return '<p style="color: #9CA3AF; font-style: italic; font-size: 13px; text-align: center; padding: 20px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">Sem fotos para comparar</p>';
              }
              
              const comparativos = [];
              for (let i = 0; i < maxFotos; i++) {
                const fotoInicial = fotosInicial[i];
                const fotoFinal = fotosFinal[i];
                
                comparativos.push(`
                  <div style="margin-bottom: 24px; page-break-inside: avoid;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                      <!-- Vistoria Inicial -->
                      <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; background: #F9FAFB;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #1F2937; font-weight: bold; text-align: center; background: #E5E7EB; padding: 8px; border-radius: 4px; text-transform: uppercase;">VISTORIA INICIAL</h4>
                        ${fotoInicial 
                          ? `
                        <div style="text-align: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                          <img src="${fotoInicial.base64}" 
                               style="max-width: 100%; width: auto; height: auto; border-radius: 4px; object-fit: contain; display: block; margin: 0 auto;" 
                               alt="Foto Inicial ${i + 1}" />
                        </div>
                        `
                          : '<p style="color: #9CA3AF; font-style: italic; font-size: 12px; text-align: center; padding: 20px;">Sem foto</p>'
                        }
                      </div>
                      
                      <!-- Vistoria Final -->
                      <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; background: #F9FAFB;">
                        <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #1F2937; font-weight: bold; text-align: center; background: #E5E7EB; padding: 8px; border-radius: 4px; text-transform: uppercase;">VISTORIA FINAL</h4>
                        ${fotoFinal 
                          ? `
                        <div style="text-align: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                          ${fotoFinal.isDevolusUrl
                            ? `
                          <img src="${fotoFinal.base64}" 
                               style="max-width: 100%; width: auto; height: auto; border-radius: 4px; object-fit: contain; display: block; margin: 0 auto;" 
                               alt="Foto Final ${i + 1}"
                               crossorigin="anonymous"
                               referrerpolicy="no-referrer" />
                          <p style="font-size: 10px; color: #6B7280; margin: 4px 0 0 0; font-style: italic;">Imagem Externa (Devolus)</p>
                          `
                            : `
                          <img src="${fotoFinal.base64}" 
                               style="max-width: 100%; width: auto; height: auto; border-radius: 4px; object-fit: contain; display: block; margin: 0 auto;" 
                               alt="Foto Final ${i + 1}" />
                          `
                          }
                        </div>
                        `
                          : '<p style="color: #9CA3AF; font-style: italic; font-size: 12px; text-align: center; padding: 20px;">Sem foto</p>'
                        }
                      </div>
                    </div>
                  </div>
                `);
              }
              
              return comparativos.join('');
            })()}
            
            ${apontamento.vistoriaInicial.descritivoLaudo
              ? `
            <div style="margin-top: 16px; padding: 12px; background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 13px; color: #374151; font-weight: 600;">Descritivo do Laudo de Entrada:</p>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.5; font-weight: 400;">${apontamento.vistoriaInicial.descritivoLaudo}</p>
            </div>
            `
              : ''
            }
          </div>
          
          <!-- Seção de Considerações -->
          <div style="background: #F9FAFB; padding: 16px 20px; border-top: 1px solid #E5E7EB;">
            <div style="margin-bottom: 12px;">
              <h4 style="color: #374151; margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">CONSIDERAÇÕES DO DEPARTAMENTO DE RESCISÃO</h4>
            </div>
            ${
              apontamento.observacao
                ? `<p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.6; font-weight: 400;">${apontamento.observacao}</p>`
                : `<p style="margin: 0; color: #6B7280; font-size: 13px; line-height: 1.6; font-weight: 400; font-style: italic;">Nenhuma consideração registrada.</p>`
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
          <div style="background: #E5E7EB; padding: 16px 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #1F2937; text-transform: uppercase;">
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
          <div style="background: #E5E7EB; padding: 24px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 18px; font-weight: 700; color: #1F2937; text-transform: uppercase;">Valor Total do Orçamento</div>
              <div style="font-size: 28px; font-weight: bold; color: #1F2937; font-family: 'Courier New', monospace;">
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
          As imagens completas estão disponíveis no laudo de entrada e saída enviados.
        </p>
      </div>
    </div>

  `;

  return template;
};
