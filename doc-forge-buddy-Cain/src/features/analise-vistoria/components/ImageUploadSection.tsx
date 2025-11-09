import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Upload,
  ImageIcon,
  Trash2,
  Copy,
} from '@/utils/iconMapper';
import { Textarea } from '@/components/ui/textarea';
import { validateImages } from '@/utils/imageValidation';
import { getSimplifiedSerial } from '@/utils/imageSerialGenerator';
import { useToast } from '@/components/ui/use-toast';
import { BudgetItemType } from '@/types/orcamento';

interface ImageFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  base64?: string;
  isFromDatabase?: boolean;
  isExternal?: boolean;
  url?: string;
  image_serial?: string;
}

interface ImageUploadSectionProps {
  currentApontamento: Partial<{
    tipo?: BudgetItemType;
    valor?: number;
    quantidade?: number;
    ambiente: string;
    subtitulo: string;
    descricao: string;
    descricaoServico: string;
    vistoriaInicial: {
      fotos: (File | ImageFile)[];
      descritivoLaudo: string;
    };
    vistoriaFinal: {
      fotos: (File | ImageFile)[];
    };
    observacao: string;
    classificacao?: 'responsabilidade' | 'revisao';
  }>;
  setCurrentApontamento: (apontamento: any) => void;
  documentMode: 'analise' | 'orcamento';
  showExternalUrlInput: boolean;
  setShowExternalUrlInput: (show: boolean) => void;
  externalImageUrl: string;
  setExternalImageUrl: (url: string) => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  currentApontamento,
  setCurrentApontamento,
  documentMode,
  showExternalUrlInput,
  setShowExternalUrlInput,
  externalImageUrl,
  setExternalImageUrl,
}) => {
  const { toast } = useToast();

  const handleFileUpload = async (
    files: FileList | null,
    tipo: 'inicial' | 'final'
  ) => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Validar imagens
    const validationResults = await validateImages(fileArray, {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxWidth: 4096,
      maxHeight: 4096,
    });

    const validFiles: File[] = [];
    let hasErrors = false;

    validationResults.forEach((result, file) => {
      if (result.valid) {
        validFiles.push(file);

        // Mostrar avisos se houver
        if (result.warnings) {
          result.warnings.forEach((warning) => {
            toast({
              title: 'Aviso',
              description: `${file.name}: ${warning}`,
              variant: 'default',
            });
          });
        }
      } else {
        hasErrors = true;
        toast({
          title: 'Imagem inválida',
          description: `${file.name}: ${result.error}`,
          variant: 'destructive',
        });
      }
    });

    if (validFiles.length === 0 && hasErrors) {
      return;
    }

    setCurrentApontamento((prev) => ({
      ...prev,
      [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
        fotos: [
          ...(prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]
            ?.fotos || []),
          ...validFiles,
        ],
      },
    }));

    if (validFiles.length > 0) {
      toast({
        title: 'Imagens adicionadas',
        description: `${validFiles.length} imagem(ns) adicionada(s) com sucesso.`,
      });
    }
  };

  // Função para remover uma foto específica da vistoria inicial
  const handleRemoveFotoInicial = useCallback(
    (index: number) => {
      setCurrentApontamento((prev) => ({
        ...prev,
        vistoriaInicial: {
          ...prev.vistoriaInicial,
          fotos:
            prev.vistoriaInicial?.fotos?.filter((_, i) => i !== index) || [],
        },
      }));
      toast({
        title: 'Foto removida',
        description: 'A foto foi removida da vistoria inicial.',
      });
    },
    [toast, setCurrentApontamento]
  );

  // Função para remover uma foto específica da vistoria final
  const handleRemoveFotoFinal = useCallback(
    (index: number) => {
      setCurrentApontamento((prev) => ({
        ...prev,
        vistoriaFinal: {
          ...prev.vistoriaFinal,
          fotos: prev.vistoriaFinal?.fotos?.filter((_, i) => i !== index) || [],
        },
      }));
      toast({
        title: 'Foto removida',
        description: 'A foto foi removida da vistoria final.',
      });
    },
    [toast, setCurrentApontamento]
  );

  // Função para adicionar imagem externa
  const handleAddExternalImage = useCallback(() => {
    if (!externalImageUrl.trim()) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida.',
        variant: 'destructive',
      });
      return;
    }

    // Validar se é uma URL válida
    try {
      new URL(externalImageUrl);
    } catch {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida.',
        variant: 'destructive',
      });
      return;
    }

    // Criar um objeto que simula um File mas com URL externa
    const externalImage = {
      name: `Imagem Externa - ${new Date().toLocaleString()}`,
      size: 0,
      type: 'image/external',
      isExternal: true,
      url: externalImageUrl,
      lastModified: Date.now(),
    };

    setCurrentApontamento((prev) => ({
      ...prev,
      vistoriaFinal: {
        ...prev.vistoriaFinal,
        fotos: [...(prev.vistoriaFinal?.fotos || []), externalImage],
      },
    }));

    setExternalImageUrl('');
    setShowExternalUrlInput(false);

    toast({
      title: 'Imagem externa adicionada',
      description: 'A imagem externa foi adicionada com sucesso.',
    });
  }, [externalImageUrl, toast, setCurrentApontamento, setExternalImageUrl, setShowExternalUrlInput]);

  // Função para lidar com Ctrl+V (colar imagens)
  const handlePaste = (event: ClipboardEvent, tipo: 'inicial' | 'final') => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      setCurrentApontamento((prev) => ({
        ...prev,
        [`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]: {
          fotos: [
            ...(prev[`vistoria${tipo === 'inicial' ? 'Inicial' : 'Final'}`]
              ?.fotos || []),
            ...files,
          ],
        },
      }));
      toast({
        title: 'Imagem colada',
        description: `${files.length} imagem(ns) colada(s) com sucesso.`,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Vistoria Inicial */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center space-x-2 text-neutral-900 bg-neutral-100 p-2 rounded-lg border border-neutral-200">
          <ImageIcon className="h-4 w-4 text-neutral-600" />
          <span>Vistoria Inicial</span>
        </h3>
        <div
          className="border-2 border-dashed border-neutral-200 rounded-lg p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          onPaste={(e) => handlePaste(e.nativeEvent, 'inicial')}
          tabIndex={0}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-100 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-neutral-600 dark:text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900">
                Cole imagens com Ctrl+V
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Estado inicial do ambiente
              </p>
            </div>
          </div>
          {currentApontamento.vistoriaInicial?.fotos &&
            currentApontamento.vistoriaInicial.fotos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentApontamento.vistoriaInicial.fotos.map(
                  (foto, index) => (
                    <div key={index} className="relative group">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-neutral-100 dark:bg-neutral-100 text-neutral-900 dark:text-neutral-600 border-neutral-200 dark:border-neutral-200 pr-6"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {foto.name}
                        {foto.isFromDatabase && (
                          <span className="ml-1 text-xs opacity-70">
                            (DB)
                          </span>
                        )}
                        {foto.image_serial && (
                          <span className="ml-1 text-xs font-bold bg-blue-100 text-blue-800 px-1 rounded">
                            {getSimplifiedSerial(foto.image_serial)}
                          </span>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFotoInicial(index)}
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <Trash2 className="h-2 w-2" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
        </div>

        {/* Descritivo do Laudo de Entrada */}
        <div className="space-y-2">
          <Label
            htmlFor="descritivoLaudo"
            className="text-sm font-medium flex items-center space-x-2 text-neutral-900"
          >
            <ImageIcon className="h-4 w-4 text-neutral-600" />
            <span>Descritivo do Laudo de Entrada (Opcional)</span>
          </Label>
          <Textarea
            id="descritivoLaudo"
            placeholder="Ex: Laudo técnico indicando estado inicial do ambiente..."
            value={
              currentApontamento.vistoriaInicial?.descritivoLaudo || ''
            }
            onChange={(e) =>
              setCurrentApontamento((prev) => ({
                ...prev,
                vistoriaInicial: {
                  ...prev.vistoriaInicial,
                  fotos: prev.vistoriaInicial?.fotos || [],
                  descritivoLaudo: e.target.value,
                },
              }))
            }
            rows={2}
            className="text-sm bg-white border-neutral-300"
          />
        </div>
      </div>

      <Separator className="bg-neutral-200" />

      {/* Vistoria Final */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center space-x-2 text-neutral-900 bg-neutral-100 p-2 rounded-lg border border-neutral-200">
            <ImageIcon className="h-4 w-4 text-neutral-600" />
            <span>Vistoria Final</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setShowExternalUrlInput(!showExternalUrlInput)
            }
            className="text-xs h-7 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            Link Externo
          </Button>
        </div>

        {/* Input para URL externa */}
        {showExternalUrlInput && (
          <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <Label className="text-xs font-medium text-neutral-900">
              URL da Imagem Externa
            </Label>
            <div className="flex space-x-2">
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={externalImageUrl}
                onChange={(e) => setExternalImageUrl(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                onClick={handleAddExternalImage}
                size="sm"
                className="h-8 px-3 text-xs"
              >
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowExternalUrlInput(false);
                  setExternalImageUrl('');
                }}
                size="sm"
                className="h-8 px-3 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div
          className="border-2 border-dashed border-neutral-200 rounded-lg p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          onPaste={(e) => handlePaste(e.nativeEvent, 'final')}
          tabIndex={0}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-100 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-neutral-600 dark:text-neutral-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900">
                Cole imagens com Ctrl+V
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Estado atual do ambiente
              </p>
            </div>
          </div>
          {currentApontamento.vistoriaFinal?.fotos &&
            currentApontamento.vistoriaFinal.fotos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentApontamento.vistoriaFinal.fotos.map(
                  (foto, index) => (
                    <div key={index} className="relative group">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-neutral-100 dark:bg-neutral-100 text-neutral-900 dark:text-neutral-900 border-neutral-200 pr-6"
                      >
                        {foto.isExternal ? (
                          <Copy className="h-3 w-3 mr-1" />
                        ) : (
                          <ImageIcon className="h-3 w-3 mr-1" />
                        )}
                        {foto.name}
                        {foto.isFromDatabase && (
                          <span className="ml-1 text-xs opacity-70">
                            (DB)
                          </span>
                        )}
                        {foto.isExternal && (
                          <span className="ml-1 text-xs opacity-70">
                            (Link)
                          </span>
                        )}
                        {foto.image_serial && (
                          <span className="ml-1 text-xs font-bold bg-blue-100 text-blue-800 px-1 rounded">
                            {getSimplifiedSerial(foto.image_serial)}
                          </span>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFotoFinal(index)}
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <Trash2 className="h-2 w-2" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};