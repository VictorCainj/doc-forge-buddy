import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { parseAuthError } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        const loginError = parseAuthError(error);
        setError(loginError.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      const loginError = parseAuthError(err);
      setError(loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const _isFormValid = register('email') && register('password');

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="professional-header">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  DocForge Enterprise Suite
                </h1>
                <p className="text-white/80 text-lg">
                  Sistema de gestão de contratos e documentos
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-3 rounded-xl bg-white/10">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-white/90">
                <p className="text-sm">Acesso Seguro</p>
                <p className="text-xs text-white/70">Autenticação protegida</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <div className="w-full max-w-md space-y-8">
          {/* Login Form */}
          <Card className="glass-card border-border shadow-soft">
            <CardHeader className="space-y-1 pb-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Fazer Login
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Use sua conta do DocForge Enterprise Suite
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu email"
                      className="pl-10 h-12 border-border focus:border-primary transition-colors"
                      {...register('email')}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      className="pl-10 pr-10 h-12 border-border focus:border-primary transition-colors"
                      {...register('password')}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/signup')}
                    className="flex-1 h-11"
                    disabled={isLoading}
                  >
                    Criar conta
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Avançar'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                Português (Brasil)
              </button>
              <span>•</span>
              <button className="hover:text-foreground transition-colors">
                Ajuda
              </button>
              <span>•</span>
              <button className="hover:text-foreground transition-colors">
                Privacidade
              </button>
              <span>•</span>
              <button className="hover:text-foreground transition-colors">
                Termos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
