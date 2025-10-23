import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Download,
  X,
  Filter,
} from '@/utils/iconMapper';
import { useCleanupDuplicates } from '@/hooks/useCleanupDuplicates';
import {
  LimitImagesPerApontamento,
  LimitImagesReport,
} from '@/utils/limitImagesPerApontamento';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CleanupDuplicatesPanel() {
  const { toast } = useToast();
  const {
    isLoading,
    report,
    scanDuplicates,
    cleanDuplicates,
    downloadReport,
    clearReport,
  } = useCleanupDuplicates();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<
    'simulate' | 'clean' | 'limit' | 'limit-simulate'
  >('simulate');

  // Estado para limitação de imagens
  const [isLimitLoading, setIsLimitLoading] = useState(false);
  const [limitReport, setLimitReport] = useState<LimitImagesReport | null>(
    null
  );
  const [maxImages, setMaxImages] = useState(4);

  const handleScan = async () => {
    await scanDuplicates();
  };

  const handleSimulate = async () => {
    setActionType('simulate');
    setShowConfirmDialog(true);
  };

  const handleCleanup = async () => {
    setActionType('clean');
    setShowConfirmDialog(true);
  };

  const handleLimitSimulate = async () => {
    setActionType('limit-simulate');
    setShowConfirmDialog(true);
  };

  const handleLimitImages = async () => {
    setActionType('limit');
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);

    if (actionType === 'limit' || actionType === 'limit-simulate') {
      // Limitação de imagens
      setIsLimitLoading(true);
      try {
        const dryRun = actionType === 'limit-simulate';
        const result = await LimitImagesPerApontamento.limitImages(
          undefined,
          dryRun,
          maxImages
        );
        setLimitReport(result);

        if (result.success) {
          toast({
            title: dryRun ? 'Simulação concluída' : 'Limitação concluída',
            description: `${result.totalImagesRemoved} imagens ${dryRun ? 'seriam removidas' : 'foram removidas'} em ${result.duration}s`,
          });
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível processar a limitação',
          variant: 'destructive',
        });
      } finally {
        setIsLimitLoading(false);
      }
    } else {
      // Limpeza de duplicatas
      const dryRun = actionType === 'simulate';
      await cleanDuplicates(undefined, dryRun);
    }
  };

  // Calcular espaço desperdiçado (estimativa: 100KB por imagem)
  const estimatedWastedSpace = report
    ? ((report.totalDuplicatesFound * 100) / 1024).toFixed(1)
    : '0';

  const downloadLimitReport = () => {
    if (!limitReport) return;

    try {
      const jsonString = JSON.stringify(limitReport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `limit-images-report-${timestamp}.json`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);

      toast({
        title: 'Relatório baixado',
        description: 'Arquivo JSON salvo com sucesso',
      });
    } catch {
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível salvar o relatório',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="duplicates">
            <Trash2 className="h-4 w-4 mr-2" />
            Duplicatas
          </TabsTrigger>
          <TabsTrigger value="limit">
            <Filter className="h-4 w-4 mr-2" />
            Limitar Imagens
          </TabsTrigger>
        </TabsList>

        {/* Tab: Limpeza de Duplicatas */}
        <TabsContent value="duplicates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Limpeza de Imagens Duplicadas
              </CardTitle>
              <CardDescription>
                Identifique e remova imagens duplicadas do sistema para otimizar
                o armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avisos */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ATENÇÃO:</strong> A limpeza é uma operação
                  irreversível. Recomendamos fazer backup antes de executar. As
                  imagens originais (mais antigas) serão mantidas.
                </AlertDescription>
              </Alert>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleScan}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isLoading ? 'Escaneando...' : 'Escanear Duplicatas'}
                </Button>

                {report && report.totalDuplicatesFound > 0 && (
                  <>
                    <Button
                      onClick={handleSimulate}
                      disabled={isLoading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Simular Limpeza
                    </Button>

                    <Button
                      onClick={handleCleanup}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar Duplicatas
                    </Button>
                  </>
                )}

                {report && (
                  <Button
                    onClick={clearReport}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Resultados */}
              {report && (
                <div className="space-y-4 mt-6">
                  {/* Estatísticas Principais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        📊 Estatísticas do Escaneamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total de Análises
                          </p>
                          <p className="text-2xl font-bold">
                            {report.totalAnalyses}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total de Imagens
                          </p>
                          <p className="text-2xl font-bold">
                            {report.totalImagesScanned}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Duplicatas Encontradas
                          </p>
                          <p className="text-2xl font-bold text-destructive">
                            {report.totalDuplicatesFound}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Espaço Desperdiçado
                          </p>
                          <p className="text-2xl font-bold">
                            ~{estimatedWastedSpace} MB
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              report.totalDuplicatesFound > 0
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {report.totalDuplicatesFound > 0
                              ? `${report.totalDuplicatesFound} duplicata${report.totalDuplicatesFound !== 1 ? 's' : ''}`
                              : 'Sem duplicatas'}
                          </Badge>

                          <Badge variant="outline">
                            Duração: {report.duration}s
                          </Badge>

                          {report.errors > 0 && (
                            <Badge variant="destructive">
                              {report.errors} erro
                              {report.errors !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <Button
                          onClick={downloadReport}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" />
                          Baixar Relatório JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mensagem de Sucesso */}
                  {report.totalDuplicatesRemoved > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Limpeza concluída!</strong>{' '}
                        {report.totalDuplicatesRemoved} imagens duplicadas foram
                        removidas com sucesso. As imagens originais foram
                        preservadas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Limitar Imagens por Apontamento */}
        <TabsContent value="limit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Limitar Imagens por Apontamento
              </CardTitle>
              <CardDescription>
                Remove imagens excedentes mantendo apenas as primeiras (mais
                antigas) por apontamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avisos */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ATENÇÃO:</strong> Esta operação é irreversível. As
                  imagens excedentes (mais recentes) serão removidas
                  permanentemente.
                </AlertDescription>
              </Alert>

              {/* Configuração */}
              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="maxImages">
                    Máximo de imagens por apontamento
                  </Label>
                  <Input
                    id="maxImages"
                    type="number"
                    min={1}
                    max={20}
                    value={maxImages}
                    onChange={(e) =>
                      setMaxImages(parseInt(e.target.value) || 4)
                    }
                    disabled={isLimitLoading}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    As imagens mais antigas serão preservadas
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleLimitSimulate}
                  disabled={isLimitLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLimitLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isLimitLoading ? 'Processando...' : 'Simular Limitação'}
                </Button>

                <Button
                  onClick={handleLimitImages}
                  disabled={isLimitLoading}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limitar Imagens
                </Button>

                {limitReport && (
                  <Button
                    onClick={() => setLimitReport(null)}
                    disabled={isLimitLoading}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Resultados da Limitação */}
              {limitReport && (
                <div className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        📊 Resultado da Limitação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total de Análises
                          </p>
                          <p className="text-2xl font-bold">
                            {limitReport.totalAnalyses}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Apontamentos Processados
                          </p>
                          <p className="text-2xl font-bold">
                            {limitReport.totalApontamentos}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Imagens Removidas
                          </p>
                          <p className="text-2xl font-bold text-destructive">
                            {limitReport.totalImagesRemoved}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Duração
                          </p>
                          <p className="text-2xl font-bold">
                            {limitReport.duration}s
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Limite: {maxImages} imagens/apontamento
                          </Badge>

                          {limitReport.errors > 0 && (
                            <Badge variant="destructive">
                              {limitReport.errors} erro
                              {limitReport.errors !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <Button
                          onClick={downloadLimitReport}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" />
                          Baixar Relatório JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mensagem de Sucesso */}
                  {limitReport.totalImagesRemoved > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Limitação concluída!</strong>{' '}
                        {limitReport.totalImagesRemoved} imagens foram
                        removidas. As {maxImages} imagens mais antigas de cada
                        apontamento foram preservadas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'simulate'
                ? 'Simular Limpeza de Duplicatas?'
                : actionType === 'clean'
                  ? '⚠️ Confirmar Limpeza Definitiva?'
                  : actionType === 'limit-simulate'
                    ? 'Simular Limitação de Imagens?'
                    : '⚠️ Confirmar Limitação de Imagens?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'simulate' ? (
                <>
                  Esta ação irá <strong>simular</strong> a remoção de{' '}
                  {report?.totalDuplicatesFound} duplicatas sem deletar nenhuma
                  imagem. Você verá o que seria removido.
                </>
              ) : actionType === 'clean' ? (
                <>
                  <strong className="text-destructive">
                    ATENÇÃO: Esta ação é irreversível!
                  </strong>
                  <br />
                  <br />
                  Você está prestes a remover permanentemente{' '}
                  {report?.totalDuplicatesFound} imagens duplicadas. As imagens
                  originais (mais antigas) serão mantidas.
                  <br />
                  <br />
                  Recomendamos fazer backup antes de continuar.
                </>
              ) : actionType === 'limit-simulate' ? (
                <>
                  Esta ação irá <strong>simular</strong> a limitação de imagens
                  por apontamento a <strong>{maxImages} imagens</strong>. Você
                  verá quantas imagens seriam removidas.
                </>
              ) : (
                <>
                  <strong className="text-destructive">
                    ATENÇÃO: Esta ação é irreversível!
                  </strong>
                  <br />
                  <br />
                  Você está prestes a limitar cada apontamento a{' '}
                  <strong>{maxImages} imagens</strong>. As imagens excedentes
                  (mais recentes) serão removidas permanentemente.
                  <br />
                  <br />
                  As <strong>{maxImages} primeiras imagens</strong> (mais
                  antigas) de cada apontamento serão preservadas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                actionType === 'clean' || actionType === 'limit'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : ''
              }
            >
              {actionType === 'simulate'
                ? 'Simular'
                : actionType === 'clean'
                  ? 'Confirmar Limpeza'
                  : actionType === 'limit-simulate'
                    ? 'Simular'
                    : 'Confirmar Limitação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
