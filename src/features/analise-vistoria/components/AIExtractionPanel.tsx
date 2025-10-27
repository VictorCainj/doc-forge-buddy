import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, X } from '@/utils/iconMapper';

interface AIExtractionPanelProps {
  extractionText: string;
  onTextChange: (text: string) => void;
  onExtract: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const AIExtractionPanel = ({
  extractionText,
  onTextChange,
  onExtract,
  onCancel,
  isLoading,
}: AIExtractionPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-neutral-300 text-neutral-900 hover:bg-neutral-100"
          onClick={() => setIsVisible(true)}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Criar Apontamentos com IA
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 rounded-lg">
      <div className="flex items-start space-x-2">
        <Wand2 className="h-5 w-5 text-neutral-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 mb-1">
            Extração Automática de Apontamentos
          </h4>
          <p className="text-xs text-neutral-600 mb-3">
            Cole o texto completo da vistoria abaixo. A IA processará{' '}
            <strong>TODO o texto integralmente</strong> e identificará
            automaticamente cada ambiente, subtítulo e descrição - sem omitir
            nenhuma informação.
          </p>
          <Textarea
            placeholder={`Exemplo de formato (cole quantos apontamentos precisar):

SALA
Pintar as paredes
estão excessivamente sujas
---------
Reparar e remover manchas do sofá
os encostos não estão travando
---------
COZINHA
Limpar a Air fryer
está suja
---------

✓ Pode colar textos longos
✓ Todos os apontamentos serão processados`}
            value={extractionText}
            onChange={(e) => onTextChange(e.target.value)}
            rows={10}
            className="text-sm bg-white border-neutral-300 focus:border-neutral-500 mb-3 font-mono"
          />
          <div className="flex gap-2">
            <Button
              onClick={onExtract}
              disabled={!extractionText.trim() || isLoading}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Extrair Apontamentos
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                onTextChange('');
                onCancel();
                setIsVisible(false);
              }}
              variant="outline"
              size="sm"
              className="border-neutral-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
