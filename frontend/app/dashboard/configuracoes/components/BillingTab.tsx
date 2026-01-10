'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SettingsCard } from './SettingsCard';
import {
  CreditCard,
  Calendar,
  FileText,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

export function BillingTab() {
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
      toast.error('Erro ao carregar dados de cobrança');
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
      toast.error('Erro ao abrir portal de pagamento');
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Tem certeza que deseja cancelar? Você terá acesso até o final do período pago.'
      )
    ) {
      return;
    }

    try {
      setActionLoading('cancel');
      await api.post('/api/billing/cancel');
      await loadSubscription();
      toast.success('Assinatura cancelada com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const planName = PLAN_NAMES[subscription?.plan || 'FREE'] || subscription?.plan;
  const planPrice = PLAN_PRICES[subscription?.plan || 'FREE'] || 0;

  return (
    <>
      {/* Current Plan Card */}
      <SettingsCard title="Seu Plano Atual" icon={CreditCard}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className={`inline-block px-4 py-2 border-2 border-black font-bold uppercase text-sm ${
                subscription?.status === 'active'
                  ? 'bg-[#00ff88]'
                  : 'bg-gray-200'
              }`}
            >
              {planName}
            </div>
            {planPrice > 0 && (
              <p className="text-gray-600 mt-2">R$ {planPrice}/mês</p>
            )}
          </div>

          <div
            className={`px-3 py-1 border-2 border-black text-xs font-bold uppercase ${
              subscription?.status === 'active'
                ? 'bg-[#00ff88]'
                : 'bg-[#ff3366] text-white'
            }`}
          >
            {subscription?.status === 'active' ? 'Ativa' : subscription?.status}
          </div>
        </div>

        {subscription?.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <Calendar className="w-4 h-4" />
            <span>
              Próxima cobrança: {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        {subscription?.cancelAtPeriodEnd && subscription?.cancelAt && (
          <div className="flex items-center gap-2 p-3 bg-[#ff3366]/10 border-2 border-[#ff3366] mb-4">
            <AlertCircle className="w-5 h-5 text-[#ff3366]" />
            <span className="text-sm font-medium">
              Cancela em: {formatDate(subscription.cancelAt)}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {subscription?.plan !== 'FREE' &&
            subscription?.status === 'active' &&
            !subscription?.cancelAtPeriodEnd && (
              <>
                <button
                  onClick={handleOpenPortal}
                  disabled={actionLoading === 'portal'}
                  className="px-4 py-2 bg-black text-[#00ff88] hover:bg-gray-900 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
                >
                  {actionLoading === 'portal' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Abrindo...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Alterar Plano
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading === 'cancel'}
                  className="px-4 py-2 border-2 border-black hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
                >
                  {actionLoading === 'cancel' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Cancelar Assinatura'
                  )}
                </button>
              </>
            )}

          {subscription?.plan === 'FREE' && (
            <button
              onClick={() => router.push('/pricing')}
              className="px-4 py-2 bg-[#00ff88] border-2 border-black hover:bg-[#00ff88]/90 transition flex items-center gap-2 font-bold text-sm"
            >
              Fazer Upgrade
            </button>
          )}
        </div>
      </SettingsCard>

      {/* Payment Method Card */}
      <SettingsCard title="Método de Pagamento" icon={CreditCard}>
        <p className="text-sm text-gray-600 mb-4">
          Gerencie seus métodos de pagamento através do Customer Portal do
          Stripe.
        </p>

        <button
          onClick={handleOpenPortal}
          disabled={actionLoading === 'portal'}
          className="px-4 py-2 border-2 border-black hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
        >
          {actionLoading === 'portal' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Abrindo...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Atualizar Cartão
            </>
          )}
        </button>
      </SettingsCard>

      {/* Invoice History Card */}
      <SettingsCard title="Histórico de Faturas" icon={FileText}>
        <p className="text-sm text-gray-600 mb-4">
          Acesse todas as suas faturas através do Customer Portal do Stripe.
        </p>

        <button
          onClick={handleOpenPortal}
          disabled={actionLoading === 'portal'}
          className="px-4 py-2 border-2 border-black hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2 font-bold text-sm"
        >
          {actionLoading === 'portal' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Abrindo...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Ver Todas as Faturas
            </>
          )}
        </button>
      </SettingsCard>
    </>
  );
}
