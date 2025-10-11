/**
 * Componente para exibir um card individual de contrato
 * Extraído do componente Contratos para melhor reutilização
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Badge component removed - not used
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  Edit,
  MapPin,
  MoreVertical,
  Trash2,
  User,
  User2,
  SearchCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Contract, DocumentType } from '@/types/contract';
// formatDateBrazilian removed - not used
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ContractCardProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onGenerateDocument: (contract: Contract, documentType: DocumentType) => void;
  onGenerateAgendamento: (contract: Contract) => void;
  onGenerateNPS: (contract: Contract) => void;
  onGenerateWhatsApp: (
    contract: Contract,
    type: 'locador' | 'locatario'
  ) => void;
  isGenerating?: boolean;
  generatingDocument?: string | null;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onEdit: _onEdit,
  onDelete,
  onGenerateDocument: _onGenerateDocument,
  onGenerateAgendamento,
  onGenerateNPS,
  onGenerateWhatsApp,
  isGenerating = false,
  generatingDocument,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasAnalise, setHasAnalise] = useState(false);
  const [checkingAnalise, setCheckingAnalise] = useState(false);

  const handleEditContract = () => {
    navigate(`/editar-contrato/${contract.id}`);
  };

  // Verificar se existe análise para este contrato
  useEffect(() => {
    const checkAnalise = async () => {
      if (!user || !contract.id) return;

      setCheckingAnalise(true);
      try {
        const { data, error } = await supabase
          .from('vistoria_analises')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setHasAnalise(true);
        } else {
          setHasAnalise(false);
        }
      } catch {
        setHasAnalise(false);
      } finally {
        setCheckingAnalise(false);
      }
    };

    checkAnalise();
  }, [contract.id, user]);

  const handleAnaliseClick = () => {
    navigate('/analise-vistoria', {
      state: {
        contractId: contract.id,
        contractData: {
          locatario:
            contract.form_data.nomeLocatario ||
            contract.form_data.primeiroLocatario ||
            '',
          endereco:
            contract.form_data.enderecoImovel ||
            contract.form_data.endereco ||
            '',
        },
      },
    });
  };

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

  const getLoadingIcon = (
    contractId: string,
    documentType: string,
    icon: React.ReactNode
  ) => {
    const isGeneratingDoc =
      generatingDocument === `${contractId}-${documentType}`;
    return isGeneratingDoc ? (
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
    ) : (
      icon
    );
  };

  // Date calculations removed - not used

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
                ID: {contract.id.slice(0, 8)}...
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
              <DropdownMenuItem
                onClick={() => onDelete(contract.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Separador */}
        <div className="border-t border-primary-500/20 mb-4"></div>

        {/* PARTES ENVOLVIDAS */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Partes Envolvidas
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-success-500/10">
                <User className="h-3 w-3 text-success-600" />
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
              <div className="p-1.5 rounded-md bg-primary-500/10">
                <User2 className="h-3 w-3 text-primary-600" />
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
            <div className="p-1.5 rounded-md bg-warning-500/10">
              <MapPin className="h-3 w-3 text-warning-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Endereço
              </p>
              <p
                className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const endereco =
                    contract.form_data.enderecoImovel ||
                    contract.form_data.endereco;
                  if (endereco && endereco !== '[ENDEREÇO DO IMÓVEL]') {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
                    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                title="Clique para abrir no Google Maps"
              >
                {contract.form_data.enderecoImovel ||
                  contract.form_data.endereco ||
                  '[ENDEREÇO DO IMÓVEL]'}
              </p>
            </div>
          </div>
        </div>

        {/* BOTÃO EDITAR */}
        <div className="flex items-center justify-between mb-4 pt-2 border-t border-primary-500/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={handleEditContract}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="space-y-2 pt-3 border-t border-primary-500/20">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onGenerateAgendamento(contract)}
              disabled={isGenerating}
            >
              {getLoadingIcon(
                contract.id,
                'agendamento',
                <Calendar className="h-3 w-3 mr-1" />
              )}
              Agendamento
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onGenerateNPS(contract)}
              disabled={isGenerating}
            >
              {getLoadingIcon(
                contract.id,
                'nps',
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
              onClick={() => onGenerateWhatsApp(contract, 'locador')}
              disabled={isGenerating}
            >
              WhatsApp Locador
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onGenerateWhatsApp(contract, 'locatario')}
              disabled={isGenerating}
            >
              WhatsApp Locatário
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={handleAnaliseClick}
              disabled={checkingAnalise}
            >
              <SearchCheck className="h-3 w-3 mr-1" />
              {checkingAnalise
                ? 'Verificando...'
                : hasAnalise
                  ? 'Carregar Análise'
                  : 'Criar Análise'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
