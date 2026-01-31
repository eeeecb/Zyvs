'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ArrowLeft, Sparkles, Mail, CheckCircle, Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError('');
      setIsLoading(true);

      await api.post('/api/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Erro ao enviar email');
      } else {
        setError('Erro ao enviar email');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                RECUPERAR ACESSO
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight uppercase">
              ESQUECEU
              <br />
              <span className="text-[#00ff88]">SUA SENHA?</span>
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              Sem problemas! Vamos te ajudar a recuperar o acesso à sua conta.
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
                <Mail className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold uppercase text-sm">Enviaremos um link por email</span>
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

          {isSuccess ? (
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
                EMAIL ENVIADO!
              </h1>
              <p className="text-gray-600 font-medium mb-8">
                Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Verifique também sua caixa de spam.
              </p>
              <Link href="/login">
                <motion.button
                  whileHover={{ x: 2, y: -2 }}
                  className="px-6 py-3 bg-black text-white brutal-border brutal-shadow font-bold uppercase text-sm hover:bg-gray-900 transition"
                >
                  Voltar para Login
                </motion.button>
              </Link>
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
                  ESQUECEU SUA
                  <br />
                  <span className="text-[#00ff88]">SENHA?</span>
                </h1>
                <p className="text-lg font-bold text-gray-600 uppercase text-sm">
                  Digite seu email para receber o link de recuperação
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
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-4 py-3 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.email.message}</p>
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
                      ENVIANDO...
                    </>
                  ) : (
                    'ENVIAR LINK'
                  )}
                </motion.button>

                {/* Login link */}
                <div className="text-center pt-4 brutal-border-t-3 border-black">
                  <p className="text-sm text-gray-600 font-bold uppercase mb-2">
                    Lembrou sua senha?
                  </p>
                  <Link href="/login">
                    <motion.button
                      type="button"
                      whileHover={{ x: 2, y: -2 }}
                      className="px-6 py-2 bg-white brutal-border brutal-shadow-sm font-bold uppercase text-xs hover:bg-gray-50 transition"
                    >
                      Fazer Login
                    </motion.button>
                  </Link>
                </div>
              </motion.form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
