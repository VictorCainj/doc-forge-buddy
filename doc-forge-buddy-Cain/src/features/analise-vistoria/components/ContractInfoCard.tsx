import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from '@/utils/iconMapper';
import { DadosVistoria } from '@/types/vistoria';
import { FixDuplicatesButton } from '@/components/FixDuplicatesButton';
import { useToast } from '@/components/ui/use-toast';

interface Contract {
  id: string;
  form_data: Record<string, string>;
  created_at: string;
  title?: string;
}

interface ContractInfoCardProps {
  selectedContract: Contract | null;
  dadosVistoria: DadosVistoria;
  hasExistingAnalise: boolean;
  loadingExistingAnalise: boolean;
  onReloadImages: () => void;
  onMigration: () => Promise<{ message: string; success: boolean; details?: { instructions?: string } }>;
  savedAnaliseId: string | null;
}

export const ContractInfoCard = ({
  selectedContract,
  dadosVistoria,
  hasExistingAnalise,
  loadingExistingAnalise,
  onReloadImages,
  onMigration,
  savedAnaliseId,
}: ContractInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  if (!selectedContract) return null;

  return (
    <Card className="mb-6 bg-white border-neutral-100 shadow-sm">
      <CardHeader
        className="pb-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg text-neutral-900 font-medium">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span>Contrato Selecionado</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Informações do Contrato
                  </h3>
                </div>
                {loadingExistingAnalise && (
                  <Badge
                    variant="outline"
                    className="border-neutral-300 text-neutral-700"
                  >
                    <div className="h-3 w-3 mr-1 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </Badge>
                )}
                {hasExistingAnalise && !loadingExistingAnalise && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="bg-neutral-600 hover:bg-neutral-700 text-white"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Análise Existente
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onReloadImages}
                      disabled={loadingExistingAnalise}
                      className="text-xs"
                    >
                      {loadingExistingAnalise ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent mr-1" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Recarregar Imagens
                        </>
                      )}
                    </Button>
                    {savedAnaliseId && (
                      <FixDuplicatesButton
                        vistoriaId={savedAnaliseId}
                        onFixed={() => {}}
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs bg-green-100 border-green-300 text-green-800"
                      onClick={async () => {
                        const result = await onMigration();
                        toast({
                          title: 'Migration Resultado',
                          description: result.message,
                          variant: result.success ? 'default' : 'destructive',
                        });
                        if (result.details?.instructions) {
                          console.log('Instruções:', result.details.instructions);
                        }
                      }}
                      title="Executar migration da coluna image_serial"
                    >
                      🔧 Migration
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-neutral-700" />
                    </div>
                    <Label className="text-sm font-semibold text-neutral-900">
                      Locatário
                    </Label>
                  </div>
                  <p className="text-sm bg-white p-3 rounded-lg border border-neutral-200 text-neutral-900 break-words shadow-sm">
                    {dadosVistoria.locatario}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-neutral-700" />
                    </div>
                    <Label className="text-sm font-semibold text-neutral-900">
                      Endereço
                    </Label>
                  </div>
                  <p className="text-sm bg-white p-3 rounded-lg border border-neutral-200 text-neutral-900 break-words shadow-sm">
                    {dadosVistoria.endereco}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-neutral-700" />
                    </div>
                    <Label className="text-sm font-semibold text-neutral-900">
                      Data da Vistoria
                    </Label>
                  </div>
                  <p className="text-sm bg-white p-3 rounded-lg border border-neutral-200 text-neutral-900 shadow-sm">
                    {dadosVistoria.dataVistoria}
                  </p>
                </div>
              </div>

              {hasExistingAnalise && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      <strong className="font-semibold">Atenção:</strong> Já existe uma análise de vistoria para este contrato. Ao salvar, a análise existente será atualizada em vez de criar uma nova.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
