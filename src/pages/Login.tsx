import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { parseAuthError } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email');

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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs with gradient */}
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-cyan-300/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-300/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 to-blue-300/20 rounded-full blur-3xl"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        {/* Main Content */}
        <motion.div
          className="w-full max-w-[460px] relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Header with animated logo */}
          <motion.div
            className="flex flex-col items-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              className="relative mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
                <span className="text-3xl font-bold text-white">DF</span>
              </div>
              {/* Sparkle effect */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
              </motion.div>
            </motion.div>

            <h1 className="text-5xl font-semibold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
              DocForge
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
              Gestão Inteligente de Documentos
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {/* Error Message with enhanced styling */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              {/* Email Field with enhanced styling */}
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className={`
                      w-full pl-12 pr-4 py-4
                      bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50
                      border-2 rounded-2xl
                      text-gray-900 dark:text-white text-base
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-300
                      focus:outline-none focus:from-white focus:to-gray-50 dark:focus:from-gray-700 dark:focus:to-gray-800
                      ${
                        focusedField === 'email'
                          ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.01]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      ${errors.email ? 'border-red-500 shadow-red-500/20' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    {...register('email')}
                    disabled={isLoading}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  {emailValue && !errors.email && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 dark:text-red-400 ml-3 flex items-center gap-1"
                  >
                    <span className="text-red-500">●</span>{' '}
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Password Field with enhanced styling */}
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    className={`
                      w-full pl-12 pr-12 py-4
                      bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50
                      border-2 rounded-2xl
                      text-gray-900 dark:text-white text-base
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      transition-all duration-300
                      focus:outline-none focus:from-white focus:to-gray-50 dark:focus:from-gray-700 dark:focus:to-gray-800
                      ${
                        focusedField === 'password'
                          ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.01]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      ${errors.password ? 'border-red-500 shadow-red-500/20' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    {...register('password')}
                    disabled={isLoading}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    disabled={isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 dark:text-red-400 ml-3 flex items-center gap-1"
                  >
                    <span className="text-red-500">●</span>{' '}
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Remember Password */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={false}
                      readOnly
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 group-hover:border-blue-500 transition-all" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Lembrar-me
                  </span>
                </label>
                <motion.a
                  href="#"
                  className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  whileHover={{ x: 2 }}
                >
                  Esqueceu a senha?
                </motion.a>
              </div>

              {/* Submit Button with enhanced styling */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full py-4 rounded-2xl font-semibold text-white text-base
                  transition-all duration-300 relative overflow-hidden
                  flex items-center justify-center gap-3
                  ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50'
                  }
                `}
                whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: 'linear',
                      }}
                    />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center space-y-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-4">
              <span>© 2024 DocForge</span>
              <span className="text-gray-400">•</span>
              <span>Todos os direitos reservados</span>
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-500">
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacidade
              </a>
              <span>•</span>
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Termos
              </a>
              <span>•</span>
              <a
                href="#"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Suporte
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
};

export default Login;
