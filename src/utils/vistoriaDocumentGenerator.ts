import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ApontamentoVistoria {
  id: string;
  ambiente: string;
  subtitulo: string;
  descricao: string;
  vistoriaInicial: {
    fotos: File[];
  };
  vistoriaFinal: {
    fotos: File[];
  };
  observacao: string;
}

export interface DadosVistoria {
  locatario: string;
  endereco: string;
  dataVistoria: string;
  apontamentos: ApontamentoVistoria[];
}

export const generateVistoriaDocument = (dados: DadosVistoria): string => {
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  let documento = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análise Comparativa de Vistoria de Saída</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            font-size: 24px;
            margin: 0;
        }
        .header h2 {
            color: #64748b;
            font-size: 18px;
            margin: 10px 0 0 0;
            font-weight: normal;
        }
        .info-section {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .info-section h3 {
            color: #1e40af;
            margin: 0 0 15px 0;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 14px;
        }
        .info-value {
            color: #1e293b;
            font-size: 14px;
        }
        .apontamento {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 25px;
            overflow: hidden;
        }
        .apontamento-header {
            background: #3b82f6;
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 16px;
        }
        .apontamento-content {
            padding: 20px;
        }
        .descricao {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 0 6px 6px 0;
        }
        .descricao h4 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 14px;
        }
        .descricao p {
            margin: 0;
            color: #78350f;
            font-size: 14px;
        }
        .vistorias {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .vistoria {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
        }
        .vistoria-inicial {
            border-left: 4px solid #10b981;
        }
        .vistoria-final {
            border-left: 4px solid #f59e0b;
        }
        .vistoria h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .vistoria-inicial h4 {
            color: #047857;
        }
        .vistoria-final h4 {
            color: #92400e;
        }
        .fotos {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .foto-item {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            color: #374151;
        }
        .observacao {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
        }
        .observacao h4 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: bold;
        }
        .observacao p {
            margin: 0;
            color: #1e293b;
            font-size: 14px;
            line-height: 1.5;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        .no-fotos {
            color: #9ca3af;
            font-style: italic;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ANÁLISE COMPARATIVA DE VISTORIA DE SAÍDA</h1>
            <h2>Relatório de Contestação de Vistoria</h2>
        </div>

        <div class="info-section">
            <h3>Informações do Contrato</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Locatário:</span>
                    <span class="info-value">${dados.locatario}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Endereço:</span>
                    <span class="info-value">${dados.endereco}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data da Vistoria:</span>
                    <span class="info-value">${dados.dataVistoria}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data do Relatório:</span>
                    <span class="info-value">${dataAtual}</span>
                </div>
            </div>
        </div>
`;

  // Adicionar cada apontamento
  dados.apontamentos.forEach((apontamento, index) => {
    documento += `
        <div class="apontamento">
            <div class="apontamento-header">
                ${index + 1}. ${apontamento.ambiente}${apontamento.subtitulo ? ` - ${apontamento.subtitulo}` : ''}
            </div>
            <div class="apontamento-content">
                <div class="descricao">
                    <h4>Descrição do Apontamento:</h4>
                    <p>${apontamento.descricao}</p>
                </div>
                
                <div class="vistorias">
                    <div class="vistoria vistoria-inicial">
                        <h4>✓ Vistoria Inicial</h4>
                        <div class="fotos">
                            ${
                              apontamento.vistoriaInicial.fotos.length > 0
                                ? apontamento.vistoriaInicial.fotos
                                    .map(
                                      (foto) =>
                                        `<span class="foto-item">${foto.name}</span>`
                                    )
                                    .join('')
                                : '<span class="no-fotos">Nenhuma foto anexada</span>'
                            }
                        </div>
                    </div>
                    
                    <div class="vistoria vistoria-final">
                        <h4>⚠ Vistoria Final</h4>
                        <div class="fotos">
                            ${
                              apontamento.vistoriaFinal.fotos.length > 0
                                ? apontamento.vistoriaFinal.fotos
                                    .map(
                                      (foto) =>
                                        `<span class="foto-item">${foto.name}</span>`
                                    )
                                    .join('')
                                : '<span class="no-fotos">Nenhuma foto anexada</span>'
                            }
                        </div>
                    </div>
                </div>
                
                ${
                  apontamento.observacao
                    ? `
                <div class="observacao">
                    <h4>ANÁLISE TÉCNICA:</h4>
                    <p>${apontamento.observacao}</p>
                </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
  });

  documento += `
        <div class="footer">
            <p>Relatório gerado automaticamente em ${dataAtual}</p>
            <p>DocForge - Sistema de Gestão de Contratos</p>
        </div>
    </div>
</body>
</html>
`;

  return documento;
};

export const downloadVistoriaDocument = (
  dados: DadosVistoria,
  filename: string = 'analise-vistoria.html'
) => {
  const documento = generateVistoriaDocument(dados);
  const blob = new Blob([documento], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
