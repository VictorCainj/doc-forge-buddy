import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrivacySettingsAdmin } from '@/hooks/usePrivacySettingsAdmin';
import { Shield, EyeIcon as Eye, EyeOffIcon as EyeOff, Loader2, AlertCircle } from '@/utils/iconMapper';
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

export const PrivacySettings = () => {
  const { settings, isLoading, updatePrivacyMode, isUpdating } =
    usePrivacySettingsAdmin();

  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingValue, setPendingValue] = React.useState<boolean | null>(null);

  const isActive = settings?.anonymize_personal_data ?? false;

  const handleToggle = (newValue: boolean) => {
    setPendingValue(newValue);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (pendingValue !== null) {
      await updatePrivacyMode(pendingValue);
      setShowConfirmDialog(false);
      setPendingValue(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingValue(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Configurações de Privacidade</CardTitle>
                <p className="text-sm text-neutral-600 mt-1">
                  Controle a exibição de dados pessoais em gravações e demonstrações
                </p>
              </div>
            </div>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="text-sm px-3 py-1"
            >
              {isActive ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Privacidade Ativa
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Privacidade Inativa
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Atual */}
          <div className="p-4 rounded-lg border bg-neutral-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Modo de Privacidade
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  {isActive ? (
                    <>
                      Quando ativado, todas as informações pessoais (nomes completos,
                      endereços, documentos) serão anonimizadas em:
                    </>
                  ) : (
                    <>
                      Quando ativado, todas as informações pessoais serão anonimizadas.
                      Atualmente, os dados são exibidos normalmente.
                    </>
                  )}
                </p>
                {isActive && (
                  <>
                    <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1 ml-2 mb-3">
                      <li>Cards de contratos</li>
                      <li>Listas de contratos</li>
                      <li>Documentos gerados</li>
                      <li>Todas as visualizações do sistema</li>
                    </ul>
                    <p className="text-sm font-semibold text-blue-800 bg-blue-50 p-2 rounded border border-blue-200">
                      ⚠️ Importante: Quando ativado, <strong>TODOS os usuários</strong> (incluindo administradores) verão dados anonimizados.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Informações sobre Anonimização */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2">
              Como funciona a anonimização:
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>Nomes:</strong> Mantém apenas o primeiro nome + inicial do
                sobrenome (ex: "João Silva" → "João S.")
              </li>
              <li>
                <strong>Endereços:</strong> Mantém apenas cidade e estado (ex: "Rua
                das Flores, 123, São Paulo - SP" → "São Paulo - SP")
              </li>
              <li>
                <strong>Documentos:</strong> Mantém apenas últimos dígitos (ex: CPF
                "123.456.789-00" → "***.***.***-00")
              </li>
              <li>
                <strong>Telefones:</strong> Mantém apenas últimos dígitos (ex: "(11)
                98765-4321" → "(**) *****-21")
              </li>
            </ul>
          </div>

          {/* Botão de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => handleToggle(!isActive)}
              disabled={isUpdating}
              variant={isActive ? 'outline' : 'default'}
              size="lg"
              className="min-w-[200px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isActive ? 'Desativando...' : 'Ativando...'}
                </>
              ) : isActive ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Desativar Privacidade
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ativar Privacidade
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingValue
                ? 'Ativar Modo de Privacidade?'
                : 'Desativar Modo de Privacidade?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue ? (
                <>
                  Ao ativar o modo de privacidade, todas as informações pessoais serão
                  anonimizadas em todo o sistema. Isso afetará:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Visualização de contratos</li>
                    <li>Documentos gerados</li>
                    <li>Relatórios e exportações</li>
                  </ul>
                  <strong className="mt-2 block text-blue-700">
                    ⚠️ Importante: TODOS os usuários (incluindo administradores) verão dados anonimizados quando esta opção estiver ativa.
                  </strong>
                </>
              ) : (
                <>
                  Ao desativar o modo de privacidade, todas as informações pessoais
                  voltarão a ser exibidas normalmente em todo o sistema.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingValue ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

