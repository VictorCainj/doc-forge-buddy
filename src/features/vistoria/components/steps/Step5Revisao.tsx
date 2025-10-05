import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VistoriaWizardData } from '../../hooks/useVistoriaWizard';

interface Step5RevisaoProps {
  data: VistoriaWizardData;
}

export const Step5Revisao: React.FC<Step5RevisaoProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Revisão Final</h2>
        <p className="text-sm text-muted-foreground">
          Confira todas as informações antes de gerar o documento
        </p>
      </div>

      {/* Dados Básicos */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Dados Básicos</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contrato:</span>
            <span className="font-medium">{data.contratoId || 'Não selecionado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{data.dataVistoria || 'Não informada'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo:</span>
            <Badge variant="outline">{data.tipoVistoria || 'inicial'}</Badge>
          </div>
        </div>
      </Card>

      {/* Ambientes */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Ambientes</h3>
        {data.ambientes && data.ambientes.length > 0 ? (
          <div className="space-y-1">
            {data.ambientes.map((amb, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{i + 1}</Badge>
                <span>{amb.nome}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum ambiente adicionado</p>
        )}
      </Card>

      {/* Apontamentos */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Apontamentos</h3>
        {data.apontamentos && data.apontamentos.length > 0 ? (
          <div className="space-y-2">
            {data.apontamentos.map((apt, i) => (
              <div key={i} className="border-l-2 border-primary pl-3 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{apt.tipo}</Badge>
                  <span className="text-sm font-medium">{apt.subtitulo}</span>
                </div>
                <p className="text-xs text-muted-foreground">{apt.ambiente}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum apontamento registrado</p>
        )}
      </Card>

      {/* Orçamento */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Orçamento</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-bold text-lg">
              R$ {data.orcamento?.valorTotal.toFixed(2) || '0,00'}
            </span>
          </div>
          {data.orcamento?.prestadorId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prestador:</span>
              <span>{data.orcamento.prestadorId}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
