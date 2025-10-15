import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { parseAuthError } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

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
    <main role="main" aria-label="Página de login">
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[450px]">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-normal text-[#202124] mb-3 tracking-tight">
              Cain
            </h1>
            <h2 className="text-2xl font-normal text-[#202124]">Fazer login</h2>
            <p className="text-sm text-[#3c4043] mt-2">para continuar</p>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-lg p-10 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-[#fce8e6] border border-[#c5221f] text-[#c5221f] text-sm px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#3c4043]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  className="w-full px-4 py-3 border border-[#dadce0] rounded text-[#202124] text-base focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all disabled:bg-[#f1f3f4] disabled:text-[#5f6368]"
                  {...register('email')}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-xs text-[#c5221f] mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#3c4043]"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    className="w-full px-4 py-3 border border-[#dadce0] rounded text-[#202124] text-base focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 transition-all disabled:bg-[#f1f3f4] disabled:text-[#5f6368]"
                    {...register('password')}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-[#c5221f] mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 text-[#1a73e8] border-[#dadce0] rounded focus:ring-[#1a73e8]"
                  disabled={isLoading}
                />
                <label
                  htmlFor="showPassword"
                  className="ml-2 text-sm text-[#3c4043] cursor-pointer select-none"
                >
                  Mostrar senha
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium py-3 px-6 rounded text-sm transition-colors disabled:bg-[#e8eaed] disabled:text-[#5f6368] disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Entrando...' : 'Próxima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
