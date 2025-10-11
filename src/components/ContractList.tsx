/**
 * Componente para exibir lista de contratos
 * Gerencia o layout e estados de loading/empty
 * Otimizado com React.memo para melhor performance
 */

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from '@/utils/iconMapper';
import { Link } from 'react-router-dom';
import { ContractCard } from './ContractCard';
import { Contract, DocumentType } from '@/types/contract';

export interface ContractListProps {
  contracts: Contract[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  hasSearched: boolean;
  generatingDocument?: string | null;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onGenerateDocument: (contract: Contract, documentType: DocumentType) => void;
  onGenerateAgendamento: (contract: Contract) => void;
  onGenerateNPS: (contract: Contract) => void;
  onGenerateWhatsApp: (
    contract: Contract,
    type: 'locador' | 'locatario'
  ) => void;
  onLoadMore: () => void;
}

export const ContractList = memo<ContractListProps>(
  ({
    contracts,
    loading,
    loadingMore,
    hasMore,
    hasSearched,
    generatingDocument,
    onEdit,
    onDelete,
    onGenerateDocument,
    onGenerateAgendamento,
    onGenerateNPS,
    onGenerateWhatsApp,
    onLoadMore,
  }) => {
    // Estado de carregamento inicial
    if (loading) {
      return (
        <Card className="glass-card">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Carregando contratos...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde enquanto buscamos seus dados
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Estado vazio (sem contratos)
    if (contracts.length === 0) {
      return (
        <Card className="glass-card">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="p-4 bg-muted rounded-xl mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {hasSearched
                  ? 'Nenhum contrato corresponde aos critérios de busca.'
                  : 'Você ainda não possui contratos cadastrados. Comece criando seu primeiro contrato.'}
              </p>
              {!hasSearched && (
                <Button asChild>
                  <Link to="/cadastrar-contrato">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Contrato
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Lista de contratos
    return (
      <div className="space-y-6">
        {/* Grid de contratos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onEdit={onEdit}
              onDelete={onDelete}
              onGenerateDocument={onGenerateDocument}
              onGenerateAgendamento={onGenerateAgendamento}
              onGenerateNPS={onGenerateNPS}
              onGenerateWhatsApp={onGenerateWhatsApp}
              generatingDocument={generatingDocument}
              isGenerating={!!generatingDocument}
            />
          ))}
        </div>

        {/* Botão Carregar Mais */}
        {!hasSearched && hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={onLoadMore}
              disabled={loadingMore}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              {loadingMore ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  Carregando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Carregar Mais Contratos
                </>
              )}
            </Button>
          </div>
        )}

        {/* Indicador de fim da lista */}
        {!hasSearched && !hasMore && contracts.length > 6 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Todos os contratos foram carregados
            </p>
          </div>
        )}
      </div>
    );
  }
);

ContractList.displayName = 'ContractList';
