/**
 * Utilitário para gerar HTML compatível com clientes de e-mail
 * Segue melhores práticas: CSS inline, sem CSS externo, imagens em base64
 */

import { fileToBase64HD, urlToBase64HD } from '@/utils/imageHD';
import { log } from '@/utils/logger';

interface EmailImage {
  url?: string;
  isFromDatabase?: boolean;
  isExternal?: boolean;
  name?: string;
}

/**
 * Converte uma imagem para base64 para uso em e-mail
 */
async function convertImageToBase64ForEmail(
  image: File | EmailImage
): Promise<string | null> {
  try {
    if (image instanceof File) {
      // Se é um File, converter para base64
      return await fileToBase64HD(image, { maxWidth: 800, quality: 0.8 });
    } else if (image.url) {
      // Se já é base64, retornar diretamente
      if (image.url.startsWith('data:image/')) {
        return image.url;
      }
      // Se é URL, converter para base64
      return await urlToBase64HD(image.url, { maxWidth: 800, quality: 0.8 });
    }
    return null;
  } catch (error) {
    log.error('Erro ao converter imagem para base64:', error);
    return null;
  }
}

/**
 * Converte HTML com CSS externo para HTML com CSS inline (compatível com e-mail)
 */
export function convertHTMLToEmailFormat(html: string): string {
  // Remover tags <style> e <script>
  let emailHTML = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Extrair CSS e converter para inline (simplificado)
  // Para e-mail, vamos usar uma abordagem mais simples com estilos inline básicos
  emailHTML = emailHTML.replace(/class="([^"]*)"/g, (match, className) => {
    // Remover classes e aplicar estilos inline básicos
    return '';
  });

  return emailHTML;
}

/**
 * Gera HTML compatível com e-mail a partir do template de vistoria
 */
/**
 * Escapa HTML para evitar problemas com caracteres especiais
 */
function escapeHTML(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function generateEmailHTML(dados: {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  documentMode?: 'analise' | 'orcamento';
  apontamentos: Array<{
    ambiente: string;
    subtitulo: string;
    descricao: string;
    descricaoServico?: string;
    vistoriaInicial: {
      fotos: Array<File | EmailImage>;
      descritivoLaudo?: string;
    };
    vistoriaFinal: {
      fotos: Array<File | EmailImage>;
    };
    observacao: string;
    classificacao?: 'responsabilidade' | 'revisao';
    tipo?: 'material' | 'mao_de_obra' | 'ambos';
    valor?: number;
    quantidade?: number;
  }>;
}): Promise<string> {
  const { locatario, endereco, dataVistoria, documentMode, apontamentos } = dados;

  // Processar todas as imagens para base64
  const processarFotos = async (fotos: Array<File | EmailImage>) => {
    const fotosBase64: Array<{ base64: string; name: string }> = [];
    
    for (const foto of fotos) {
      const base64 = await convertImageToBase64ForEmail(foto);
      if (base64) {
        const name = foto instanceof File ? foto.name : foto.name || 'imagem.jpg';
        fotosBase64.push({ base64, name });
      }
    }
    
    return fotosBase64;
  };

  // HTML compatível com e-mail (usando tabelas e CSS inline)
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #2563eb; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">ANÁLISE COMPARATIVA DE VISTORIA DE SAÍDA</h1>
              <h2 style="margin: 10px 0 0 0; font-size: 18px; font-weight: normal;">Relatório de Contestação de Vistoria</h2>
            </td>
          </tr>
          
          <!-- Informações do Contrato -->
          <tr>
            <td style="padding: 20px; background-color: #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 10px;">
                    <strong style="color: #475569; font-size: 14px;">Locatário:</strong>
                    <span style="color: #1e293b; font-size: 14px; margin-left: 5px;">${escapeHTML(locatario)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px;">
                    <strong style="color: #475569; font-size: 14px;">Endereço:</strong>
                    <span style="color: #1e293b; font-size: 14px; margin-left: 5px;">${escapeHTML(endereco)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style="color: #475569; font-size: 14px;">Data da Vistoria:</strong>
                    <span style="color: #1e293b; font-size: 14px; margin-left: 5px;">${escapeHTML(dataVistoria)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;

  // Processar apontamentos
  for (let i = 0; i < apontamentos.length; i++) {
    const apontamento = apontamentos[i];
    
    // Processar fotos
    const fotosInicial = await processarFotos(apontamento.vistoriaInicial.fotos || []);
    const fotosFinal = await processarFotos(apontamento.vistoriaFinal.fotos || []);

    html += `
          <!-- Apontamento ${i + 1} -->
          <tr>
            <td style="padding: 20px; border-top: 2px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Cabeçalho do Apontamento -->
                <tr>
                  <td style="padding: 15px; background-color: #3b82f6; color: #ffffff; font-weight: bold; font-size: 16px;">
                    ${escapeHTML(apontamento.ambiente)}${apontamento.subtitulo ? ` - ${escapeHTML(apontamento.subtitulo)}` : ''}
                  </td>
                </tr>
                
                <!-- Descrição -->
                <tr>
                  <td style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">Descrição:</h4>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">${escapeHTML(apontamento.descricao)}</p>
                  </td>
                </tr>
`;

    // Vistoria Inicial
    if (fotosInicial.length > 0 || apontamento.vistoriaInicial.descritivoLaudo) {
      html += `
                <!-- Vistoria Inicial -->
                <tr>
                  <td style="padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #047857; font-size: 14px; border-left: 4px solid #10b981; padding-left: 10px;">
                      Vistoria Inicial
                    </h4>`;

      if (fotosInicial.length > 0) {
        html += `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
                      <tr>`;
        
        fotosInicial.forEach((foto) => {
          html += `
                        <td style="padding: 5px; vertical-align: top;">
                          <img src="${foto.base64}" alt="${escapeHTML(foto.name)}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; display: block;" />
                          <p style="margin: 5px 0 0 0; font-size: 11px; color: #6b7280; text-align: center;">${escapeHTML(foto.name)}</p>
                        </td>`;
        });
        
        html += `
                      </tr>
                    </table>`;
      }

      if (apontamento.vistoriaInicial.descritivoLaudo) {
        html += `
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #374151; font-style: italic;">
                      ${escapeHTML(apontamento.vistoriaInicial.descritivoLaudo || '')}
                    </p>`;
      }

      html += `
                  </td>
                </tr>`;
    }

    // Vistoria Final
    if (fotosFinal.length > 0) {
      html += `
                <!-- Vistoria Final -->
                <tr>
                  <td style="padding: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; border-left: 4px solid #f59e0b; padding-left: 10px;">
                      Vistoria Final
                    </h4>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px;">
                      <tr>`;
      
      fotosFinal.forEach((foto) => {
        html += `
                        <td style="padding: 5px; vertical-align: top;">
                          <img src="${foto.base64}" alt="${escapeHTML(foto.name)}" style="max-width: 100%; height: auto; border: 1px solid #d1d5db; display: block;" />
                          <p style="margin: 5px 0 0 0; font-size: 11px; color: #6b7280; text-align: center;">${escapeHTML(foto.name)}</p>
                        </td>`;
      });
      
      html += `
                      </tr>
                    </table>
                  </td>
                </tr>`;
    }

    // Considerações do Departamento de Rescisão
    if (apontamento.observacao) {
      html += `
                <!-- Considerações do Departamento de Rescisão -->
                <tr>
                  <td style="padding: 20px; background-color: #f3f4f6; border: 2px solid #d1d5db; margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: bold;">Considerações do Departamento de Rescisão:</h4>
                    <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.5;">${escapeHTML(apontamento.observacao)}</p>
                  </td>
                </tr>`;
    }

    html += `
              </table>
            </td>
          </tr>`;
  }

  html += `
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
              <p style="margin: 0;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

