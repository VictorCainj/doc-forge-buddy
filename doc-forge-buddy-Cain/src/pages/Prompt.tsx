import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Target, 
  Zap, 
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
  Search,
  Trash2 
} from '@/lib/icons';
import { toast } from 'sonner';
import { useOpenAI } from '@/hooks/useOpenAI';
import { motion, AnimatePresence } from 'framer-motion';

const PromptChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { chatCompletion } = useOpenAI();

  const generateDirectPrompt = async (userInput: string): Promise<string> => {
    try {
      const systemPrompt = `Act as a world-class Prompt Engineering Expert. Your goal is to transform a simple user request into a highly sophisticated, detailed, and effective prompt optimized for advanced LLMs (like GPT-4, Claude 3, Gemini).

USER REQUEST: "${userInput}"

INSTRUCTIONS:
1. Analyze the user's request to understand the core intent, implicit needs, and desired outcome.
2. Construct a comprehensive prompt that includes:
   - **Persona/Role**: Define who the AI should act as (e.g., "Senior Data Scientist", "Creative Director").
   - **Context**: Add necessary background information to frame the task.
   - **Task**: Clear, step-by-step instructions on what to do.
   - **Format**: Specify the exact output format (e.g., Markdown, JSON, list, tone of voice).
   - **Constraints**: What the AI should avoid or prioritize.
   - **Example** (Optional but recommended): A brief example of the desired style or structure.

OUTPUT FORMAT:
Return ONLY the generated prompt text. Do not include introductory text like "Here is your prompt:" or explanations. The output should be ready to copy and paste directly into an AI.

LANGUAGE:
Ensure the generated prompt is in the same language as the user's request (Portuguese if the request is in Portuguese).`;

      const response = await chatCompletion(systemPrompt);
      return response;
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      
      return `Atue como um especialista na tarefa solicitada.

**Contexto**: O usuário precisa de ajuda com: "${userInput}"
**Tarefa**: Execute a solicitação acima com o máximo de detalhes, precisão e profissionalismo.
**Formato**: A resposta deve ser bem estruturada, clara e fácil de entender. Use formatação Markdown (títulos, listas, negrito) para melhor legibilidade.
**Objetivo**: Fornecer a melhor solução possível para o problema apresentado.`;
    }
  };

  const handleGeneratePrompt = async () => {
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const generatedPrompt = await generateDirectPrompt(inputMessage.trim());
      setCurrentPrompt(generatedPrompt);
      setInputMessage('');
      toast.success('Prompt otimizado gerado com sucesso!');
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
    setCurrentPrompt(''); // Auto-clear após copiar
  };

  const clearPrompt = () => {
    setCurrentPrompt('');
    toast.info('Prompt limpo!');
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    setQuickActionsOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const quickActions = [
    { icon: MessageSquare, title: 'Redes Sociais', description: 'Posts para Instagram, LinkedIn', color: 'text-blue-600', bgColor: 'bg-blue-50', action: 'Crie uma estratégia de conteúdo para LinkedIn focada em liderança e inovação tecnológica.' },
    { icon: BarChart3, title: 'Análise de Dados', description: 'Insights de relatórios', color: 'text-green-600', bgColor: 'bg-green-50', action: 'Atue como um Cientista de Dados Sênior. Analise os seguintes dados e forneça insights estratégicos: [Cole seus dados aqui]' },
    { icon: Zap, title: 'Copywriting', description: 'Vendas e persuasão', color: 'text-orange-600', bgColor: 'bg-orange-50', action: 'Escreva uma carta de vendas persuasiva usando a técnica AIDA para vender [Produto/Serviço].' },
    { icon: Code, title: 'Programação', description: 'Snippets e refatoração', color: 'text-gray-700', bgColor: 'bg-gray-100', action: 'Refatore o seguinte código para melhorar a performance e legibilidade, seguindo os princípios SOLID: [Cole o código aqui]' },
    { icon: Image, title: 'Prompts de Imagem', description: 'Midjourney, DALL-E', color: 'text-pink-600', bgColor: 'bg-pink-50', action: 'Crie um prompt detalhado para o Midjourney gerar uma imagem realista de...' },
    { icon: FileText, title: 'Blog Post', description: 'Artigos SEO-friendly', color: 'text-indigo-600', bgColor: 'bg-indigo-50', action: 'Escreva um artigo de blog otimizado para SEO sobre [Tópico], com tom conversacional e informativo.' },
    { icon: Users, title: 'RH & Cultura', description: 'Feedbacks e comunicados', color: 'text-teal-600', bgColor: 'bg-teal-50', action: 'Escreva um comunicado oficial sobre a nova política de trabalho híbrido da empresa, mantendo um tom empático e profissional.' },
    { icon: Calendar, title: 'Produtividade', description: 'Planejamento diário', color: 'text-rose-600', bgColor: 'bg-rose-50', action: 'Crie um cronograma detalhado para organizar minha semana, priorizando tarefas de alto impacto.' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 md:p-8 font-sans text-neutral-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
            Engenheiro de Prompts IA
          </h1>
          <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
            Transforme ideias simples em comandos poderosos. Descreva sua necessidade e receba um prompt otimizado para extrair o máximo da Inteligência Artificial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Column */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-neutral-800">
                  <Sparkles className="h-5 w-5 text-purple-500 fill-purple-100" />
                  O que você deseja criar?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ex: Preciso de um e-mail para cobrar um cliente atrasado sem ser rude..."
                    className="min-h-[180px] resize-none text-base p-4 border-neutral-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl bg-neutral-50 focus:bg-white transition-all"
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-neutral-400 pointer-events-none">
                    Shift + Enter para pular linha
                  </div>
                </div>
                
                <Button 
                  onClick={handleGeneratePrompt}
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 transition-all duration-200 transform active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Otimizando Prompt...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 fill-current" />
                      <span>Gerar Prompt Profissional</span>
                    </div>
                  )}
                </Button>

                <div className="pt-2">
                  <Dialog open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Explorar Modelos Rápidos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center mb-1">Galeria de Ações Rápidas</DialogTitle>
                        <p className="text-center text-neutral-500">Escolha um modelo para começar</p>
                      </DialogHeader>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {quickActions.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={index}
                              className="flex flex-col items-center p-4 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all group text-center h-full"
                              onClick={() => handleQuickAction(item.action)}
                            >
                              <div className={`p-3 rounded-full mb-3 ${item.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                                <Icon className={`h-6 w-6 ${item.color}`} />
                              </div>
                              <h3 className="font-semibold text-sm text-neutral-800 mb-1">{item.title}</h3>
                              <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {currentPrompt ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className="h-full border-neutral-200 shadow-lg bg-white flex flex-col overflow-hidden border-t-4 border-t-green-500">
                    <CardHeader className="border-b border-neutral-100 bg-neutral-50/30 flex flex-row items-center justify-between py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-neutral-800">Prompt Otimizado</CardTitle>
                          <p className="text-xs text-neutral-500 font-medium">Pronto para uso</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={clearPrompt} className="text-neutral-400 hover:text-red-500 hover:bg-red-50" title="Descartar">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          onClick={() => copyToClipboard(currentPrompt)}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2 pl-3 pr-4 shadow-md shadow-green-500/20"
                        >
                          <Copy className="h-4 w-4" />
                          Copiar e Limpar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative bg-neutral-50/30">
                      <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar">
                        <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-100 prose-pre:border prose-pre:border-neutral-200 rounded-lg">
                          <div className="whitespace-pre-wrap font-mono text-sm text-neutral-700 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                            {currentPrompt}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 text-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                    <Bot className="h-10 w-10 text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-700">Aguardando sua instrução</h3>
                  <p className="text-neutral-500 max-w-sm mx-auto">
                    O prompt gerado pela IA aparecerá aqui, formatado e pronto para ser copiado.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptChat;
