/**
 * Componente para exibir um card individual de contrato
 * Extraído do componente Contratos para melhor reutilização
 * Otimizado com React.memo para evitar re-renders desnecessários
 */

import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Badge component removed - not used
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Trash2,
  // Ícones coloridos para o card
  FileTextColored,
  CalendarColored,
  UserColored,
  User2Colored,
  MapPinColored,
  EditColored,
  SearchCheckColored,
} from '@/utils/iconMapper';
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
  onGenerateWhatsApp: (
    contract: Contract,
    type: 'locador' | 'locatario'
  ) => void;
  isGenerating?: boolean;
  generatingDocument?: string | null;
}

export const ContractCard = memo<ContractCardProps>(
  ({
    contract,
    onEdit: _onEdit,
    onDelete,
    onGenerateDocument: _onGenerateDocument,
    onGenerateAgendamento,
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
      <Card className="group relative bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-xl transition-all duration-500 overflow-visible backdrop-blur-sm shadow-sm">
        {/* Gradiente sutil no topo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg"></div>
        
        <CardContent className="relative p-6">
          {/* Header do Contrato */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow duration-300">
                <FileTextColored className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 tracking-tight">
                  {contract.form_data.numeroContrato || 'Contrato sem número'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                  ID: {contract.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-neutral-100 transition-colors">
                  <MoreVertical className="h-4 w-4 text-neutral-600" />
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

          {/* Separador com gradiente */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-300 to-transparent h-px"></div>
          </div>

          {/* PARTES ENVOLVIDAS */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              Partes Envolvidas
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 hover:border-emerald-200/50 transition-colors group/item">
                <div className="p-2 rounded-lg bg-white shadow-sm group-hover/item:shadow-md transition-shadow">
                  <UserColored className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                    {isMultipleProprietarios(
                      contract.form_data.nomesResumidosLocadores ||
                        contract.form_data.nomeProprietario ||
                        ''
                    )
                      ? 'Proprietários'
                      : 'Proprietário'}
                  </p>
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {contract.form_data.nomesResumidosLocadores ||
                      contract.form_data.nomeProprietario ||
                      '[NOME DO PROPRIETÁRIO]'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 hover:border-blue-200/50 transition-colors group/item">
                <div className="p-2 rounded-lg bg-white shadow-sm group-hover/item:shadow-md transition-shadow">
                  <User2Colored className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    {isMultipleLocatarios(
                      contract.form_data.nomeLocatario ||
                        contract.form_data.primeiroLocatario ||
                        ''
                    )
                      ? 'Locatários'
                      : 'Locatário'}
                  </p>
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {contract.form_data.nomeLocatario ||
                      contract.form_data.primeiroLocatario ||
                      '[NOME DO LOCATÁRIO]'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES DO IMÓVEL */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              Localização
            </h4>
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 hover:border-amber-200/50 transition-colors">
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <MapPinColored className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Endereço
                </p>
                <p
                  className="text-sm font-medium text-neutral-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const endereco =
                      contract.form_data.enderecoImovel ||
                      contract.form_data.endereco;
                    if (endereco && endereco !== '[ENDEREÇO DO IMÓVEL]') {
                      const earthUrl = `https://earth.google.com/web/search/${encodeURIComponent(endereco)}`;
                      window.open(earthUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  title="Clique para abrir no Google Earth"
                >
                  {contract.form_data.enderecoImovel ||
                    contract.form_data.endereco ||
                    '[ENDEREÇO DO IMÓVEL]'}
                </p>
              </div>
            </div>
          </div>

          {/* Separador sutil */}
          <div className="relative my-5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-300 to-transparent h-px"></div>
          </div>

          {/* BOTÃO EDITAR */}
          <div className="flex items-center justify-between mb-5">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 px-4 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
              onClick={handleEditContract}
            >
              <EditColored className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="space-y-2.5 pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              Ações Rápidas
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-neutral-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm hover:shadow w-full"
                onClick={() => onGenerateAgendamento(contract)}
                disabled={isGenerating}
              >
                {getLoadingIcon(
                  contract.id,
                  'agendamento',
                  <CalendarColored className="h-3.5 w-3.5 mr-1.5" />
                )}
                Agendamento
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm hover:shadow"
                onClick={() => onGenerateWhatsApp(contract, 'locador')}
                disabled={isGenerating}
              >
                WhatsApp Locador
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm hover:shadow"
                onClick={() => onGenerateWhatsApp(contract, 'locatario')}
                disabled={isGenerating}
              >
                WhatsApp Locatário
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-neutral-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all shadow-sm hover:shadow"
                onClick={handleAnaliseClick}
                disabled={checkingAnalise}
              >
                <SearchCheckColored className="h-3.5 w-3.5 mr-1.5" />
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
  }
);

ContractCard.displayName = 'ContractCard';
