import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, Key } from '@/utils/iconMapper';
import { Link } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        setError('Erro ao enviar email de recuperação. Tente novamente.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        {/* Professional Header */}
        <div className="professional-header">
          <div className="relative px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Email Enviado!
                  </h1>
                  <p className="text-white/80 text-lg">
                    Link de recuperação enviado com sucesso
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-3 rounded-xl bg-white/10">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center p-6 min-h-[60vh]">
          <Card className="glass-card w-full max-w-md border-border shadow-soft">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold text-foreground">
                Email Enviado!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enviamos um link de recuperação para seu email. Verifique sua
                caixa de entrada e siga as instruções.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/login">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Recuperação de Senha
                </h1>
                <p className="text-white/80 text-lg">
                  Recupere o acesso à sua conta de forma segura
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-3 rounded-xl bg-white/10">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-white/90">
                <p className="text-sm">Recuperação Segura</p>
                <p className="text-xs text-white/70">Link enviado por email</p>
              </div>
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <Card className="glass-card w-full max-w-md border-border shadow-soft">
          <CardHeader className="space-y-1 pb-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Key className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                Recuperar Senha
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Digite seu email para receber um link de recuperação
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-error-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 hover:underline"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
