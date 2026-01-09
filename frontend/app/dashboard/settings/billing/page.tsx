'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Gratuito',
  TESTE_A: 'Teste A',
  TESTE_B: 'Teste B',
  TESTE_C: 'Teste C',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  TESTE_A: 10,
  TESTE_B: 50,
  TESTE_C: 100,
  PRO: 147,
  BUSINESS: 497,
  ENTERPRISE: 997,
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'bg-[#00ff88]' },
  trialing: { label: 'Em período de teste', color: 'bg-[#ffeb3b]' },
  past_due: { label: 'Pagamento atrasado', color: 'bg-[#ff3366]' },
  canceled: { label: 'Cancelada', color: 'bg-gray-400' },
  unpaid: { label: 'Não paga', color: 'bg-[#ff3366]' },
};

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/billing/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setActionLoading('portal');
      const response = await api.post('/api/billing/portal');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você ainda terá acesso até o final do período pago.')) {
      return;
    }

    try {
      setActionLoading('cancel');
      await api.post('/api/billing/cancel');
      await loadSubscription();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading('reactivate');
      await api.post('/api/billing/reactivate');
      await loadSubscription();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="font-bold uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  const planName = PLAN_NAMES[subscription?.plan || 'FREE'] || subscription?.plan;
  const planPrice = PLAN_PRICES[subscription?.plan || 'FREE'] || 0;
  const statusInfo = STATUS_LABELS[subscription?.status || 'active'] || { label: subscription?.status, color: 'bg-gray-400' };

  return (
    <div className="min-h-screen bg-white grid-bg p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase mb-4">
            Faturamento
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            Gerencie sua assinatura e métodos de pagamento
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Plano Atual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white brutal-border brutal-shadow p-8 rotate-1"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold uppercase mb-2">
                  Plano Atual
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold">{planName}</span>
                  {planPrice > 0 && (
                    <span className="text-xl text-gray-600">
                      R$ {planPrice}/mês
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-4 py-2 ${statusInfo.color} brutal-border brutal-shadow-sm`}
              >
                <span className="font-bold uppercase text-sm text-black">
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Informações da Assinatura */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {subscription?.currentPeriodEnd && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#ffeb3b] brutal-border flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold uppercase text-sm text-gray-600 mb-1">
                      Próxima Cobrança
                    </p>
                    <p className="font-bold text-lg">
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              )}

              {subscription?.cancelAtPeriodEnd && subscription?.cancelAt && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#ff3366] brutal-border flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold uppercase text-sm text-gray-600 mb-1">
                      Cancela Em
                    </p>
                    <p className="font-bold text-lg">
                      {formatDate(subscription.cancelAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-4">
              {subscription?.plan !== 'FREE' && subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && (
                <>
                  <motion.button
                    whileHover={{ x: 4, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenPortal}
                    disabled={actionLoading === 'portal'}
                    className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] brutal-border-thick brutal-shadow font-extrabold uppercase text-sm hover:bg-[#00ff88]/90 transition disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" strokeWidth={3} />
                    {actionLoading === 'portal' ? 'ABRINDO...' : 'GERENCIAR ASSINATURA'}
                    <ExternalLink className="w-4 h-4" strokeWidth={3} />
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                    className="flex items-center gap-2 px-6 py-3 bg-white brutal-border-thick brutal-shadow font-extrabold uppercase text-sm hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" strokeWidth={3} />
                    {actionLoading === 'cancel' ? 'CANCELANDO...' : 'CANCELAR PLANO'}
                  </motion.button>
                </>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <motion.button
                  whileHover={{ x: 4, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading === 'reactivate'}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] brutal-border-thick brutal-shadow font-extrabold uppercase text-sm hover:bg-[#00ff88]/90 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                  {actionLoading === 'reactivate' ? 'REATIVANDO...' : 'REATIVAR ASSINATURA'}
                </motion.button>
              )}

              {subscription?.plan === 'FREE' && (
                <motion.button
                  whileHover={{ x: 4, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] brutal-border-thick brutal-shadow font-extrabold uppercase text-sm hover:bg-[#00ff88]/90 transition"
                >
                  FAZER UPGRADE
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Informações Adicionais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white brutal-border brutal-shadow p-8 -rotate-1"
          >
            <h3 className="text-xl font-extrabold uppercase mb-4">
              Sobre o Gerenciamento
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="font-medium">
                  Use o <strong>Customer Portal</strong> do Stripe para atualizar seu cartão de crédito
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="font-medium">
                  Ao cancelar, você <strong>mantém acesso</strong> até o final do período pago
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="font-medium">
                  Você pode <strong>reativar sua assinatura</strong> a qualquer momento antes do cancelamento efetivo
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="font-medium">
                  Todas as transações são <strong>processadas com segurança</strong> pelo Stripe
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Voltar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-white brutal-border brutal-shadow-sm font-bold uppercase text-sm hover:bg-gray-50 transition"
            >
              ← Voltar ao Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
