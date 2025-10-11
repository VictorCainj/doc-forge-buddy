import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contract, VistoriaType, PersonType } from '@/types/contract';
import { splitNames } from '@/utils/nameHelpers';

interface ContractModalsProps {
  // Modal states
  modals: {
    agendamento: boolean;
    recusaAssinatura: boolean;
    whatsapp: boolean;
    assinante: boolean;
    statusVistoria: boolean;
  };

  // Contract data
  selectedContract: Contract | null;
  pendingDocument: {
    contract: Contract | null;
    template: string;
    documentType: string;
  } | null;

  // Form data
  formData: {
    dataVistoria: string;
    horaVistoria: string;
    tipoVistoria: VistoriaType;
    tipoVistoriaRecusa: VistoriaType;
    dataRealizacaoVistoria: string;
    whatsAppType: PersonType | null;
    selectedPerson: string;
    assinanteSelecionado: string;
    statusVistoria: 'APROVADA' | 'REPROVADA';
  };

  // Handlers
  onFormDataChange: (key: string, value: any) => void;
  onCloseModal: (modal: keyof ContractModalsProps['modals']) => void;
  onGenerateAgendamento: () => void;
  onGenerateRecusaAssinatura: () => void;
  onGenerateWhatsApp: () => void;
  onGenerateWithAssinante: () => void;
  onGenerateStatusVistoria: () => void;
}

/**
 * Componente agregador de todos os modais de contratos
 * Centraliza a lógica de modais em um único local
 */
export const ContractModals = memo<ContractModalsProps>(
  ({
    modals,
    selectedContract,
    pendingDocument,
    formData,
    onFormDataChange,
    onCloseModal,
    onGenerateAgendamento,
    onGenerateRecusaAssinatura,
    onGenerateWhatsApp,
    onGenerateWithAssinante,
    onGenerateStatusVistoria,
  }) => {
    return (
      <>
        {/* Modal de Agendamento */}
        <Dialog
          open={modals.agendamento}
          onOpenChange={(open) => !open && onCloseModal('agendamento')}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar Vistoria</DialogTitle>
              <DialogDescription>
                Preencha a data e hora da vistoria para gerar a notificação.
                Contrato: {selectedContract?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipoVistoria" className="text-right">
                  Tipo de Vistoria
                </Label>
                <Select
                  value={formData.tipoVistoria}
                  onValueChange={(value) =>
                    onFormDataChange('tipoVistoria', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo de vistoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="final">Vistoria Final</SelectItem>
                    <SelectItem value="revistoria">Revistoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dataVistoria" className="text-right">
                  Data da Vistoria
                </Label>
                <Input
                  id="dataVistoria"
                  type="date"
                  value={formData.dataVistoria}
                  onChange={(e) =>
                    onFormDataChange('dataVistoria', e.target.value)
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="horaVistoria" className="text-right">
                  Hora da Vistoria
                </Label>
                <Input
                  id="horaVistoria"
                  type="time"
                  value={formData.horaVistoria}
                  onChange={(e) =>
                    onFormDataChange('horaVistoria', e.target.value)
                  }
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onCloseModal('agendamento')}
              >
                Cancelar
              </Button>
              <Button onClick={onGenerateAgendamento}>Gerar Notificação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Recusa de Assinatura */}
        <Dialog
          open={modals.recusaAssinatura}
          onOpenChange={(open) => !open && onCloseModal('recusaAssinatura')}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Termo de Recusa de Assinatura - E-mail</DialogTitle>
              <DialogDescription>
                Preencha a data da vistoria/revistoria e selecione quem vai
                assinar o documento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipoVistoriaRecusa" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={formData.tipoVistoriaRecusa}
                  onValueChange={(value) =>
                    onFormDataChange('tipoVistoriaRecusa', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vistoria">Vistoria</SelectItem>
                    <SelectItem value="revistoria">Revistoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dataRealizacaoVistoria" className="text-right">
                  Data da{' '}
                  {formData.tipoVistoriaRecusa === 'revistoria'
                    ? 'Revistoria'
                    : 'Vistoria'}
                </Label>
                <Input
                  id="dataRealizacaoVistoria"
                  type="text"
                  value={formData.dataRealizacaoVistoria}
                  onChange={(e) =>
                    onFormDataChange('dataRealizacaoVistoria', e.target.value)
                  }
                  className="col-span-3"
                  placeholder="Ex: 19 de setembro de 2025"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assinanteSelecionado" className="text-right">
                  Assinante
                </Label>
                <Select
                  value={formData.assinanteSelecionado}
                  onValueChange={(value) =>
                    onFormDataChange('assinanteSelecionado', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione quem irá assinar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VICTOR CAIN JORGE">
                      Victor Cain Jorge
                    </SelectItem>
                    <SelectItem value="FABIANA SALOTTI MARTINS">
                      Fabiana Salotti Martins
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onCloseModal('recusaAssinatura')}
              >
                Cancelar
              </Button>
              <Button onClick={onGenerateRecusaAssinatura}>
                Gerar Documento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Status Vistoria */}
        <Dialog
          open={modals.statusVistoria}
          onOpenChange={(open) => !open && onCloseModal('statusVistoria')}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Status da Vistoria</DialogTitle>
              <DialogDescription>
                Informe o resultado da vistoria para o contrato:{' '}
                {selectedContract?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status-vistoria">Status da Vistoria</Label>
                <Select
                  value={formData.statusVistoria}
                  onValueChange={(value: 'APROVADA' | 'REPROVADA') =>
                    onFormDataChange('statusVistoria', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APROVADA">Aprovada</SelectItem>
                    <SelectItem value="REPROVADA">Reprovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assinante-status">Assinante</Label>
                <Select
                  value={formData.assinanteSelecionado}
                  onValueChange={(value) =>
                    onFormDataChange('assinanteSelecionado', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o assinante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Victor Cain Jorge">
                      Victor Cain Jorge
                    </SelectItem>
                    <SelectItem value="Fabiana Salotti Martins">
                      Fabiana Salotti Martins
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onCloseModal('statusVistoria')}
              >
                Cancelar
              </Button>
              <Button
                onClick={onGenerateStatusVistoria}
                disabled={!formData.assinanteSelecionado}
              >
                Gerar Mensagem
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de WhatsApp */}
        <Dialog
          open={modals.whatsapp}
          onOpenChange={(open) => !open && onCloseModal('whatsapp')}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Selecionar Pessoa para WhatsApp</DialogTitle>
              <DialogDescription>
                Selecione para qual{' '}
                {formData.whatsAppType === 'locador' ? 'locador' : 'locatário'}{' '}
                você deseja enviar a mensagem do WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="selectedPerson" className="text-right">
                  {formData.whatsAppType === 'locador'
                    ? 'Locador'
                    : 'Locatário'}
                </Label>
                <Select
                  value={formData.selectedPerson}
                  onValueChange={(value) =>
                    onFormDataChange('selectedPerson', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={`Selecione um ${formData.whatsAppType === 'locador' ? 'locador' : 'locatário'}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.whatsAppType === 'locador'
                      ? (() => {
                          const nomesLocadores =
                            selectedContract?.form_data
                              .nomesResumidosLocadores ||
                            selectedContract?.form_data.nomeProprietario;
                          if (nomesLocadores) {
                            const nomesArray = splitNames(nomesLocadores);
                            return nomesArray.map((nome, index) => (
                              <SelectItem key={index} value={nome}>
                                {nome}
                              </SelectItem>
                            ));
                          }
                          return (
                            <SelectItem
                              value="Nenhum locador encontrado"
                              disabled
                            >
                              Nenhum locador encontrado
                            </SelectItem>
                          );
                        })()
                      : (() => {
                          const nomesLocatarios =
                            selectedContract?.form_data.nomeLocatario ||
                            selectedContract?.form_data.primeiroLocatario;
                          if (nomesLocatarios) {
                            const nomesArray = splitNames(nomesLocatarios);
                            return nomesArray.map((nome, index) => (
                              <SelectItem key={index} value={nome}>
                                {nome}
                              </SelectItem>
                            ));
                          }
                          return (
                            <SelectItem
                              value="Nenhum locatário encontrado"
                              disabled
                            >
                              Nenhum locatário encontrado
                            </SelectItem>
                          );
                        })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assinanteSelecionado" className="text-right">
                  Assinante
                </Label>
                <Select
                  value={formData.assinanteSelecionado}
                  onValueChange={(value) =>
                    onFormDataChange('assinanteSelecionado', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione quem irá assinar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VICTOR CAIN JORGE">
                      Victor Cain Jorge
                    </SelectItem>
                    <SelectItem value="FABIANA SALOTTI MARTINS">
                      Fabiana Salotti Martins
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onCloseModal('whatsapp')}
              >
                Cancelar
              </Button>
              <Button
                onClick={onGenerateWhatsApp}
                disabled={
                  !formData.selectedPerson || !formData.assinanteSelecionado
                }
              >
                Gerar WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Seleção de Assinante */}
        <Dialog
          open={modals.assinante}
          onOpenChange={(open) => !open && onCloseModal('assinante')}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Selecionar Assinante do Documento</DialogTitle>
              <DialogDescription>
                Selecione quem irá assinar o documento:{' '}
                {pendingDocument?.documentType}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assinanteSelecionado" className="text-right">
                  Assinante
                </Label>
                <Select
                  value={formData.assinanteSelecionado}
                  onValueChange={(value) =>
                    onFormDataChange('assinanteSelecionado', value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione quem irá assinar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VICTOR CAIN JORGE">
                      Victor Cain Jorge
                    </SelectItem>
                    <SelectItem value="FABIANA SALOTTI MARTINS">
                      Fabiana Salotti Martins
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onCloseModal('assinante')}
              >
                Cancelar
              </Button>
              <Button
                onClick={onGenerateWithAssinante}
                disabled={!formData.assinanteSelecionado}
              >
                Gerar Documento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

ContractModals.displayName = 'ContractModals';
