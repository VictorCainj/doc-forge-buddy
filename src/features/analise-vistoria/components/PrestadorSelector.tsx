import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, AlertCircle, User, Plus } from '@/utils/iconMapper';
import type { Prestador } from '@/hooks/usePrestadores';
import { useNavigate } from 'react-router-dom';

interface PrestadorSelectorProps {
  selectedPrestadorId: string;
  prestadores: Prestador[];
  onSelectPrestador: (id: string) => void;
}

export const PrestadorSelector = ({
  selectedPrestadorId,
  prestadores,
  onSelectPrestador,
}: PrestadorSelectorProps) => {
  const navigate = useNavigate();
  const selectedPrestador = prestadores.find((p) => p.id === selectedPrestadorId);

  return (
    <Card className="mb-6 bg-white border-neutral-200">
      <CardHeader className="pb-4 border-b border-neutral-200">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg text-neutral-900">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600" />
          <span>Selecionar Prestador</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        <div className="space-y-2">
          <Label
            htmlFor="prestador-select"
            className="text-sm font-medium text-neutral-900"
          >
            Prestador de Serviço *
          </Label>
          <Select value={selectedPrestadorId} onValueChange={onSelectPrestador}>
            <SelectTrigger
              id="prestador-select"
              className="bg-white border-neutral-300 text-neutral-900 focus:border-neutral-500"
            >
              <SelectValue placeholder="Selecione um prestador" />
            </SelectTrigger>
            <SelectContent>
              {prestadores.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum prestador cadastrado</p>
                </div>
              ) : (
                prestadores.map((prestador) => (
                  <SelectItem key={prestador.id} value={prestador.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{prestador.nome}</span>
                      {prestador.especialidade && (
                        <span className="text-xs text-neutral-500">
                          {prestador.especialidade}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Informações do Prestador Selecionado */}
        {selectedPrestador && (
          <div className="bg-gradient-to-r from-success-500/20 to-success-600/20 border border-neutral-200 rounded-lg p-4 space-y-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-semibold">
                {selectedPrestador.nome}
              </span>
            </div>
            {selectedPrestador.cnpj && (
              <p className="text-xs text-neutral-500">CNPJ: {selectedPrestador.cnpj}</p>
            )}
            {selectedPrestador.telefone && (
              <p className="text-xs text-neutral-500">Tel: {selectedPrestador.telefone}</p>
            )}
            {selectedPrestador.email && (
              <p className="text-xs text-neutral-500">Email: {selectedPrestador.email}</p>
            )}
          </div>
        )}

        <ActionButton
          icon={Plus}
          label="Cadastrar Novo Prestador"
          variant="secondary"
          size="md"
          className="w-full"
          onClick={() => navigate('/prestadores')}
        />
      </CardContent>
    </Card>
  );
};
