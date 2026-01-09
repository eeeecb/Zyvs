import Stripe from 'stripe';
import { stripe, STRIPE_PRICES } from '../../lib/stripe';
import { prisma } from '../../lib/prisma';
import { Plan } from '@prisma/client';

// Mapeamento de planos para limites
const PLAN_LIMITS = {
  FREE: { maxContacts: 100, maxFlows: 2, maxMessages: 500 },
  TESTE_A: { maxContacts: 1000, maxFlows: 5, maxMessages: 2000 },
  TESTE_B: { maxContacts: 5000, maxFlows: 15, maxMessages: 10000 },
  TESTE_C: { maxContacts: 10000, maxFlows: 30, maxMessages: 25000 },
  // Compatibilidade com planos legados
  PRO: { maxContacts: 5000, maxFlows: 15, maxMessages: 15000 },
  BUSINESS: { maxContacts: 50000, maxFlows: 50, maxMessages: 100000 },
  ENTERPRISE: { maxContacts: 999999, maxFlows: 999, maxMessages: 999999 },
} as const;

export class BillingService {
  /**
   * Cria ou recupera Customer no Stripe
   */
  async ensureStripeCustomer(
    userId: string,
    email: string,
    name: string
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    // Se já tem customer ID, retornar
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Criar novo customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Salvar no banco
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Cria sessão de checkout para assinatura
   */
  async createCheckoutSession(userId: string, plan: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          stripeCustomerId: true,
          plan: true,
        },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Validar plano
      const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
      if (!priceId) {
        throw new Error(`Plano inválido: ${plan}`);
      }

      // Verificar se não está tentando assinar o mesmo plano (exceto se for upgrade de FREE)
      if (user.plan === plan && user.plan !== 'FREE') {
        throw new Error('Você já está neste plano');
      }

      // Garantir que tem customer ID
      const customerId = await this.ensureStripeCustomer(
        userId,
        user.email,
        user.name
      );

      // Criar checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing?checkout=canceled`,
        metadata: {
          userId,
          plan,
        },
        subscription_data: {
          metadata: {
            userId,
            plan,
          },
          trial_period_days: 14, // 14 dias de trial
        },
        allow_promotion_codes: true, // Permitir cupons de desconto
      });

      return session;
    } catch (error: any) {
      console.error('❌ Erro ao criar checkout session:', error);
      throw new Error(
        error.message || 'Erro ao criar sessão de pagamento'
      );
    }
  }

  /**
   * Cria sessão do Customer Portal
   */
  async createPortalSession(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        throw new Error('Cliente Stripe não encontrado');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard/settings/billing`,
      });

      return session;
    } catch (error: any) {
      console.error('❌ Erro ao criar portal session:', error);
      throw new Error(
        error.message || 'Erro ao criar sessão do portal'
      );
    }
  }

  /**
   * Cancela assinatura no final do período
   */
  async cancelSubscription(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeSubscriptionId: true },
      });

      if (!user?.stripeSubscriptionId) {
        throw new Error('Assinatura não encontrada');
      }

      // Cancelar no final do período (não imediatamente)
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      // Atualizar planExpiry com a data do cancelamento
      await prisma.user.update({
        where: { id: userId },
        data: {
          planExpiry: new Date((subscription as any).current_period_end * 1000),
        },
      });

      return subscription;
    } catch (error: any) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      throw new Error(
        error.message || 'Erro ao cancelar assinatura'
      );
    }
  }

  /**
   * Reativa assinatura cancelada (antes do período terminar)
   */
  async reactivateSubscription(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeSubscriptionId: true },
      });

      if (!user?.stripeSubscriptionId) {
        throw new Error('Assinatura não encontrada');
      }

      // Remover cancelamento agendado
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Limpar planExpiry
      await prisma.user.update({
        where: { id: userId },
        data: {
          planExpiry: null,
        },
      });

      return subscription;
    } catch (error: any) {
      console.error('❌ Erro ao reativar assinatura:', error);
      throw new Error(
        error.message || 'Erro ao reativar assinatura'
      );
    }
  }

  /**
   * Atualiza plano do usuário e da organização
   */
  private async updateUserPlan(
    userId: string,
    plan: Plan,
    subscriptionId: string,
    currentPeriodEnd?: Date
  ) {
    const limits = PLAN_LIMITS[plan];

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        stripeSubscriptionId: subscriptionId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        planExpiry: null, // Limpar expiry quando ativa subscription
      },
      select: { organizationId: true },
    });

    // Atualizar limites da organização se o usuário pertence a uma
    if (user.organizationId) {
      await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          plan,
          maxContacts: limits.maxContacts,
          maxFlows: limits.maxFlows,
          maxMessagesPerMonth: limits.maxMessages,
        },
      });
    }

    console.log(`✅ Plano atualizado para usuário ${userId}: ${plan}`);
  }

  /**
   * Processa webhooks do Stripe
   */
  async handleWebhook(event: Stripe.Event) {
    console.log(`📥 Webhook recebido: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;
        }

        case 'customer.subscription.created': {
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
          break;
        }

        case 'customer.subscription.updated': {
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;
        }

        case 'customer.subscription.deleted': {
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;
        }

        case 'invoice.payment_succeeded': {
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;
        }

        case 'invoice.payment_failed': {
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice
          );
          break;
        }

        default:
          console.log(`ℹ️ Evento não tratado: ${event.type}`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar webhook ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handler: checkout.session.completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as Plan;
    const subscriptionId = session.subscription as string;

    if (!userId || !plan) {
      console.error('❌ Metadata incompleto no checkout.session.completed');
      return;
    }

    await this.updateUserPlan(userId, plan, subscriptionId);
    console.log(`✅ Checkout completo para usuário ${userId}`);
  }

  /**
   * Handler: customer.subscription.created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan as Plan;

    if (!userId || !plan) {
      console.log('ℹ️ Subscription criada sem metadata (possivelmente via checkout)');
      return;
    }

    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

    await this.updateUserPlan(userId, plan, subscription.id, currentPeriodEnd);
    console.log(`✅ Subscription criada para usuário ${userId}`);
  }

  /**
   * Handler: customer.subscription.updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.log('ℹ️ Subscription atualizada sem userId no metadata');
      return;
    }

    // Verificar se foi cancelada (agendado para o final do período)
    if (subscription.cancel_at_period_end) {
      const cancelAt = new Date((subscription as any).current_period_end * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: { planExpiry: cancelAt },
      });
      console.log(`⚠️ Subscription cancelada (fim do período) para usuário ${userId}`);
    } else {
      // Atualizar período atual
      const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCurrentPeriodEnd: currentPeriodEnd,
          planExpiry: null, // Limpar se foi reativada
        },
      });
      console.log(`✅ Subscription atualizada para usuário ${userId}`);
    }
  }

  /**
   * Handler: customer.subscription.deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      // Tentar buscar pelo subscription ID
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        select: { id: true },
      });

      if (!user) {
        console.error('❌ Não foi possível encontrar usuário para subscription deletada');
        return;
      }

      await this.updateUserPlan(user.id, 'FREE', '', undefined);
    } else {
      await this.updateUserPlan(userId, 'FREE', '', undefined);
    }

    console.log(`⚠️ Subscription deletada, downgrade para FREE`);
  }

  /**
   * Handler: invoice.payment_succeeded
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      return;
    }

    // Buscar subscription para pegar metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    // Atualizar período atual
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCurrentPeriodEnd: currentPeriodEnd,
      },
    });

    console.log(`✅ Pagamento bem-sucedido para usuário ${userId}`);
  }

  /**
   * Handler: invoice.payment_failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Buscar usuário pelo customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return;
    }

    // TODO: Enviar email notificando sobre falha no pagamento
    console.error(`❌ Pagamento falhou para usuário ${user.email}`);

    // Nota: Após 3 tentativas falhas, o Stripe automaticamente cancela a subscription
    // O evento customer.subscription.deleted será disparado nesse caso
  }

  /**
   * Busca informações da assinatura atual
   */
  async getSubscriptionInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        planExpiry: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Se não tem subscription, retornar info do plano FREE
    if (!user.stripeSubscriptionId) {
      return {
        plan: user.plan || 'FREE',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Buscar subscription no Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId
      );

      return {
        plan: user.plan,
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at
          ? new Date((subscription as any).cancel_at * 1000)
          : null,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar subscription:', error);
      return {
        plan: user.plan,
        status: 'unknown',
        currentPeriodEnd: user.stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: false,
      };
    }
  }
}
