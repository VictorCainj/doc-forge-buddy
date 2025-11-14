import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  X,
} from '@/utils/iconMapper';
import { ApontamentoVistoria } from '../types/vistoria';

interface ApontamentosListMinimalProps {
  apontamentos: ApontamentoVistoria[];
  documentMode: 'analise' | 'orcamento';
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const ApontamentosListMinimal: React.FC<ApontamentosListMinimalProps> = ({
  apontamentos,
  documentMode,
  onApprove,
  onReject,
  onEdit,
  onRemove,
}) => {
  const handleClassify = (apontamentoId: string, classificacao: 'responsabilidade' | 'revisao') => {
    if (classificacao === 'responsabilidade' && onApprove) {
      onApprove(apontamentoId);
    } else if (classificacao === 'revisao' && onReject) {
      onReject(apontamentoId);
    }
  };

  if (apontamentos.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400">
        <p className="text-sm">Nenhum apontamento adicionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apontamentos.map((apontamento, index) => {
        const isApproved = apontamento.classificacao === 'responsabilidade';
        const isRejected = apontamento.classificacao === 'revisao';

        return (
          <Card
            key={apontamento.id}
            className={`border transition-all ${
              isApproved
                ? 'border-green-200 bg-green-50/50'
                : isRejected
                  ? 'border-yellow-200 bg-yellow-50/50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {/* Número do apontamento */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isApproved
                      ? 'bg-green-100 text-green-700'
                      : isRejected
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-neutral-900 truncate">
                        {apontamento.ambiente}
                        {apontamento.subtitulo && (
                          <span className="text-neutral-500 font-normal ml-1">
                            - {apontamento.subtitulo}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">
                        {apontamento.descricao}
                      </p>
                    </div>

                    {/* Status badge */}
                    {isApproved && (
                      <Badge variant="outline" className="flex-shrink-0 border-green-300 text-green-700 bg-green-50 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aprovado
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge variant="outline" className="flex-shrink-0 border-yellow-300 text-yellow-700 bg-yellow-50 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Revisão
                      </Badge>
                    )}
                  </div>

                  {/* Ações de classificação (apenas modo análise e se não estiver classificado) */}
                  {documentMode === 'analise' && !apontamento.classificacao && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClassify(apontamento.id, 'responsabilidade')}
                        className="flex-1 h-7 text-xs border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClassify(apontamento.id, 'revisao')}
                        className="flex-1 h-7 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Revisar
                      </Button>
                    </div>
                  )}

                  {/* Ações secundárias */}
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-100">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(apontamento.id)}
                        className="h-6 px-2 text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(apontamento.id)}
                        className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

