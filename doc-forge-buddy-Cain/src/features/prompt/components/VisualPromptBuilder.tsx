/**
 * Construtor Visual de Prompts com Drag & Drop
 */

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings,
  Copy,
  Download,
  Wand2,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  BookOpen,
  Target,
  Clock,
  Hash } from '@/lib/icons';
import { usePromptEnhancer } from '../hooks/usePromptEnhancer';
import { usePromptLearning } from '../hooks/usePromptLearning';
import type { PromptBlock, VisualPromptBuilder, DragDropAction, ValidationResult } from '../types/prompt';

// Componente de bloco individual
const PromptBlockComponent = ({ 
  block, 
  index, 
  onUpdate, 
  onDelete, 
  isDragging 
}: {
  block: PromptBlock;
  index: number;
  onUpdate: (id: string, updates: Partial<PromptBlock>) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'instruction': return Target;
      case 'context': return Info;
      case 'example': return BookOpen;
      case 'constraint': return AlertCircle;
      case 'output_format': return Settings;
      case 'variable': return Hash;
      default: return Target;
    }
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'instruction': return 'border-blue-200 bg-blue-50';
      case 'context': return 'border-green-200 bg-green-50';
      case 'example': return 'border-purple-200 bg-purple-50';
      case 'constraint': return 'border-orange-200 bg-orange-50';
      case 'output_format': return 'border-pink-200 bg-pink-50';
      case 'variable': return 'border-indigo-200 bg-indigo-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleSave = () => {
    onUpdate(block.id, { content: editContent });
    setIsEditing(false);
  };

  const Icon = getBlockIcon(block.type);

  return (
    <div 
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 cursor-move
        ${isDragging ? 'opacity-50' : ''}
        ${getBlockColor(block.type)}
        ${block.isRequired ? 'ring-2 ring-yellow-400' : ''}
      `}
      draggable
      data-block-id={block.id}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Icon className="h-4 w-4" />
          <span className="font-medium capitalize text-sm">
            {block.type.replace('_', ' ')}
          </span>
          {block.isRequired && (
            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <CheckCircle className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder={`Digite o conteúdo do ${block.type}...`}
            className="min-h-[80px]"
          />
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleSave}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">
          {block.content || `Adicione conteúdo para ${block.type}...`}
        </p>
      )}
    </div>
  );
};

// Componente da biblioteca de blocos
const BlockLibrary = ({ onAddBlock }: { onAddBlock: (type: string) => void }) => {
  const blockTypes = [
    {
      type: 'instruction',
      title: 'Instrução',
      description: 'Comandos principais do que você quer que a IA faça',
      icon: Target,
      color: 'border-blue-200 hover:bg-blue-50'
    },
    {
      type: 'context',
      title: 'Contexto',
      description: 'Informações de fundo relevantes para a tarefa',
      icon: Info,
      color: 'border-green-200 hover:bg-green-50'
    },
    {
      type: 'example',
      title: 'Exemplo',
      description: 'Casos de uso ou exemplos do que você espera',
      icon: BookOpen,
      color: 'border-purple-200 hover:bg-purple-50'
    },
    {
      type: 'constraint',
      title: 'Restrição',
      description: 'Limitações ou condições específicas',
      icon: AlertCircle,
      color: 'border-orange-200 hover:bg-orange-50'
    },
    {
      type: 'output_format',
      title: 'Formato de Saída',
      description: 'Como você quer que a resposta seja estruturada',
      icon: Settings,
      color: 'border-pink-200 hover:bg-pink-50'
    },
    {
      type: 'variable',
      title: 'Variável',
      description: 'Valores que podem ser personalizáveis',
      icon: Hash,
      color: 'border-indigo-200 hover:bg-indigo-50'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Biblioteca de Blocos</CardTitle>
        <CardDescription>
          Arraste os blocos para o construtor ou clique para adicionar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {blockTypes.map((blockType) => {
          const Icon = blockType.icon;
          return (
            <div
              key={blockType.type}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${blockType.color}`}
              onClick={() => onAddBlock(blockType.type)}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{blockType.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {blockType.description}
                  </p>
                </div>
                <Plus className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Componente de validação
const ValidationPanel = ({ validation }: { validation: ValidationResult }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return AlertCircle;
      case 'medium': return Info;
      case 'low': return CheckCircle;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5" />
          <span>Validação Inteligente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score geral */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {Math.round(validation.score * 100)}%
          </div>
          <p className="text-sm text-muted-foreground">Score de Qualidade</p>
        </div>

        <Separator />

        {/* Issues */}
        {validation.issues && validation.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Problemas Identificados</h4>
            {validation.issues.map((issue, index) => {
              const Icon = getSeverityIcon(issue.severity);
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start space-x-2">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-xs mt-1 opacity-80">
                          Sugestão: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Melhorias */}
        {validation.improvements && validation.improvements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Sugestões de Melhoria</h4>
            <ul className="space-y-1">
              {validation.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <Lightbulb className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente principal do Construtor Visual
export const VisualPromptBuilder = () => {
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { enhancedPrompt, enhance } = usePromptEnhancer();
  const { analyzePrompt } = usePromptLearning();

  // Adicionar novo bloco
  const addBlock = useCallback((type: string) => {
    const newBlock: PromptBlock = {
      id: crypto.randomUUID(),
      type: type as any,
      content: '',
      order: blocks.length,
      isRequired: type === 'instruction'
    };
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks.length]);

  // Atualizar bloco
  const updateBlock = useCallback((id: string, updates: Partial<PromptBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  // Deletar bloco
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  }, []);

  // Reordenar blocos (drag & drop)
  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedBlockId) return;

    setBlocks(prev => {
      const draggedIndex = prev.findIndex(block => block.id === draggedBlockId);
      if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

      const newBlocks = [...prev];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, draggedBlock);

      // Atualizar ordem
      return newBlocks.map((block, index) => ({ ...block, order: index }));
    });

    setDraggedBlockId(null);
  }, [draggedBlockId]);

  // Gerar prompt final
  const generatedPrompt = useMemo(() => {
    const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    
    return orderedBlocks
      .map(block => {
        switch (block.type) {
          case 'instruction':
            return `**Instrução:** ${block.content}`;
          case 'context':
            return `**Contexto:** ${block.content}`;
          case 'example':
            return `**Exemplo:** ${block.content}`;
          case 'constraint':
            return `**Restrição:** ${block.content}`;
          case 'output_format':
            return `**Formato de Saída:** ${block.content}`;
          case 'variable':
            return `**Variável:** {${block.content}}`;
          default:
            return block.content;
        }
      })
      .filter(content => content.trim())
      .join('\n\n');
  }, [blocks]);

  // Validar prompt
  const validatePrompt = useCallback(async () => {
    const issues: any[] = [];
    const improvements: string[] = [];

    // Validações básicas
    if (generatedPrompt.length < 50) {
      issues.push({
        type: 'error',
        message: 'Prompt muito curto',
        suggestion: 'Adicione mais detalhes e contexto',
        severity: 'high'
      });
    }

    if (generatedPrompt.length > 2000) {
      issues.push({
        type: 'warning',
        message: 'Prompt muito longo',
        suggestion: 'Considere dividir em prompts menores',
        severity: 'medium'
      });
    }

    // Verificar presença de instruções obrigatórias
    const hasInstruction = blocks.some(block => block.type === 'instruction' && block.content.trim());
    if (!hasInstruction) {
      issues.push({
        type: 'error',
        message: 'Falta instrução principal',
        suggestion: 'Adicione pelo menos uma instrução clara',
        severity: 'high'
      });
    }

    // Verificar exemplos
    const hasExample = blocks.some(block => block.type === 'example' && block.content.trim());
    if (!hasExample) {
      improvements.push('Adicione exemplos para maior clareza');
    }

    // Calcular score
    let score = 0.5; // Base score
    
    // Bonificações
    if (hasInstruction) score += 0.2;
    if (hasExample) score += 0.15;
    if (blocks.some(b => b.type === 'context')) score += 0.1;
    if (blocks.some(b => b.type === 'output_format')) score += 0.05;

    // Penalizações
    if (generatedPrompt.length < 100) score -= 0.2;
    if (generatedPrompt.length > 1500) score -= 0.1;

    setValidation({
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      score: Math.max(0, Math.min(1, score)),
      issues,
      improvements
    });
  }, [generatedPrompt, blocks]);

  // Analisar com IA
  const analyzeWithAI = useCallback(async () => {
    if (generatedPrompt.trim()) {
      try {
        const analysis = await analyzePrompt(generatedPrompt, generatedPrompt, { blocks });
        console.log('Análise da IA:', analysis);
        // Aqui você pode processar a análise retornada
      } catch (error) {
        console.error('Erro na análise:', error);
      }
    }
  }, [generatedPrompt, analyzePrompt]);

  // Exportar prompt
  const exportPrompt = useCallback(() => {
    const data = {
      prompt: generatedPrompt,
      blocks,
      timestamp: new Date().toISOString(),
      validation
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedPrompt, blocks, validation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Construtor Visual de Prompts</h2>
          <p className="text-muted-foreground">
            Monte seus prompts arrastando e soltando blocos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={validatePrompt}
            disabled={blocks.length === 0}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Validar
          </Button>
          <Button
            variant="outline"
            onClick={exportPrompt}
            disabled={blocks.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Biblioteca de blocos */}
        <div className="lg:col-span-1">
          <BlockLibrary onAddBlock={addBlock} />
        </div>

        {/* Área do construtor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt em Construção</CardTitle>
              <CardDescription>
                Arraste os blocos para reordenar • {blocks.length} blocos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum bloco adicionado ainda</p>
                  <p className="text-sm">Use a biblioteca ao lado para começar</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {blocks
                      .sort((a, b) => a.order - b.order)
                      .map((block, index) => (
                        <div
                          key={block.id}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <PromptBlockComponent
                            block={block}
                            index={index}
                            onUpdate={updateBlock}
                            onDelete={deleteBlock}
                            isDragging={draggedBlockId === block.id}
                          />
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Preview do prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Preview do Prompt</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generatedPrompt || 'Adicione blocos para ver o preview...'}
                </pre>
              </div>
              
              {generatedPrompt && (
                <div className="mt-4 flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={analyzeWithAI}
                    disabled={!generatedPrompt.trim()}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Analisar com IA
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel de validação e insights */}
        <div className="lg:col-span-1 space-y-4">
          {validation ? (
            <ValidationPanel validation={validation} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique em "Validar" para analisar seu prompt
                </p>
              </CardContent>
            </Card>
          )}

          {/* Métricas em tempo real */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Blocos</span>
                <Badge variant="secondary">{blocks.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Caracteres</span>
                <Badge variant="secondary">{generatedPrompt.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Obrigatórios</span>
                <Badge variant="secondary">
                  {blocks.filter(b => b.isRequired).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Preenchidos</span>
                <Badge variant="secondary">
                  {blocks.filter(b => b.content.trim()).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisualPromptBuilder;