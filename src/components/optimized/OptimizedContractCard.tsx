/**
 * Componente de Contrato Otimizado com React.memo
 * Evita re-renders desnecessários
 */

import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  User,
  User2,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Contract } from '@/types/contract';
import { formatDateBrazilian } from '@/utils/dateFormatter';

// ✅ Interface otimizada com callbacks memoizados
export interface OptimizedContractCardProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onGenerateAgendamento: (contract: Contract) => void;
  onGenerateNPS: (contract: Contract) => void;
  onGenerateWhatsApp: (contract: Contract, type: 'locador' | 'locatario') => void;
  isGenerating?: boolean;
  generatingDocument?: string | null;
}

// ✅ Funções utilitárias memoizadas fora do componente
const isMultipleNames = (name: string): boolean => {
  if (!name) return false;
  return name.includes(',') || name.includes(' e ') || name.includes(' E ');
};

const getLoadingIcon = (
  contractId: string, 
  documentType: string, 
  generatingDocument: string | null,
  icon: React.ReactNode
) => {
  const isGeneratingDoc = generatingDocument === `${contractId}-${documentType}`;
  return isGeneratingDoc ? (
    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
  ) : (
    icon
  );
};

export const OptimizedContractCard = memo<OptimizedContractCardProps>(({
  contract,
  onEdit,
  onDelete,
  onGenerateAgendamento,
  onGenerateNPS,
  onGenerateWhatsApp,
  isGenerating = false,
  generatingDocument,
}) => {
  // ✅ Cálculos memoizados - executados apenas quando contract muda
  const contractInfo = useMemo(() => {
    const createdDate = new Date(contract.created_at);
    const isRecent = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000;
    
    const proprietarioName = contract.form_data.nomesResumidosLocadores ||
      contract.form_data.nomeProprietario || '[NOME DO PROPRIETÁRIO]';
    
    const locatarioName = contract.form_data.nomeLocatario ||
      contract.form_data.primeiroLocatario || '[NOME DO LOCATÁRIO]';
    
    const endereco = contract.form_data.enderecoImovel ||
      contract.form_data.endereco || '[ENDEREÇO DO IMÓVEL]';
    
    return {
      createdDate,
      isRecent,
      proprietarioName,
      locatarioName,
      endereco,
      isMultipleProprietarios: isMultipleNames(proprietarioName),
      isMultipleLocatarios: isMultipleNames(locatarioName),
      numeroContrato: contract.form_data.numeroContrato || '[NÚMERO]',
    };
  }, [contract]);

  // ✅ Callbacks memoizados - evitam re-renders de componentes filhos
  const handleEdit = useCallback(() => {
    onEdit(contract);
  }, [onEdit, contract]);

  const handleDelete = useCallback(() => {
    onDelete(contract.id);
  }, [onDelete, contract.id]);

  const handleGenerateAgendamento = useCallback(() => {
    onGenerateAgendamento(contract);
  }, [onGenerateAgendamento, contract]);

  const handleGenerateNPS = useCallback(() => {
    onGenerateNPS(contract);
  }, [onGenerateNPS, contract]);

  const handleGenerateWhatsAppLocador = useCallback(() => {
    onGenerateWhatsApp(contract, 'locador');
  }, [onGenerateWhatsApp, contract]);

  const handleGenerateWhatsAppLocatario = useCallback(() => {
    onGenerateWhatsApp(contract, 'locatario');
  }, [onGenerateWhatsApp, contract]);

  return (
    <Card className="metric-card glass-card border-border hover:shadow-soft transition-all duration-300 overflow-visible">
      <CardContent className="p-6">
        {/* Header do Contrato */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Contrato {contractInfo.numeroContrato}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatDateBrazilian(contractInfo.createdDate)}
                {contractInfo.isRecent && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Novo
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Separador */}
        <div className="border-t border-border mb-4"></div>

        {/* PARTES ENVOLVIDAS */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Partes Envolvidas
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-green-500/10">
                <User className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {contractInfo.isMultipleProprietarios ? 'Proprietários' : 'Proprietário'}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {contractInfo.proprietarioName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <User2 className="h-3 w-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {contractInfo.isMultipleLocatarios ? 'Locatários' : 'Locatário'}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {contractInfo.locatarioName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INFORMAÇÕES DO IMÓVEL */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Informações do Imóvel
          </h4>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-orange-500/10">
              <MapPin className="h-3 w-3 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Endereço
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {contractInfo.endereco}
              </p>
            </div>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Ações Rápidas
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleGenerateAgendamento}
              disabled={isGenerating}
            >
              {getLoadingIcon(contract.id, 'agendamento', generatingDocument, 
                <Calendar className="h-3 w-3 mr-1" />
              )}
              Agendamento
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleGenerateNPS}
              disabled={isGenerating}
            >
              {getLoadingIcon(contract.id, 'nps', generatingDocument,
                <FileText className="h-3 w-3 mr-1" />
              )}
              NPS
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleGenerateWhatsAppLocador}
              disabled={isGenerating}
            >
              WhatsApp Locador
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleGenerateWhatsAppLocatario}
              disabled={isGenerating}
            >
              WhatsApp Locatário
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ✅ Display name para debugging
OptimizedContractCard.displayName = 'OptimizedContractCard';
