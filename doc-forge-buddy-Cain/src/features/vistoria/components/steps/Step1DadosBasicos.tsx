import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, FileText, User } from '@/utils/iconMapper';
import { VistoriaWizardData } from '../../hooks/useVistoriaWizard';

interface Step1Props {
  data: VistoriaWizardData;
  updateData: (data: Partial<VistoriaWizardData>) => void;
  errors: Record<string, string>;
}

/**
 * Step 1: Dados Básicos da Vistoria
 * - Contrato
 * - Data da vistoria
 * - Tipo (inicial/final)
 * - Responsável
 */
export const Step1DadosBasicos: React.FC<Step1Props> = ({
  data,
  updateData,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-600" />
          Dados Básicos da Vistoria
        </h2>
        <p className="text-neutral-600 mt-1">
          Informe os dados iniciais para começar a análise de vistoria
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contrato */}
        <div className="space-y-2">
          <Label htmlFor="contrato">
            Contrato <span className="text-error-500">*</span>
          </Label>
          <Select
            value={data.contratoId}
            onValueChange={(value) => updateData({ contratoId: value })}
          >
            <SelectTrigger id="contrato">
              <SelectValue placeholder="Selecione um contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Contrato #13734 - João Silva</SelectItem>
              <SelectItem value="2">Contrato #13735 - Maria Santos</SelectItem>
              <SelectItem value="3">Contrato #13736 - Pedro Costa</SelectItem>
            </SelectContent>
          </Select>
          {errors.contratoId && (
            <p className="text-sm text-error-500">{errors.contratoId}</p>
          )}
        </div>

        {/* Data da Vistoria */}
        <div className="space-y-2">
          <Label htmlFor="dataVistoria">
            Data da Vistoria <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              id="dataVistoria"
              type="date"
              value={data.dataVistoria || ''}
              onChange={(e) => updateData({ dataVistoria: e.target.value })}
              className="pl-10"
            />
          </div>
          {errors.dataVistoria && (
            <p className="text-sm text-error-500">{errors.dataVistoria}</p>
          )}
        </div>

        {/* Tipo de Vistoria */}
        <div className="space-y-2">
          <Label htmlFor="tipoVistoria">
            Tipo de Vistoria <span className="text-error-500">*</span>
          </Label>
          <Select
            value={data.tipoVistoria}
            onValueChange={(value: any) => updateData({ tipoVistoria: value })}
          >
            <SelectTrigger id="tipoVistoria">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inicial">Vistoria Inicial</SelectItem>
              <SelectItem value="final">Vistoria Final</SelectItem>
              <SelectItem value="vistoria">Vistoria</SelectItem>
              <SelectItem value="revistoria">Revistoria</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipoVistoria && (
            <p className="text-sm text-error-500">{errors.tipoVistoria}</p>
          )}
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável (Opcional)</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              id="responsavel"
              type="text"
              value={data.responsavel || ''}
              onChange={(e) => updateData({ responsavel: e.target.value })}
              placeholder="Nome do responsável pela vistoria"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex gap-3">
          <FileText className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-800">
            <p className="font-semibold mb-1">Dica:</p>
            <p>
              Certifique-se de selecionar o contrato correto antes de
              prosseguir. Os dados do contrato serão utilizados ao longo de toda
              a vistoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
