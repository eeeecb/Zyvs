'use client';

import { useAuthStore } from '@/stores/auth';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const [realContactsCount, setRealContactsCount] = useState<number>(0);
  const [realFlowsCount, setRealFlowsCount] = useState<number>(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detectar checkout=success e atualizar dados do usuário
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');

    if (checkoutStatus === 'success') {
      // Remover query param da URL
      router.replace('/dashboard', { scroll: false });

      // Buscar dados atualizados do usuário
      const refreshUserData = async () => {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data.user);
          toast.success('Plano ativado com sucesso!', {
            description: `Você agora está no plano ${response.data.user.organization?.plan || response.data.user.plan}`,
          });
        } catch (error) {
          console.error('Erro ao atualizar dados do usuário:', error);
          toast.error('Erro ao verificar plano', {
            description: 'Por favor, recarregue a página',
          });
        }
      };

      refreshUserData();
    }
  }, [searchParams, router, setUser]);

  // Buscar contagem real de contatos e flows
  useEffect(() => {
    const fetchContactsCount = async () => {
      try {
        const response = await api.get('/api/contacts', {
          params: { page: 1, limit: 1 },
        });
        setRealContactsCount(response.data.pagination.total);
      } catch (error) {
        console.error('Erro ao buscar contagem de contatos:', error);
      }
    };

    const fetchFlowsCount = async () => {
      try {
        const response = await api.get('/api/flows', {
          params: { page: 1, limit: 1 },
        });
        setRealFlowsCount(response.data.pagination.total);
      } catch (error) {
        console.error('Erro ao buscar contagem de flows:', error);
      }
    };

    if (user?.organizationId) {
      fetchContactsCount();
      fetchFlowsCount();
    }
  }, [user?.organizationId]);

  const stats = [
    {
      name: 'Contatos',
      value: realContactsCount,
      max: user?.organization?.maxContacts || 100,
      icon: Users,
      color: '#00ff88',
    },
    {
      name: 'Flows Ativos',
      value: realFlowsCount,
      max: user?.organization?.maxFlows || 3,
      icon: Zap,
      color: '#ff3366',
    },
    {
      name: 'Mensagens',
      value: user?.organization?.currentMessagesThisMonth || 0,
      max: user?.organization?.maxMessagesPerMonth || 500,
      icon: MessageSquare,
      color: '#ffeb3b',
    },
    {
      name: 'Conversão',
      value: '0%',
      icon: TrendingUp,
      color: '#00ff88',
    },
  ];

  const hasContacts = realContactsCount > 0;

  const quickActions = [
    {
      icon: Users,
      title: hasContacts ? 'Contatos' : 'Adicionar Contatos',
      description: 'Importe ou adicione manualmente',
      href: '/dashboard/clientes',
      ctaText: hasContacts ? 'Ir para contatos' : 'Adicionar agora',
    },
    {
      icon: Zap,
      title: 'Criar Automação',
      description: 'Configure fluxos inteligentes',
      href: '/dashboard/automacoes',
    },
    {
      icon: MessageSquare,
      title: 'Nova Campanha',
      description: 'Envie mensagens em massa',
      href: '/dashboard/campanhas',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-4xl font-extrabold text-black mb-2">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-600 font-medium">
          {user?.role === 'ADMIN'
            ? 'Visão geral do sistema'
            : 'Aqui está o resumo do seu negócio'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ backgroundColor: stat.color }}
              >
                <stat.icon className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                {stat.name}
              </p>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-bold text-black">
                {typeof stat.value === 'number'
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>
              {stat.max && (
                <p className="text-sm text-gray-500">/ {stat.max}</p>
              )}
            </div>

            {stat.max && typeof stat.value === 'number' && (
              <div className="bg-gray-100 h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    backgroundColor: stat.color,
                    width: `${Math.min((stat.value / stat.max) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-black mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={action.title} href={action.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white border-2 border-gray-200 hover:border-black p-6 transition-all cursor-pointer group"
              >
                <action.icon className="w-8 h-8 text-black mb-4" strokeWidth={2} />
                <h3 className="font-bold text-black mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {action.description}
                </p>
                <span className="text-sm font-bold text-black group-hover:text-[#00ff88] transition flex items-center gap-2">
                  {action.ctaText || 'Em breve'}
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Organization Info */}
      {user?.organization && (
        <div className="bg-gray-50 border-2 border-black p-6">
          <h3 className="text-xl font-bold text-black mb-6">Sua Organização</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                Nome
              </p>
              <p className="font-bold text-black text-lg">
                {user.organization.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                Plano
              </p>
              <span className="inline-flex items-center px-3 py-1 bg-[#00ff88] border-2 border-black font-bold uppercase text-sm">
                {user.organization.plan || 'FREE'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                Slug
              </p>
              <p className="font-bold text-black text-lg">
                {user.organization.slug}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
