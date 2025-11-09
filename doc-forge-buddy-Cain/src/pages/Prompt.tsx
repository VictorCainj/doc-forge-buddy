import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, 
  Bot, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Lightbulb,
  Target,
  Zap,
  Plus,
  X,
  Grid3X3,
  MessageSquare,
  BarChart3,
  Image,
  FileText,
  Code,
  Users,
  ShoppingCart,
  Palette,
  BookOpen,
  Calendar,
  Settings,
  Search } from '@/lib/icons';
import { toast } from 'sonner';
import { useOpenAI } from '@/hooks/useOpenAI';



const PromptChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hook para integração com OpenAI
  const { chatCompletion } = useOpenAI();



  const generateDirectPrompt = async (userInput: string): Promise<string> => {
    try {
      // Prompt direto e específico para geração automática de prompts ricos
      const systemPrompt = `Você é um especialista em criar prompts completos e eficazes para IAs. 

TAREFA: Com base apenas na solicitação do usuário, crie imediatamente um prompt rico, detalhado e pronto para uso.

REQUISITOS DO PROMPT:
- Seja específico e detalhado
- Inclua contexto necessário
- Defina claramente a tarefa
- Especifique o formato de saída desejado
- Adicione exemplos quando apropriado
- Inclua limitações e restrições
- Use linguagem clara e profissional

INSTRUÇÕES:
- NÃO faça perguntas
- NÃO peça esclarecimentos
- NÃO peça contexto adicional
- Crie um prompt completo baseado no que foi solicitado
- Use formatação markdown quando útil

Solicitação do usuário: "${userInput}"

RETORNE APENAS o prompt gerado, sem explicações adicionais:`;

      const response = await chatCompletion(systemPrompt);
      return response;
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      
      // Fallback para criação básica de prompt em caso de erro
      return `Com base na sua solicitação "${userInput}", aqui está um prompt estruturado:

**Contexto**: ${userInput}
**Tarefa**: Execute a tarefa descrita de forma detalhada e precisa
**Formato**: Forneça uma resposta clara, organizada e completa
**Exemplos**: Inclua exemplos práticos quando relevante
**Limitações**: Mantenha o foco no objetivo principal e seja direto

Este prompt foi criado automaticamente para atender sua necessidade de forma eficiente.`;
    }
  };

  const handleGeneratePrompt = async () => {
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const generatedPrompt = await generateDirectPrompt(inputMessage.trim());
      setCurrentPrompt(generatedPrompt);
      setInputMessage('');
      toast.success('Prompt gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      toast.error('Erro ao gerar prompt. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGeneratePrompt();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };



  const clearPrompt = () => {
    setCurrentPrompt('');
    toast.success('Prompt limpo!');
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    setQuickActionsOpen(false);
    // Auto focus no textarea após selecionar ação
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Array de ações rápidas com design Google Material
  const quickActions = [
    {
      icon: MessageSquare,
      title: 'Redes Sociais',
      description: 'Conteúdo para Facebook, Instagram, LinkedIn',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      action: 'Criar conteúdo para redes sociais'
    },
    {
      icon: BarChart3,
      title: 'Análise de Dados',
      description: 'Relatórios e insights de dados',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      action: 'Analisar dados de vendas'
    },
    {
      icon: Zap,
      title: 'Copywriting',
      description: 'Textos de vendas e marketing',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      action: 'Escrever textos de vendas'
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce',
      description: 'Descrições de produtos',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      action: 'Criar descrições de produtos'
    },
    {
      icon: Code,
      title: 'Programação',
      description: 'Código e documentação técnica',
      color: 'from-gray-700 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      action: 'Criar documentação técnica'
    },
    {
      icon: Image,
      title: 'Criação Visual',
      description: 'Prompts para geração de imagens',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      action: 'Criar prompts para geração de imagens'
    },
    {
      icon: FileText,
      title: 'Artigos',
      description: 'Conteúdo para blog e publicações',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      action: 'Escrever artigos de blog'
    },
    {
      icon: Users,
      title: 'RH e Gestão',
      description: 'Processos e políticas internas',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      action: 'Criar políticas de RH'
    },
    {
      icon: BookOpen,
      title: 'Educação',
      description: 'Material didático e treinamentos',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      action: 'Criar material educativo'
    },
    {
      icon: Calendar,
      title: 'Eventos',
      description: 'Planejamento e organização',
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      action: 'Planejar evento corporativo'
    },
    {
      icon: Palette,
      title: 'Design',
      description: 'Briefs e especificações visuais',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-700',
      action: 'Criar brief de design'
    },
    {
      icon: Search,
      title: 'SEO',
      description: 'Otimização para mecanismos de busca',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      action: 'Otimizar conteúdo para SEO'
    }
  ];



  useEffect(() => {
    // Atualizar meta tags
    document.title = 'Gerador de Prompts - Doc Forge Buddy';
    
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, value);
      }
    };

    updateMetaTag('meta[name="description"]', 'content', 'Gerador direto de prompts. Digite o que você quer e obtenha um prompt rico e detalhado instantaneamente.');
    updateMetaTag('meta[name="keywords"]', 'content', 'prompt, gerador, IA, inteligência artificial, criação, templates');
    updateMetaTag('meta[property="og:title"]', 'content', 'Gerador de Prompts - Doc Forge Buddy');
    updateMetaTag('meta[property="og:description"]', 'content', 'Crie prompts eficazes de forma direta e simples');

    return () => {
      document.title = 'doc-forge-buddy';
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Gerador de Prompts</h1>
          <Dialog open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 px-4">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Ações Rápidas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-center mb-2">
                  Ações Rápidas
                </DialogTitle>
                <p className="text-sm text-muted-foreground text-center">
                  Escolha uma categoria para começar rapidamente
                </p>
              </DialogHeader>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                {quickActions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center space-y-3 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                      onClick={() => handleQuickAction(item.action)}
                    >
                      <div className={`p-3 rounded-full ${item.bgColor} shadow-sm`}>
                        <Icon className={`h-6 w-6 ${item.textColor}`} />
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Digite o que você quer e obtenha um prompt rico instantaneamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Area */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                O que você quer criar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Um prompt para criar artigos de blog sobre tecnologia..."
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGeneratePrompt}
                  disabled={!inputMessage.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Gerar Prompt
                    </>
                  )}
                </Button>
                
                {currentPrompt && (
                  <Button 
                    variant="outline" 
                    onClick={clearPrompt}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Pressione Enter para gerar, Shift+Enter para nova linha
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Output Area */}
        <div>
          {currentPrompt ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Prompt Gerado
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(currentPrompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                  {currentPrompt}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Seu prompt gerado aparecerá aqui
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>


    </div>
  );
};

export default PromptChat;