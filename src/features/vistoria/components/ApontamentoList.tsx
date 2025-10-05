import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ClipboardList, Package, Wrench } from 'lucide-react';
import { ApontamentoVistoria } from '@/types/vistoria';

interface ApontamentoListProps {
  apontamentos: ApontamentoVistoria[];
  documentMode: 'analise' | 'orcamento';
  onEdit: (apontamento: ApontamentoVistoria) => void;
  onRemove: (id: string) => void;
}

const ApontamentoList = memo(({ apontamentos, documentMode, onEdit, onRemove }: ApontamentoListProps) => {
  if (apontamentos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum apontamento adicionado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const calcularTotal = () => {
    return apontamentos.reduce((total, apontamento) => {
      const valor = apontamento.valor || 0;
      const quantidade = apontamento.quantidade || 0;
      return total + (valor * quantidade);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>Apontamentos ({apontamentos.length})</span>
          </CardTitle>
          {documentMode === 'orcamento' && (
            <Badge variant="default" className="text-lg px-4 py-1">
              Total: R$ {calcularTotal().toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {apontamentos.map((apontamento) => (
          <div
            key={apontamento.id}
            className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {apontamento.ambiente}
                  </h3>
                  {apontamento.subtitulo && (
                    <Badge variant="outline" className="text-xs">
                      {apontamento.subtitulo}
                    </Badge>
                  )}
                  {documentMode === 'orcamento' && apontamento.tipo && (
                    <Badge 
                      variant={apontamento.tipo === 'material' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {apontamento.tipo === 'material' ? (
                        <><Package className="h-3 w-3 mr-1" /> Material</>
                      ) : (
                        <><Wrench className="h-3 w-3 mr-1" /> Mão de Obra</>
                      )}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {apontamento.descricao}
                </p>

                {documentMode === 'orcamento' && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-muted-foreground">
                      Qtd: <strong>{apontamento.quantidade || 0}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Valor Unit.: <strong>R$ {(apontamento.valor || 0).toFixed(2)}</strong>
                    </span>
                    <span className="text-primary font-semibold">
                      Subtotal: R$ {((apontamento.valor || 0) * (apontamento.quantidade || 0)).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    Fotos Inicial: {apontamento.vistoriaInicial?.fotos?.length || 0}
                  </span>
                  <span>
                    Fotos Final: {apontamento.vistoriaFinal?.fotos?.length || 0}
                  </span>
                </div>

                {apontamento.observacao && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Obs: {apontamento.observacao}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(apontamento)}
                  title="Editar apontamento"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(apontamento.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remover apontamento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

ApontamentoList.displayName = 'ApontamentoList';

export default ApontamentoList;
