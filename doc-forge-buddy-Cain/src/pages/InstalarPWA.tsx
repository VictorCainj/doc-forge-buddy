import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  HardDrive,
  Zap,
  Lock,
  Globe,
  Share2 } from '@/lib/icons';
import { 
  isRunningAsPWA, 
  promptPWAInstall, 
  canInstallPWA,
  isOnline,
  getCacheStatus
} from '@/utils/pwaHelpers';
import { toast } from 'sonner';

export default function InstalarPWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [online, setOnline] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<{ cacheNames: string[] } | null>(null);

  useEffect(() => {
    setIsPWA(isRunningAsPWA());
    setCanInstall(canInstallPWA());
    setOnline(isOnline());

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      getCacheStatus()
        .then(setCacheInfo)
        .catch(() => setCacheInfo(null));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    try {
      const installed = await promptPWAInstall();
      if (installed) {
        toast.success('App instalado com sucesso!');
        setIsPWA(true);
        setCanInstall(false);
      } else {
        toast.error('Instalação cancelada');
      }
    } catch (error) {
      toast.error('Não foi possível instalar o app no momento');
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Desempenho Otimizado',
      description: 'Carregamento ultra-rápido com cache inteligente'
    },
    {
      icon: WifiOff,
      title: 'Funciona Offline',
      description: 'Acesse seus documentos mesmo sem internet'
    },
    {
      icon: Lock,
      title: 'Seguro e Confiável',
      description: 'Dados protegidos com HTTPS e criptografia'
    },
    {
      icon: Smartphone,
      title: 'Experiência Mobile',
      description: 'Interface otimizada para dispositivos móveis'
    },
    {
      icon: HardDrive,
      title: 'Cache Inteligente',
      description: 'Armazenamento local para acesso rápido'
    },
    {
      icon: Globe,
      title: 'Sempre Atualizado',
      description: 'Atualizações automáticas em segundo plano'
    }
  ];

  const installSteps = [
    {
      platform: 'Android (Chrome/Edge)',
      steps: [
        'Toque no menu (⋮) no canto superior direito',
        'Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"',
        'Confirme a instalação',
        'O ícone aparecerá na sua tela inicial'
      ]
    },
    {
      platform: 'iOS (Safari)',
      steps: [
        'Toque no ícone de compartilhar (⬆️) na parte inferior',
        'Role para baixo e selecione "Adicionar à Tela de Início"',
        'Nomeie o app e toque em "Adicionar"',
        'O ícone aparecerá na sua tela inicial'
      ]
    },
    {
      platform: 'Desktop (Chrome/Edge)',
      steps: [
        'Clique no ícone de instalação (⊕) na barra de endereço',
        'Ou acesse Menu → Instalar Doc Forge Buddy',
        'Confirme a instalação',
        'O app abrirá em uma janela dedicada'
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Download className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Instalar Doc Forge Buddy</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Instale nosso aplicativo e tenha acesso rápido, mesmo offline!
        </p>
      </div>

      {/* Status do PWA */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPWA ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                App Instalado
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-warning" />
                App Não Instalado
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={isPWA ? 'success' : 'secondary'}>
              {isPWA ? '✓ Instalado' : '○ Não Instalado'}
            </Badge>
            <Badge variant={online ? 'success' : 'warning'}>
              {online ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {online ? 'Online' : 'Offline'}
            </Badge>
            {cacheInfo && (
              <Badge variant="info">
                <HardDrive className="h-3 w-3 mr-1" />
                {cacheInfo.cacheNames.length} caches ativos
              </Badge>
            )}
          </div>

          {!isPWA && canInstall && (
            <div className="pt-4">
              <Button 
                onClick={handleInstall} 
                size="lg" 
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-5 w-5" />
                Instalar Agora
              </Button>
            </div>
          )}

          {!isPWA && !canInstall && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Para instalar, siga as instruções abaixo de acordo com seu dispositivo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recursos do PWA */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Por que instalar?</CardTitle>
          <CardDescription>
            Veja todos os benefícios de ter o app instalado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instruções de Instalação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Como Instalar
          </CardTitle>
          <CardDescription>
            Instruções passo a passo para cada plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {installSteps.map((guide, index) => (
            <div key={index}>
              {index > 0 && <Separator className="my-6" />}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {guide.platform}
                </h3>
                <ol className="space-y-2 ml-7">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-muted-foreground">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mr-2">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Requisitos e Compatibilidade */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Requisitos e Compatibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>
                <strong>Navegadores suportados:</strong> Chrome 90+, Edge 90+, Safari 15+, Firefox 90+
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>
                <strong>Sistemas operacionais:</strong> Android 8+, iOS 15+, Windows 10+, macOS 10.15+
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>
                <strong>Conexão:</strong> Requer HTTPS (conexão segura)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>
                <strong>Espaço:</strong> Aproximadamente 5-10 MB de armazenamento local
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">O app funciona offline?</h3>
            <p className="text-sm text-muted-foreground">
              Sim! Após instalado, você pode acessar seus documentos e contratos salvos mesmo sem conexão à internet.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">O app ocupa muito espaço?</h3>
            <p className="text-sm text-muted-foreground">
              Não, o app é muito leve (5-10 MB) e usa cache inteligente para armazenar apenas o necessário.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Como desinstalar?</h3>
            <p className="text-sm text-muted-foreground">
              No Android/iOS, mantenha pressionado o ícone e selecione "Desinstalar". No desktop, acesse as configurações do navegador e remova o app instalado.
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Recebo atualizações automáticas?</h3>
            <p className="text-sm text-muted-foreground">
              Sim! O app se atualiza automaticamente em segundo plano sempre que há uma nova versão disponível.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
