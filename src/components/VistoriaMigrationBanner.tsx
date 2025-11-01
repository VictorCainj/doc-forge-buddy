import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ArrowRight, X, Loader2 } from '@/utils/iconMapper';
import { useVistoriaMigrator } from '@/utils/migrateVistoriaData';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/utils/logger';

const VistoriaMigrationBanner = () => {
  const { needsMigration, executeMigration, hasLegacyData } =
    useVistoriaMigrator();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const [isCheckingMigration, setIsCheckingMigration] = useState(true);

  // Verificar se a migração é necessária
  useEffect(() => {
    const checkMigrationNeeded = async () => {
      setIsCheckingMigration(true);
      try {
        const needsMig = await needsMigration();
        setShouldShowBanner(needsMig);
      } catch (error) {
        log.error('Erro ao verificar migração:', error);
        setShouldShowBanner(false);
      } finally {
        setIsCheckingMigration(false);
      }
    };

    checkMigrationNeeded();
  }, [needsMigration]);

  const handleMigration = async () => {
    if (!hasLegacyData()) return;

    setIsMigrating(true);
    try {
      const success = await executeMigration();
      if (success) {
        setIsDismissed(true);
      }
    } catch {
      // Erro na migração - silencioso para não poluir logs
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    toast({
      title: 'Banner ocultado',
      description:
        'Você pode migrar seus dados posteriormente através das configurações.',
    });
  };

  // Não mostrar se está verificando, não precisa de migração ou se foi dispensado
  if (isCheckingMigration || !shouldShowBanner || isDismissed) {
    return null;
  }

  return (
    <Card className="border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/50 rounded-full flex items-center justify-center">
                <Database className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-warning-900 dark:text-warning-100">
                  Migração de Dados Disponível
                </h3>
                <Badge
                  variant="secondary"
                  className="text-xs bg-warning-200 text-warning-800 dark:bg-warning-800 dark:text-warning-200"
                >
                  Importante
                </Badge>
              </div>
              <p className="text-sm text-warning-800 dark:text-warning-200 mb-3">
                Detectamos dados antigos de análises de vistoria no seu
                navegador. Para garantir que seus dados sejam preservados e
                acessíveis em todos os dispositivos, recomendamos migrá-los para
                o novo sistema de armazenamento.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleMigration}
                  disabled={isMigrating}
                  size="sm"
                  className="bg-warning-600 hover:bg-warning-700 text-white"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Migrar Agora
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-warning-700 hover:text-warning-800 hover:bg-warning-100 dark:text-warning-300 dark:hover:text-warning-200 dark:hover:bg-warning-900/30"
                >
                  <X className="h-4 w-4 mr-2" />
                  Mais tarde
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VistoriaMigrationBanner;
