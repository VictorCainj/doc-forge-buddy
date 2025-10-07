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
import { Loader2, Eye, EyeOff, Mail, Lock, Home } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Side - Minimalist Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-center px-16 xl:px-24">
        <div className="max-w-md">
          {/* Logo minimalista */}
          <div className="flex items-center mb-12">
            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center mr-3">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">ContractPro</h1>
              <p className="text-neutral-500 text-xs">Gestão Imobiliária</p>
            </div>
          </div>

          {/* Heading simplificado */}
          <h2 className="text-3xl font-light text-neutral-900 mb-4 leading-tight">
            Gerencie contratos
            <span className="block font-normal">
              com simplicidade
            </span>
          </h2>

          <p className="text-neutral-600 mb-12 leading-relaxed">
            Plataforma completa para administração de contratos de locação 
            e processos imobiliários.
          </p>

          {/* Features minimalistas */}
          <div className="space-y-3">
            <div className="flex items-center text-neutral-600">
              <div className="w-1 h-1 bg-neutral-400 rounded-full mr-3"></div>
              <span className="text-sm">Contratos digitais</span>
            </div>
            <div className="flex items-center text-neutral-600">
              <div className="w-1 h-1 bg-neutral-400 rounded-full mr-3"></div>
              <span className="text-sm">Segurança jurídica</span>
            </div>
            <div className="flex items-center text-neutral-600">
              <div className="w-1 h-1 bg-neutral-400 rounded-full mr-3"></div>
              <span className="text-sm">Gestão completa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-neutral-50 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Login Card - Minimalista */}
          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="text-center pb-4">
              <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                Entrar
              </h3>
              <p className="text-neutral-500 text-sm">
                Acesse sua conta para continuar
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert className="bg-error-50 border-error-500/20 text-error-700">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-700 text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...register('email')}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-error-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-700 text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...register('password')}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
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
                    <p className="text-sm text-error-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-neutral-200">
                <p className="text-neutral-600 text-sm">
                  Não tem uma conta?{' '}
                  <button 
                    onClick={() => navigate('/signup')}
                    className="text-neutral-900 font-medium hover:underline transition-colors"
                  >
                    Solicite acesso
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-xs">
              Conexão segura • Dados protegidos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
