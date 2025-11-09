import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ContractBillsStatus } from '@/components/charts/ContractBillsStatus';
import { FileText, User, User2, MapPin, Key } from '@/utils/iconMapper';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
  dataFirmamentoContrato: string;
  nomeProprietario: string;
  nomeLocatario: string;
  quantidadeChaves?: string;
}

interface TermoLocatarioSidebarProps {
  contractData: ContractData;
}

export const TermoLocatarioSidebar: React.FC<TermoLocatarioSidebarProps> = ({ contractData }) => {
  return (
    <div className="space-y-6">
      {/* Status das Contas de Consumo */}
      <ContractBillsStatus
        contractId={contractData.numeroContrato}
        formData={contractData}
      />

      {/* Informações do Contrato */}
      <Card className="bg-white border-neutral-300 shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="p-2 rounded-lg bg-black"
              style={{
                imageRendering: 'crisp-edges',
                backfaceVisibility: 'hidden',
              }}
            >
              <FileText
                className="h-4 w-4 text-white"
                color="#FFFFFF"
                strokeWidth={2.5}
                style={{
                  color: '#FFFFFF',
                  stroke: '#FFFFFF',
                  fill: 'none',
                  shapeRendering: 'geometricPrecision',
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg text-black">
                Contrato{' '}
                <span className="font-mono text-xl text-primary-600">
                  {contractData.numeroContrato}
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {contractData.dataFirmamentoContrato}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-neutral-300 mb-4"></div>

          {/* PARTES ENVOLVIDAS */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
              Partes Envolvidas
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div
                  className="p-1.5 rounded-md bg-black"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <User
                    className="h-3 w-3 text-white"
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      color: '#FFFFFF',
                      stroke: '#FFFFFF',
                      fill: 'none',
                      shapeRendering: 'geometricPrecision',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black uppercase tracking-wide">
                    Proprietário
                  </p>
                  <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                    {contractData.nomeProprietario}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="p-1.5 rounded-md bg-black"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <User2
                    className="h-3 w-3 text-white"
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      color: '#FFFFFF',
                      stroke: '#FFFFFF',
                      fill: 'none',
                      shapeRendering: 'geometricPrecision',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black uppercase tracking-wide">
                    Locatário
                  </p>
                  <p className="text-sm font-semibold text-gray-600 truncate leading-tight">
                    {contractData.nomeLocatario}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LOCALIZAÇÃO */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
              Localização
            </h4>
            <div className="flex items-start gap-2 p-2 bg-neutral-50 rounded-lg">
              <div
                className="p-1 rounded bg-black"
                style={{
                  imageRendering: 'crisp-edges',
                  backfaceVisibility: 'hidden',
                }}
              >
                <MapPin
                  className="h-3 w-3 text-white"
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  style={{
                    color: '#FFFFFF',
                    stroke: '#FFFFFF',
                    fill: 'none',
                    shapeRendering: 'geometricPrecision',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black uppercase tracking-wide">
                  Endereço
                </p>
                <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                  {contractData.enderecoImovel}
                </p>
              </div>
            </div>
          </div>

          {/* CHAVES */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-black uppercase tracking-wider mb-3">
              Chaves
            </h4>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
              <div
                className="p-1 rounded bg-black"
                style={{
                  imageRendering: 'crisp-edges',
                  backfaceVisibility: 'hidden',
                }}
              >
                <Key
                  className="h-3 w-3 text-white"
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  style={{
                    color: '#FFFFFF',
                    stroke: '#FFFFFF',
                    fill: 'none',
                    shapeRendering: 'geometricPrecision',
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-black uppercase tracking-wide">
                  Quantidade
                </p>
                <p className="text-sm font-semibold text-gray-600">
                  {contractData.quantidadeChaves || 'Não informado'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
