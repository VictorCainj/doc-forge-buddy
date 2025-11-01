import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { parseAuthError } from '@/types/auth';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react';

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
  const [emailValidated, setEmailValidated] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const emailValue = watch('email');

  // Validar email quando o usuário digitar
  useEffect(() => {
    if (emailValue && !errors.email && emailValue.includes('@')) {
      // Verificar se é um email válido usando regex simples
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(emailValue)) {
        setEmailValidated(true);
      }
    } else if (!emailValue || errors.email) {
      setEmailValidated(false);
    }
  }, [emailValue, errors.email]);

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
    <main
      role="main"
      aria-label="Página de login"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="min-h-screen flex" style={{ pointerEvents: 'auto' }}>
        {/* Imagem da Imobiliária - Lado Esquerdo */}
        <motion.div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
          <img
            src="https://madiaimoveis.com.br/wp-content/uploads/2025/09/Predio.webp"
            alt="Imobiliária"
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />

          {/* Overlay com texto profissional */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Gestão Imobiliária
                </h2>
              </div>
              <p className="text-lg text-white/90 max-w-md mx-auto">
                Sistema completo para gestão interna de imóveis, contratos e
                processos administrativos.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Modal de Login - Lado Direito */}
        <div
          className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 relative z-30"
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            className="w-full max-w-md relative z-40"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <motion.div
              className="mb-10 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Bem-vindo
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Entre com suas credenciais
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Modal Card */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative z-50"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{ pointerEvents: 'auto' }}
            >
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    {error}
                  </p>
                </motion.div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="p-8 space-y-6 relative z-50"
                style={{ pointerEvents: 'auto' }}
              >
                {/* Email Field - Sempre visível */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-600 pointer-events-none z-10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            // Resetar validação se o usuário mudar o email
                            if (
                              emailValidated &&
                              e.target.value !== emailValue
                            ) {
                              setEmailValidated(false);
                            }
                          }}
                          name={field.name}
                          ref={field.ref}
                          className={`
                            w-full pl-11 pr-4 py-3
                            bg-gray-50 dark:bg-gray-700/50
                            border rounded-xl
                            text-gray-900 dark:text-white text-base
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            transition-all duration-200
                            focus:outline-none focus:bg-white dark:focus:bg-gray-700
                            ${
                              focusedField === 'email'
                                ? 'border-blue-600 shadow-md shadow-blue-500/20'
                                : emailValidated && !errors.email
                                  ? 'border-green-500 shadow-md shadow-green-500/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }
                            ${errors.email ? 'border-red-500 shadow-red-500/20' : ''}
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                          disabled={isLoading}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => {
                            field.onBlur();
                            setFocusedField(null);
                          }}
                          required
                          autoComplete="email"
                        />
                      )}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 dark:text-red-400 ml-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>

                {/* Password Field - Aparece apenas quando email é válido */}
                {emailValidated && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Senha
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-600 pointer-events-none z-10">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            value={field.value || ''}
                            onChange={field.onChange}
                            name={field.name}
                            ref={field.ref}
                            className={`
                              w-full pl-11 pr-11 py-3
                              bg-gray-50 dark:bg-gray-700/50
                              border rounded-xl
                              text-gray-900 dark:text-white text-base
                              placeholder:text-gray-400 dark:placeholder:text-gray-500
                              transition-all duration-200
                              focus:outline-none focus:bg-white dark:focus:bg-gray-700
                              ${
                                focusedField === 'password'
                                  ? 'border-blue-600 shadow-md shadow-blue-500/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }
                              ${errors.password ? 'border-red-500 shadow-red-500/20' : ''}
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            disabled={isLoading}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => {
                              field.onBlur();
                              setFocusedField(null);
                            }}
                            required
                            autoComplete="current-password"
                            autoFocus
                          />
                        )}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-20"
                        disabled={isLoading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={
                          showPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 pointer-events-none" />
                        ) : (
                          <Eye className="w-5 h-5 pointer-events-none" />
                        )}
                      </motion.button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 dark:text-red-400 ml-1"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Remember Password e Esqueceu a senha - Aparecem apenas quando senha está visível */}
                {emailValidated && (
                  <motion.div
                    className="flex items-center justify-between pt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Lembrar-me
                      </span>
                    </label>
                    <Link to="/forgot-password">
                      <motion.span
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer inline-block"
                        whileHover={{ x: 2 }}
                      >
                        Esqueceu a senha?
                      </motion.span>
                    </Link>
                  </motion.div>
                )}

                {/* Submit Button - Aparece apenas quando senha está visível */}
                {emailValidated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className={`
                        w-full py-3 rounded-xl font-semibold text-white text-base
                        transition-all duration-200 relative overflow-hidden
                        flex items-center justify-center gap-2
                        ${
                          isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        }
                      `}
                      whileHover={!isLoading ? { scale: 1.01 } : {}}
                      whileTap={!isLoading ? { scale: 0.99 } : {}}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
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
                        'Entrar'
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 Gestão Imobiliária. Todos os direitos reservados.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default Login;
