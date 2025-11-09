/**
 * Componente de card de contrato individual
 */

import React, { memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Search, Star } from '@/utils/iconMapper';
import { FileText,
  User,
  User2,
  Timer,
  CalendarDays,
  Clock,
  MapPin, } from '@/lib/icons';
import { Contract } from '@/types/contract';
import { ContractBillsSection } from './ContractBillsSection';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractTags } from './ContractTags';
import { useContractFavorites } from '@/hooks/useContractFavorites';
import { getCardGradientClassByStatus } from '@/utils/contractGradients';

interface ContractCardProps {
  contract: Contract;
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

export const ContractCard: React.FC<ContractCardProps> = memo<ContractCardProps>(
  ({ contract, onGenerateDocument }) => {
    const { isFavorite, toggleFavorite } = useContractFavorites();
    const navigate = useNavigate();

    const handleEdit = useCallback(() => {
      navigate(`/editar-contrato/${contract.id}`);
    }, [contract.id, navigate]);

    const handleProprietarioSearch = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const searchUrl = `https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(contract.form_data.nomeProprietario || '')}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }, [contract.form_data.nomeProprietario]);

    const handleLocatarioSearch = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const searchUrl = `https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(contract.form_data.nomeLocatario || '')}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }, [contract.form_data.nomeLocatario]);

    const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(contract.id);
    }, [contract.id, toggleFavorite]);

    const handleHeaderClick = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('.tag-container')
      ) {
        return;
      }
      handleEdit();
    }, [handleEdit]);

    // Se for favorito, usar laranja. Caso contrário, usar gradiente baseado em status ou neutro
    const favorite = isFavorite(contract.id);
    const gradientClass = favorite 
      ? 'ai-card-orange' 
      : getCardGradientClassByStatus(contract, 0);

    return (
      <div className="relative fade-in-up">
        {/* Tags acima do card */}
        <div className="mb-2 px-1 flex flex-wrap gap-1.5 justify-start tag-container">
          <ContractTags contractId={contract.id} contract={contract} maxVisible={3} />
        </div>

        <Card className={`bg-white border border-neutral-200 ${gradientClass} rounded-lg overflow-visible min-h-fit transition-all duration-200 hover:shadow-md group`}>
          <CardContent className="p-6 relative z-10">
            {/* Header do Contrato - Clicável */}
            <div 
              className="flex items-start justify-between mb-5 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleHeaderClick}
            >
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <h3 className="font-bold text-xl text-neutral-900 mb-1 group-hover:text-purple-600 transition-colors">
                    Contrato{' '}
                    <span className="font-mono text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {contract.form_data.numeroContrato || '[NÚMERO]'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">
                    ID: {contract.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Badge de Status */}
                <ContractStatusBadge contract={contract} className="hidden sm:flex" />
                
                {/* Botão de Favorito */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 w-9 p-0 flex-shrink-0 rounded-lg transition-all duration-200 ${
                    favorite
                      ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                      : 'hover:bg-white/80 hover:text-amber-500'
                  }`}
                  onClick={handleToggleFavorite}
                  aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Star className={`h-4 w-4 transition-all duration-200 ${favorite ? 'fill-current' : ''}`} />
                </Button>

                {/* Botão de Editar */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 flex-shrink-0 rounded-lg hover:bg-white/80 transition-all duration-200"
                  onClick={handleEdit}
                  aria-label={`Editar contrato ${contract.form_data.numeroContrato}`}
                >
                  <Edit className="h-4 w-4 icon-gradient" />
                </Button>
              </div>
            </div>

            {/* Badge de Status Mobile */}
            <div className="mb-3 sm:hidden">
              <ContractStatusBadge contract={contract} />
            </div>

            {/* Separador com gradiente */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-white/80 px-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </div>
              </div>
            </div>

            {/* PARTES ENVOLVIDAS */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neutral-400 to-neutral-500 rounded-full"></span>
                Partes Envolvidas
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 group/item">
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-lg transition-transform duration-200 group-hover/item:scale-110">
                      <User
                        className="h-4 w-4 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                      {isMultipleProprietarios(contract.form_data.nomeProprietario)
                        ? 'Proprietários'
                        : 'Proprietário'}
                    </p>
                    <div className="flex items-center gap-2 group/name">
                      <p className="text-sm font-semibold text-neutral-800 truncate leading-tight">
                        {contract.form_data.nomeProprietario}
                      </p>
                      <button
                        onClick={handleProprietarioSearch}
                        className="opacity-0 group-hover/name:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-white/80 rounded-lg hover:scale-110"
                        title="Buscar no JusBrasil"
                        aria-label={`Buscar ${contract.form_data.nomeProprietario} no JusBrasil`}
                      >
                        <Search className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 group/item">
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 shadow-lg transition-transform duration-200 group-hover/item:scale-110">
                      <User2
                        className="h-4 w-4 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                      {isMultipleLocatarios(contract.form_data.nomeLocatario)
                        ? 'Locatários'
                        : 'Locatário'}
                    </p>
                    <div className="flex items-center gap-2 group/name">
                      <p className="text-sm font-semibold text-neutral-800 truncate leading-tight">
                        {contract.form_data.nomeLocatario}
                      </p>
                      <button
                        onClick={handleLocatarioSearch}
                        className="opacity-0 group-hover/name:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-white/80 rounded-lg hover:scale-110"
                        title="Buscar no JusBrasil"
                        aria-label={`Buscar ${contract.form_data.nomeLocatario} no JusBrasil`}
                      >
                        <Search className="h-3.5 w-3.5 text-purple-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TERMOS DO CONTRATO */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neutral-400 to-neutral-500 rounded-full"></span>
                Termos do Contrato
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-md transition-transform duration-200 hover:scale-110">
                    <CalendarDays
                      className="h-4 w-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-sm font-bold text-neutral-800">
                    {contract.form_data.dataInicioRescisao || '01/09/2026'}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 shadow-md transition-transform duration-200 hover:scale-110">
                    <Clock
                      className="h-4 w-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-sm font-bold text-neutral-800">
                    {contract.form_data.dataTerminoRescisao || '01/10/2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* LOCALIZAÇÃO */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-neutral-400 to-neutral-500 rounded-full"></span>
                Localização
              </h4>
              <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-md flex-shrink-0 transition-transform duration-200 hover:scale-110">
                  <MapPin
                    className="h-4 w-4 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Endereço
                  </p>
                  <p
                    className="text-sm font-semibold text-neutral-800 line-clamp-2 cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200 leading-relaxed"
                    onClick={(e) => {
                      e.stopPropagation();
                      const endereco =
                        contract.form_data.endereco ||
                        contract.form_data.enderecoImovel;
                      if (endereco) {
                        const earthUrl = `https://earth.google.com/web/search/${encodeURIComponent(endereco)}`;
                        window.open(earthUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    title="Clique para abrir no Google Earth"
                  >
                    {contract.form_data.endereco ||
                      contract.form_data.enderecoImovel ||
                      '[ENDEREÇO NÃO INFORMADO]'}
                  </p>
                </div>
              </div>
            </div>

            {/* CONTAS DE CONSUMO */}
            <div className="mb-5 pb-2">
              <ContractBillsSection
                contractId={
                  contract.form_data.numeroContrato || '[NÚMERO NÃO DEFINIDO]'
                }
                formData={contract.form_data}
              />
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="relative overflow-visible pt-5">
              <div className="absolute inset-x-0 top-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="flex items-center justify-center pt-4">
                {/* Aqui seria o QuickActionsDropdown - importando lazy */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    // Placeholder para ações de documento
                    onGenerateDocument(contract, '', 'Documento de Teste');
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Ações do Contrato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ContractCard.displayName = 'ContractCard';