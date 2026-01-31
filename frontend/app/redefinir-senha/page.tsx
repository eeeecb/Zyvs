'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ArrowLeft, Sparkles, Lock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenMissing, setIsTokenMissing] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsTokenMissing(true);
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setError('');
      setIsLoading(true);

      await api.post('/api/auth/reset-password', {
        token,
        password: data.password,
      });

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Erro ao redefinir senha');
      } else {
        setError('Erro ao redefinir senha');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'MUITO FRACA', color: '#ff3366', width: '20%' };
    if (pwd.length < 8) return { label: 'FRACA', color: '#ff9800', width: '40%' };
    if (pwd.length < 10) return { label: 'MÉDIA', color: '#ffeb3b', width: '60%' };
    if (pwd.length < 12) return { label: 'FORTE', color: '#8bc34a', width: '80%' };
    return { label: 'MUITO FORTE', color: '#00ff88', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black p-12 flex-col justify-between relative overflow-hidden grid-bg">
        {/* Geometric shapes background */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#00ff88] opacity-10 rotate-12"></div>
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-[#ff3366] opacity-5 -rotate-6"></div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/">
            <motion.div
              whileHover={{ x: 2, y: -2 }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-14 h-14 bg-[#00ff88] brutal-border brutal-shadow-sm flex items-center justify-center">
                <span className="text-black font-extrabold text-2xl">T</span>
              </div>
              <span className="text-3xl font-extrabold text-white tracking-tighter">THUMDRA</span>
            </motion.div>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-block mb-6 -rotate-1">
              <div className="px-4 py-2 bg-[#00ff88] text-black brutal-border brutal-shadow-sm font-bold uppercase text-xs tracking-wider">
                <Sparkles className="w-4 h-4 inline mr-2" strokeWidth={3} />
                NOVA SENHA
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight uppercase">
              CRIAR NOVA
              <br />
              <span className="text-[#00ff88]">SENHA</span>
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              Escolha uma senha forte para proteger sua conta.
            </p>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-[#00ff88] brutal-border flex items-center justify-center">
                <Lock className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold uppercase text-sm">Mínimo 6 caracteres</span>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-gray-400 text-xs font-bold uppercase">
          © 2024 THUMDRA • MADE IN BRAZIL 🇧🇷
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white grid-bg">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-10 h-10 bg-black brutal-border flex items-center justify-center">
                  <span className="text-[#00ff88] font-extrabold text-xl">T</span>
                </div>
                <span className="text-2xl font-extrabold tracking-tighter">
                  THUMDRA
                </span>
              </div>
            </Link>
          </div>

          {/* Back button */}
          <Link href="/login">
            <motion.button
              whileHover={{ x: -2, y: -2 }}
              className="flex items-center gap-2 mb-8 px-4 py-2 brutal-border brutal-shadow-sm bg-white hover:bg-gray-50 transition font-bold uppercase text-xs"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              <span>Voltar para Login</span>
            </motion.button>
          </Link>

          {isTokenMissing ? (
            // Token missing state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-[#ff3366] brutal-border brutal-shadow mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 uppercase">
                LINK INVÁLIDO
              </h1>
              <p className="text-gray-600 font-medium mb-8">
                O link de recuperação está incompleto ou inválido. Solicite um novo link.
              </p>
              <Link href="/esqueci-senha">
                <motion.button
                  whileHover={{ x: 2, y: -2 }}
                  className="px-6 py-3 bg-[#00ff88] text-black brutal-border brutal-shadow font-bold uppercase text-sm hover:bg-[#00ff88]/90 transition"
                >
                  Solicitar Novo Link
                </motion.button>
              </Link>
            </motion.div>
          ) : isSuccess ? (
            // Success state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-[#00ff88] brutal-border brutal-shadow mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-black" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 uppercase">
                SENHA ALTERADA!
              </h1>
              <p className="text-gray-600 font-medium mb-8">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecionando...</span>
              </div>
            </motion.div>
          ) : (
            // Form state
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 uppercase leading-tight">
                  CRIAR NOVA
                  <br />
                  <span className="text-[#00ff88]">SENHA</span>
                </h1>
                <p className="text-lg font-bold text-gray-600 uppercase text-sm">
                  Digite sua nova senha abaixo
                </p>
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {error && (
                  <div className="bg-[#ff3366] text-white p-4 brutal-border brutal-shadow-sm text-sm font-bold uppercase">
                    {error}
                    {error.includes('expirado') || error.includes('inválido') ? (
                      <Link href="/esqueci-senha" className="block mt-2 underline">
                        Solicitar novo link
                      </Link>
                    ) : null}
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Nova Senha
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full px-4 py-3 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.password.message}</p>
                  )}

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 brutal-border overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                      </div>
                      <p className="text-xs mt-1 font-bold uppercase" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Confirmar Senha
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    className="w-full px-4 py-3 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ x: 4, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00ff88] text-black py-4 brutal-border-thick brutal-shadow hover:brutal-shadow-lg font-extrabold uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      REDEFININDO...
                    </>
                  ) : (
                    'REDEFINIR SENHA'
                  )}
                </motion.button>
              </motion.form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-bold uppercase text-sm">Carregando...</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
