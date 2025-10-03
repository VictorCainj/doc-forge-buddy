/**
 * Versão refatorada do ContractCard usando Context
 * Elimina prop drilling e simplifica a interface
 */

import React from 'react';
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
import { useContractActions } from '@/contexts/ContractContext';

// ✅ Interface muito mais simples - sem prop drilling!
export interface ContractCardRefactoredProps {
  contract: Contract;
}

export const ContractCardRefactored: React.FC<ContractCardRefactoredProps> = ({
  contract,
}) => {
  // ✅ Todas as ações vêm do contexto - sem props!
  const {
    handleEdit,
    handleDelete,
    handleGenerateAgendamento,
    handleGenerateNPS,
    handleGenerateWhatsApp,
  } = useContractActions();

  const isMultipleProprietarios = (nomeProprietario: string) => {
    if (!nomeProprietario) return false;
    return (
      nomeProprietario.includes(',') ||
      nomeProprietario.includes(' e ') ||
      nomeProprietario.includes(' E ')
    );
  };

  const isMultipleLocatarios = (nomeLocatario: string) => {
    if (!nomeLocatario) return false;
    return (
      nomeLocatario.includes(',') ||
      nomeLocatario.includes(' e ') ||
      nomeLocatario.includes(' E ')
    );
  };

  const createdDate = new Date(contract.created_at);
  const isRecent = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000;

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
                Contrato {contract.form_data.numeroContrato || '[NÚMERO]'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatDateBrazilian(createdDate)}
                {isRecent && (
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
              {/* ✅ Ações simplificadas - sem props complexas! */}
              <DropdownMenuItem onClick={() => handleEdit(contract)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(contract.id)}
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
                  {isMultipleProprietarios(
                    contract.form_data.nomesResumidosLocadores ||
                      contract.form_data.nomeProprietario ||
                      ''
                  )
                    ? 'Proprietários'
                    : 'Proprietário'}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {contract.form_data.nomesResumidosLocadores ||
                    contract.form_data.nomeProprietario ||
                    '[NOME DO PROPRIETÁRIO]'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <User2 className="h-3 w-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isMultipleLocatarios(
                    contract.form_data.nomeLocatario ||
                      contract.form_data.primeiroLocatario ||
                      ''
                  )
                    ? 'Locatários'
                    : 'Locatário'}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {contract.form_data.nomeLocatario ||
                    contract.form_data.primeiroLocatario ||
                    '[NOME DO LOCATÁRIO]'}
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
                {contract.form_data.enderecoImovel ||
                  contract.form_data.endereco ||
                  '[ENDEREÇO DO IMÓVEL]'}
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
            {/* ✅ Ações simplificadas - contexto gerencia tudo! */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleGenerateAgendamento(contract)}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Agendamento
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleGenerateNPS(contract)}
            >
              <FileText className="h-3 w-3 mr-1" />
              NPS
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleGenerateWhatsApp(contract, 'locador')}
            >
              WhatsApp Locador
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleGenerateWhatsApp(contract, 'locatario')}
            >
              WhatsApp Locatário
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
