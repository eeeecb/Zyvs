'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft, Sparkles, MessageSquare, Users, Zap } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      setIsLoading(true);

      const response = await api.post('/api/auth/login', data);
      const { user, token } = response.data;

      setAuth(user, token);

      // Sempre redirecionar para o dashboard normal
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Erro ao fazer login');
      } else {
        setError('Erro ao fazer login');
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
                BEM-VINDO DE VOLTA
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight uppercase">
              PRONTO PARA
              <br />
              <span className="text-[#00ff88]">VENDER MAIS?</span>
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              Acesse sua conta e continue automatizando relacionamentos que convertem.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-[#00ff88] brutal-border flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold uppercase text-sm">WhatsApp, Email e SMS integrados</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-[#ffeb3b] brutal-border flex items-center justify-center">
                <Users className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold uppercase text-sm">Gestão completa de contatos</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-[#ff3366] brutal-border flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold uppercase text-sm">Automações inteligentes</span>
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
          <Link href="/">
            <motion.button
              whileHover={{ x: -2, y: -2 }}
              className="flex items-center gap-2 mb-8 px-4 py-2 brutal-border brutal-shadow-sm bg-white hover:bg-gray-50 transition font-bold uppercase text-xs"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={3} />
              <span>Voltar</span>
            </motion.button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 uppercase leading-tight">
              FAÇA
              <br />
              <span className="text-[#00ff88]">LOGIN</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 uppercase text-sm">
              Entre na sua conta para continuar
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

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Senha
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
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <a href="#" className="text-sm font-bold uppercase hover:underline transition">
                Esqueceu sua senha?
              </a>
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ x: 4, y: -4 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00ff88] text-black py-4 brutal-border-thick brutal-shadow hover:brutal-shadow-lg font-extrabold uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
            </motion.button>

            {/* Sign up link */}
            <div className="text-center pt-4 brutal-border-t-3 border-black">
              <p className="text-sm text-gray-600 font-bold uppercase mb-2">
                Não tem uma conta?
              </p>
              <Link href="/cadastro">
                <motion.button
                  type="button"
                  whileHover={{ x: 2, y: -2 }}
                  className="px-6 py-2 bg-white brutal-border brutal-shadow-sm font-bold uppercase text-xs hover:bg-gray-50 transition"
                >
                  Criar conta grátis
                </motion.button>
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
