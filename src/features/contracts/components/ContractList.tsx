import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  User,
  User2,
  Timer,
  CalendarDays,
  Clock,
  MapPin,
  Edit,
} from 'lucide-react';
import QuickActionsDropdown from '@/components/QuickActionsDropdown';
import { Contract } from '@/types/contract';

interface ContractListProps {
  contracts: Contract[];
  isLoading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  isLoadingMore?: boolean;
  totalCount?: number;
  displayedCount?: number;
  hasSearched?: boolean;
  onGenerateDocument: (contract: Contract, template: string, documentType: string) => void;
}

/**
 * Helper para verificar múltiplos proprietários
 */
const isMultipleProprietarios = (nome?: string) => {
  if (!nome) return false;
  return nome.includes(' e ') || nome.includes(' E ');
};

/**
 * Helper para verificar múltiplos locatários
 */
const isMultipleLocatarios = (nome?: string) => {
  if (!nome) return false;
  return nome.includes(' e ') || nome.includes(' E ');
};

/**
 * Componente de lista de contratos
 * Memoizado para evitar re-renders desnecessários
 */
export const ContractList = memo<ContractListProps>(({
  contracts,
  isLoading,
  hasMore,
  loadMore,
  isLoadingMore,
  totalCount = 0,
  displayedCount,
  hasSearched,
  onGenerateDocument,
}) => {
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="p-4 bg-blue-500/20 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
            <p className="text-lg font-medium text-white">
              Carregando contratos...
            </p>
            <p className="text-sm text-blue-200 mt-1">
              Aguarde um momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (contracts.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="p-4 bg-blue-500/20 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum contrato cadastrado ainda
            </h3>
            <p className="text-blue-200 mb-6">
              Comece criando seu primeiro contrato no sistema
            </p>
            <Link to="/cadastrar-contrato">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Contrato
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remainingCount = displayedCount 
    ? Math.max(0, totalCount - displayedCount)
    : 0;

  return (
    <>
      {/* Grid de Contratos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map((contract) => (
          <Card
            key={contract.id}
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 hover:border-blue-400/40 transition-all duration-300 overflow-visible shadow-lg"
          >
            <CardContent className="p-6">
              {/* Header do Contrato */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Contrato{' '}
                      {contract.form_data.numeroContrato || '[NÚMERO]'}
                    </h3>
                    <p className="text-xs text-blue-200">
                      ID: {contract.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-blue-500/20 mb-4"></div>

              {/* PARTES ENVOLVIDAS */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-blue-300 uppercase tracking-wide mb-3">
                  Partes Envolvidas
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-green-500/10">
                      <User className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">
                        {isMultipleProprietarios(
                          contract.form_data.nomeProprietario
                        )
                          ? 'Proprietários'
                          : 'Proprietário'}
                      </p>
                      <p className="text-xs font-bold text-white truncate">
                        {contract.form_data.nomeProprietario}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <User2 className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">
                        {isMultipleLocatarios(
                          contract.form_data.nomeLocatario
                        )
                          ? 'Locatários'
                          : 'Locatário'}
                      </p>
                      <p className="text-xs font-bold text-white truncate">
                        {contract.form_data.nomeLocatario}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TERMOS DO CONTRATO */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-blue-300 uppercase tracking-wide mb-3">
                  Termos do Contrato
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-yellow-500/10">
                        <Timer className="h-3 w-3 text-yellow-600" />
                      </div>
                      <span className="text-xs font-medium text-blue-200">
                        Prazo
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white">
                      {contract.form_data.prazoDias} dias
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-green-500/10">
                          <CalendarDays className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-200">
                          Início
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {contract.form_data.dataInicioRescisao ||
                          '01/09/2026'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-red-500/10">
                          <Clock className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-200">
                          Término
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {contract.form_data.dataTerminoRescisao ||
                          '01/10/2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOCALIZAÇÃO */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-blue-300 uppercase tracking-wide mb-3">
                  Localização
                </h4>
                <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                  <div className="p-1 rounded bg-purple-500/10">
                    <MapPin className="h-3 w-3 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Endereço
                    </p>
                    <p 
                      className="text-xs font-bold text-foreground line-clamp-2 cursor-pointer hover:text-primary hover:underline transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const endereco = contract.form_data.endereco || contract.form_data.enderecoImovel;
                        if (endereco) {
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
                          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      title="Clique para abrir no Google Maps"
                    >
                      {contract.form_data.endereco ||
                        contract.form_data.enderecoImovel ||
                        '[ENDEREÇO NÃO INFORMADO]'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AÇÕES RÁPIDAS */}
              <div className="border-t border-blue-500/20 pt-4 relative overflow-visible">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        navigate(`/editar-contrato/${contract.id}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <QuickActionsDropdown
                      contractId={contract.id}
                      contractNumber={
                        contract.form_data.numeroContrato || '[NÚMERO]'
                      }
                      onGenerateDocument={(
                        _contractId,
                        template,
                        title
                      ) => {
                        onGenerateDocument(contract, template, title);
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão Ver Mais */}
      {hasMore && !hasSearched && loadMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-blue-400/30 hover:border-blue-400/60 backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Carregando...
              </>
            ) : (
              `Ver mais (${remainingCount} restantes)`
            )}
          </Button>
        </div>
      )}
    </>
  );
});

ContractList.displayName = 'ContractList';
