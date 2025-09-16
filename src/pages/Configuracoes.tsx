import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, FileText, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface DocumentSettings {
  defaultFontSize: number;
  defaultDateFormat: string;
  autoSave: boolean;
  watermark: boolean;
  signature: string;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);

  // Estados do perfil
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    avatar_url: '',
  });

  // Estados das configurações de documento
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    defaultFontSize: 12,
    defaultDateFormat: 'dd/MM/yyyy',
    autoSave: true,
    watermark: false,
    signature: '',
  });

  // Carregar dados do usuário
  useEffect(() => {
    loadUserProfile();
    loadSettings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfile((prev) => ({
          ...prev,
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const loadSettings = () => {
    // Carregar configurações do localStorage
    const savedDocSettings = localStorage.getItem('documentSettings');

    if (savedDocSettings) {
      setDocumentSettings(JSON.parse(savedDocSettings));
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
        },
      });

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDocumentSettings = () => {
    localStorage.setItem('documentSettings', JSON.stringify(documentSettings));
    toast({
      title: 'Configurações salvas',
      description: 'As configurações de documento foram salvas.',
    });
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'documentos', label: 'Documentos', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações
          </h1>
          <p className="text-gray-600">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegação */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3">
            {/* Aba Perfil */}
            {activeTab === 'perfil' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informações do Perfil</span>
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={saveProfile}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Aba Documentos */}
            {activeTab === 'documentos' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Configurações de Documentos</span>
                  </CardTitle>
                  <CardDescription>
                    Personalize como seus documentos são gerados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Tamanho da Fonte Padrão</Label>
                      <Select
                        value={documentSettings.defaultFontSize.toString()}
                        onValueChange={(value) =>
                          setDocumentSettings((prev) => ({
                            ...prev,
                            defaultFontSize: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10pt</SelectItem>
                          <SelectItem value="11">11pt</SelectItem>
                          <SelectItem value="12">12pt</SelectItem>
                          <SelectItem value="14">14pt</SelectItem>
                          <SelectItem value="16">16pt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Formato de Data</Label>
                      <Select
                        value={documentSettings.defaultDateFormat}
                        onValueChange={(value) =>
                          setDocumentSettings((prev) => ({
                            ...prev,
                            defaultDateFormat: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                          <SelectItem value="dd de MMMM de yyyy">
                            DD de MMMM de AAAA
                          </SelectItem>
                          <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Salvamento Automático</Label>
                        <p className="text-sm text-gray-500">
                          Salva automaticamente os documentos em edição
                        </p>
                      </div>
                      <Button
                        variant={
                          documentSettings.autoSave ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setDocumentSettings((prev) => ({
                            ...prev,
                            autoSave: !prev.autoSave,
                          }))
                        }
                      >
                        {documentSettings.autoSave ? 'Ativado' : 'Desativado'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Marca d'água</Label>
                        <p className="text-sm text-gray-500">
                          Adiciona marca d'água aos documentos
                        </p>
                      </div>
                      <Button
                        variant={
                          documentSettings.watermark ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setDocumentSettings((prev) => ({
                            ...prev,
                            watermark: !prev.watermark,
                          }))
                        }
                      >
                        {documentSettings.watermark ? 'Ativado' : 'Desativado'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signature">Assinatura Digital</Label>
                    <Textarea
                      id="signature"
                      value={documentSettings.signature}
                      onChange={(e) =>
                        setDocumentSettings((prev) => ({
                          ...prev,
                          signature: e.target.value,
                        }))
                      }
                      placeholder="Digite sua assinatura digital"
                      rows={3}
                    />
                  </div>

                  <Button onClick={saveDocumentSettings} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
