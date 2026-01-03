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
import PasswordStrength, { isPasswordStrong } from '@/components/auth/PasswordStrength';
import { ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
  plan: z.enum(['TESTE_A', 'TESTE_B', 'TESTE_C']).default('TESTE_A'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
}).refine((data) => isPasswordStrong(data.password), {
  message: 'Senha muito fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais',
  path: ['password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const plans = [
  {
    value: 'TESTE_A',
    label: 'Teste A',
    price: 10,
    description: '1.000 contatos • 5 flows',
    popular: true
  },
  {
    value: 'TESTE_B',
    label: 'Teste B',
    price: 50,
    description: '5.000 contatos • 15 flows'
  },
  {
    value: 'TESTE_C',
    label: 'Teste C',
    price: 100,
    description: '10.000 contatos • 30 flows'
  },
];

export default function CadastroPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('TESTE_A');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      plan: 'TESTE_A',
    },
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      setIsLoading(true);

      const { confirmPassword: _, ...registerData } = data;
      void _; // Explicitly ignore the unused variable
      const response = await api.post('/api/auth/register', registerData);
      const { user, token, checkoutUrl } = response.data;

      // Salvar token
      setAuth(user, token);

      // Redirecionar para checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Erro ao criar conta');
      } else {
        setError('Erro ao criar conta');
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
            <div className="inline-block mb-6 rotate-1">
              <div className="px-4 py-2 bg-[#ffeb3b] text-black brutal-border brutal-shadow-sm font-bold uppercase text-xs tracking-wider">
                <Sparkles className="w-4 h-4 inline mr-2" strokeWidth={3} />
                14 DIAS GRÁTIS
              </div>
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight uppercase">
              COMECE
              <br />
              <span className="text-[#00ff88]">AGORA MESMO</span>
            </h2>
            <p className="text-xl text-gray-300 font-medium mb-8">
              Escolha seu plano e teste grátis por 14 dias.
            </p>

            <div className="inline-block -rotate-1">
              <div className="px-5 py-3 bg-white brutal-border brutal-shadow text-black font-bold uppercase text-sm">
                SEM CARTÃO • CANCELE QUANDO QUISER
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 text-white">
              <div className="w-6 h-6 bg-[#00ff88] brutal-border flex-shrink-0 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <div>
                <div className="font-extrabold mb-1 uppercase text-sm">Setup em minutos</div>
                <div className="text-gray-400 text-sm font-medium">Configure tudo rapidamente e comece a usar hoje</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-white">
              <div className="w-6 h-6 bg-[#ffeb3b] brutal-border flex-shrink-0 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <div>
                <div className="font-extrabold mb-1 uppercase text-sm">Suporte dedicado</div>
                <div className="text-gray-400 text-sm font-medium">Nossa equipe está sempre pronta para ajudar</div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-white">
              <div className="w-6 h-6 bg-[#ff3366] brutal-border flex-shrink-0 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <div>
                <div className="font-extrabold mb-1 uppercase text-sm">Cancele quando quiser</div>
                <div className="text-gray-400 text-sm font-medium">Sem contratos ou taxas de cancelamento</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-gray-400 text-xs font-bold uppercase">
          © 2024 THUMDRA • MADE IN BRAZIL 🇧🇷
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white grid-bg overflow-y-auto">
        <div className="w-full max-w-md py-8">
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
              CRIAR
              <br />
              <span className="text-[#00ff88]">CONTA</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 uppercase text-sm">
              Escolha seu plano e comece agora
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

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Escolha seu plano
              </label>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <label
                    key={plan.value}
                    className="block relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      {...register('plan')}
                      value={plan.value}
                      checked={selectedPlan === plan.value}
                      onChange={(e) => {
                          setSelectedPlan(e.target.value);
                          setValue('plan', e.target.value as 'TESTE_A' | 'TESTE_B' | 'TESTE_C');
                        }}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 brutal-border transition ${
                        selectedPlan === plan.value
                          ? 'bg-[#00ff88] brutal-shadow'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold uppercase text-sm">
                              {plan.label}
                            </span>
                            {plan.popular && (
                              <span className="px-2 py-0.5 bg-[#ff3366] text-white text-xs font-bold uppercase brutal-border">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-700">
                            {plan.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-extrabold text-xl">
                            R$ {plan.price}
                          </div>
                          <div className="text-xs font-medium text-gray-600">
                            /mês
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-600 font-medium mt-2">
                14 dias grátis • Cancele quando quiser
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Nome completo
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-3 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                placeholder="Seu nome"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.name.message}</p>
              )}
            </div>

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
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                  placeholder="Crie uma senha forte"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.password.message}</p>
              )}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 brutal-border bg-white focus:outline-none focus:ring-4 focus:ring-[#00ff88]/30 transition font-medium"
                  placeholder="Digite a senha novamente"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-700 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[#ff3366] text-xs mt-2 font-bold uppercase">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-600 font-medium">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="font-bold underline hover:text-gray-900">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="font-bold underline hover:text-gray-900">
                Política de Privacidade
              </a>
              .
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ x: 4, y: -4 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00ff88] text-black py-4 brutal-border-thick brutal-shadow hover:brutal-shadow-lg font-extrabold uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  PROCESSANDO...
                </span>
              ) : (
                'CONTINUAR PARA PAGAMENTO'
              )}
            </motion.button>

            {/* Login link */}
            <div className="text-center pt-4 brutal-border-t-3 border-black">
              <p className="text-sm text-gray-600 font-bold uppercase mb-2">
                Já tem uma conta?
              </p>
              <Link href="/login">
                <motion.button
                  type="button"
                  whileHover={{ x: 2, y: -2 }}
                  className="px-6 py-2 bg-white brutal-border brutal-shadow-sm font-bold uppercase text-xs hover:bg-gray-50 transition"
                >
                  Fazer login
                </motion.button>
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
