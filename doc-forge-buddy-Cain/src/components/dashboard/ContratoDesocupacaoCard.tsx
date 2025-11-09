import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContratoDesocupacao } from '@/types/dashboardDesocupacao';
import { formatDateBrazilian } from '@/utils/core/dateFormatter';
import {
  MapPin,
  User,
  Calendar,
  FileText,
  Edit,
} from '@/utils/iconMapper';
import { useState } from 'react';
import { ModalEditarMotivo } from './ModalEditarMotivo';

interface ContratoDesocupacaoCardProps {
  contrato: ContratoDesocupacao;
  onMotivoUpdated?: () => void;
}

/**
 * Card individual para exibir informações de um contrato em desocupação
 */
export function ContratoDesocupacaoCard({
  contrato,
  onMotivoUpdated,
}: ContratoDesocupacaoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Formatar datas para português
  const dataInicioRescisaoFormatada = contrato.dataInicioRescisao
    ? (() => {
        // Se já está no formato brasileiro DD/MM/YYYY, usar diretamente
        if (contrato.dataInicioRescisao.includes('/')) {
          const [dia, mes, ano] = contrato.dataInicioRescisao.split('/');
          const dataObj = new Date(
            parseInt(ano),
            parseInt(mes) - 1,
            parseInt(dia)
          );
          return formatDateBrazilian(dataObj);
        }
        // Se está em outro formato, converter normalmente
        return formatDateBrazilian(new Date(contrato.dataInicioRescisao));
      })()
    : 'Não informada';

  const dataNotificacaoFormatada = contrato.dataNotificacao
    ? formatDateBrazilian(new Date(contrato.dataNotificacao))
    : 'Não informada';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-neutral-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com número do contrato */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-600">
                Contrato #{contrato.numeroContrato}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Desocupação
            </Badge>
          </div>

          {/* Endereço */}
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-600 truncate">
                {contrato.enderecoImovel || 'Endereço não informado'}
              </p>
            </div>
          </div>

          {/* Locatário */}
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-600 truncate">
                {contrato.nomeLocatario || 'Nome não informado'}
              </p>
            </div>
          </div>

          {/* Motivo da desocupação */}
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-neutral-700">
                Motivo da Desocupação
              </h5>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-6 px-2 text-xs hover:bg-neutral-200"
                  title="Editar motivo"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">
              {contrato.motivoDesocupacao || 'Motivo não informado'}
            </p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Data Início Rescisão</p>
                <p className="text-sm font-medium text-neutral-700">
                  {dataInicioRescisaoFormatada}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-neutral-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Data Notificação</p>
                <p className="text-sm font-medium text-neutral-700">
                  {dataNotificacaoFormatada}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modal de edição */}
      <ModalEditarMotivo
        contrato={contrato}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onMotivoUpdated?.();
          setIsModalOpen(false);
        }}
      />
    </Card>
  );
}
