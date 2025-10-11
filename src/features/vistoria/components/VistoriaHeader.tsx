import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Calculator
} from '@/utils/iconMapper';

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
}

interface DadosVistoria {
  locatario: string;
  endereco: string;
  dataVistoria: string;
}

interface VistoriaHeaderProps {
  contracts: Contract[];
  selectedContract: Contract | null;
  searchTerm: string;
  dadosVistoria: DadosVistoria;
  showDadosVistoria: boolean;
  hasExistingAnalise: boolean;
  loadingExistingAnalise: boolean;
  documentMode: 'analise' | 'orcamento';
  onSearchChange: (value: string) => void;
  onContractSelect: (contract: Contract) => void;
  onDadosVistoriaChange: (dados: DadosVistoria) => void;
  onToggleDadosVistoria: () => void;
  onForceReloadImages: () => void;
  onDocumentModeChange: (mode: 'analise' | 'orcamento') => void;
}

const VistoriaHeader = memo(({
  contracts,
  selectedContract,
  searchTerm,
  dadosVistoria,
  showDadosVistoria,
  hasExistingAnalise,
  loadingExistingAnalise,
  documentMode,
  onSearchChange,
  onContractSelect,
  onDadosVistoriaChange,
  onToggleDadosVistoria,
  onForceReloadImages,
  onDocumentModeChange,
}: VistoriaHeaderProps) => {
  const filteredContracts = contracts.filter((contract) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const numeroContrato = contract.form_data.numeroContrato?.toLowerCase() || '';
    const nomeLocatario = contract.form_data.nomeLocatario?.toLowerCase() || '';
    const enderecoImovel = contract.form_data.enderecoImovel?.toLowerCase() || '';
    
    return (
      numeroContrato.includes(searchLower) ||
      nomeLocatario.includes(searchLower) ||
      enderecoImovel.includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Seleção de Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5" />
              <span>Selecionar Contrato</span>
            </div>
            {selectedContract && (
              <Badge variant={hasExistingAnalise ? 'default' : 'secondary'}>
                {hasExistingAnalise ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Análise Existente</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Nova Análise</>
                )}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca de Contrato */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, locatário ou endereço..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Contratos */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => onContractSelect(contract)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedContract?.id === contract.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Contrato {contract.form_data.numeroContrato}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contract.form_data.nomeLocatario}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contract.form_data.enderecoImovel}
                    </p>
                  </div>
                  {selectedContract?.id === contract.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botão de Recarregar Imagens */}
          {hasExistingAnalise && (
            <Button
              onClick={onForceReloadImages}
              variant="outline"
              className="w-full"
              disabled={loadingExistingAnalise}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingExistingAnalise ? 'animate-spin' : ''}`} />
              Recarregar Imagens da Análise
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modo do Documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Modo do Documento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={documentMode} onValueChange={onDocumentModeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analise">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Análise Comparativa</span>
                </div>
              </SelectItem>
              <SelectItem value="orcamento">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Orçamento de Reparos</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dados da Vistoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5" />
              <span>Dados da Vistoria</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDadosVistoria}
            >
              {showDadosVistoria ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showDadosVistoria && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="locatario">Número do Contrato</Label>
              <Input
                id="locatario"
                value={dadosVistoria.locatario}
                onChange={(e) => onDadosVistoriaChange({ ...dadosVistoria, locatario: e.target.value })}
                placeholder="Ex: 13734"
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço do Imóvel</Label>
              <Input
                id="endereco"
                value={dadosVistoria.endereco}
                onChange={(e) => onDadosVistoriaChange({ ...dadosVistoria, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div>
              <Label htmlFor="dataVistoria">Data da Vistoria</Label>
              <Input
                id="dataVistoria"
                value={dadosVistoria.dataVistoria}
                onChange={(e) => onDadosVistoriaChange({ ...dadosVistoria, dataVistoria: e.target.value })}
                placeholder="DD/MM/AAAA"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
});

VistoriaHeader.displayName = 'VistoriaHeader';

export default VistoriaHeader;
