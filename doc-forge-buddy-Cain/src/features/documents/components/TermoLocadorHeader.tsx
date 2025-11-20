import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key } from '@/utils/iconMapper';
import { useAnonymizedData } from '@/hooks/useAnonymizedData';

interface ContractData {
  numeroContrato: string;
  enderecoImovel: string;
}

interface TermoLocadorHeaderProps {
  contractData: ContractData;
}

export const TermoLocadorHeader: React.FC<TermoLocadorHeaderProps> = ({ contractData }) => {
  const navigate = useNavigate();
  const { anonymize } = useAnonymizedData();

  return (
    <div className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/contratos')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-neutral-300"></div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
                  Termo de Entrega de Chaves
                </h1>
                <p className="text-base text-neutral-600">
                  Preencha os dados para gerar o termo do locador
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Contrato */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-100 to-white border border-neutral-200 shadow-sm">
              <div className="w-5 h-5 text-neutral-700">📄</div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900">
                Contrato {contractData.numeroContrato}
              </p>
              <p className="text-xs text-neutral-600">
                {anonymize.address(contractData.enderecoImovel)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
