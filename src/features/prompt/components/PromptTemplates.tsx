// @ts-nocheck
import { useState, memo, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PromptTemplatesProps {
  onUseTemplate?: (template: string) => void;
}

const DEFAULT_TEMPLATES = [
  {
    id: 'email-profissional',
    name: 'Email Profissional',
    category: 'comunicação',
    description: 'Gerar emails profissionais e formais',
    prompt: 'Crie um email profissional para {assunto} com tom {tom}',
    variables: [
      {
        name: 'assunto',
        description: 'Assunto do email',
        example: 'confirmação de reunião',
        required: true,
      },
      {
        name: 'tom',
        description: 'Tom do email',
        example: 'formal, amigável ou profissional',
        required: false,
      },
    ],
    tags: ['email', 'comunicação'],
  },
  {
    id: 'relatorio-vistoria',
    name: 'Relatório de Vistoria',
    category: 'documentos',
    description: 'Gerar relatório detalhado de vistoria',
    prompt:
      'Crie um relatório de vistoria para {endereco} com apontamentos sobre {itens}',
    variables: [
      {
        name: 'endereco',
        description: 'Endereço do imóvel',
        example: 'Rua Exemplo, 123',
        required: true,
      },
      {
        name: 'itens',
        description: 'Itens a avaliar',
        example: 'estrutura, pintura, encanamento',
        required: true,
      },
    ],
    tags: ['vistoria', 'relatório'],
  },
];

export const PromptTemplates = memo(({
  onUseTemplate,
}: PromptTemplatesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('general');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templatePrompt, setTemplatePrompt] = useState('');
  const queryClient = useQueryClient();

  // Buscar templates do usuário com cache otimizado
  const { data: userTemplates = [] } = useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar templates:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - templates mudam raramente
    gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache por mais tempo
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Criar template
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('prompt_templates').insert({
        user_id: user.id,
        name: templateName,
        category: templateCategory,
        description: templateDescription,
        prompt: templatePrompt,
        variables: [],
        tags: [],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      toast.success('Template criado com sucesso');
      setIsDialogOpen(false);
      setTemplateName('');
      setTemplateCategory('general');
      setTemplateDescription('');
      setTemplatePrompt('');
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    },
  });

  const handleUseTemplate = useCallback(
    (prompt: string) => {
      if (onUseTemplate) {
        onUseTemplate(prompt);
      }
    },
    [onUseTemplate]
  );

  const allTemplates = useMemo(
    () => [...DEFAULT_TEMPLATES, ...userTemplates],
    [userTemplates]
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold">Templates</h3>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Template</DialogTitle>
                <DialogDescription>
                  Salve um prompt como template para reutilização
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Template</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Email Profissional"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={templateCategory}
                    onValueChange={setTemplateCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="comunicação">Comunicação</SelectItem>
                      <SelectItem value="documentos">Documentos</SelectItem>
                      <SelectItem value="análise">Análise</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Breve descrição do template"
                  />
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={templatePrompt}
                    onChange={(e) => setTemplatePrompt(e.target.value)}
                    placeholder="Digite o prompt do template..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createTemplateMutation.mutate()}
                  disabled={
                    !templateName || !templatePrompt || createTemplateMutation.isPending
                  }
                >
                  Criar Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Grid de templates */}
        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {template.prompt}
              </p>
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleUseTemplate(template.prompt)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Usar Template
              </Button>
            </div>
          ))}
        </div>

        {allTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum template disponível
          </div>
        )}
      </div>
    </Card>
  );
});

PromptTemplates.displayName = 'PromptTemplates';

