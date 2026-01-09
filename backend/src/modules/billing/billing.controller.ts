import { FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from './billing.service';
import { z } from 'zod';
import { stripe } from '../../lib/stripe';

const billingService = new BillingService();

// Schemas de validação
const checkoutSchema = z.object({
  plan: z.enum(['FREE', 'TESTE_A', 'TESTE_B', 'TESTE_C', 'PRO', 'BUSINESS', 'ENTERPRISE']),
});

/**
 * POST /api/billing/checkout
 * Cria sessão de checkout para assinatura
 */
export async function createCheckout(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { plan } = checkoutSchema.parse(req.body);
    const userId = req.user.userId;

    const session = await billingService.createCheckoutSession(userId, plan);

    return reply.send({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('❌ Erro no createCheckout:', error);
    return reply.status(400).send({
      error: error.message || 'Erro ao criar sessão de checkout',
    });
  }
}

/**
 * POST /api/billing/portal
 * Cria sessão do Customer Portal do Stripe
 */
export async function createPortal(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req.user.userId;
    const session = await billingService.createPortalSession(userId);

    return reply.send({
      url: session.url,
    });
  } catch (error: any) {
    console.error('❌ Erro no createPortal:', error);
    return reply.status(400).send({
      error: error.message || 'Erro ao criar sessão do portal',
    });
  }
}

/**
 * GET /api/billing/subscription
 * Retorna informações da assinatura atual
 */
export async function getSubscription(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req.user.userId;
    const subscription = await billingService.getSubscriptionInfo(userId);

    return reply.send(subscription);
  } catch (error: any) {
    console.error('❌ Erro no getSubscription:', error);
    return reply.status(400).send({
      error: error.message || 'Erro ao buscar informações da assinatura',
    });
  }
}

/**
 * POST /api/billing/cancel
 * Cancela assinatura no final do período
 */
export async function cancelSubscription(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req.user.userId;
    const subscription = await billingService.cancelSubscription(userId);

    return reply.send({
      message: 'Assinatura cancelada com sucesso',
      cancelAt: new Date((subscription as any).current_period_end * 1000),
      willCancelAt: new Date((subscription as any).current_period_end * 1000),
    });
  } catch (error: any) {
    console.error('❌ Erro no cancelSubscription:', error);
    return reply.status(400).send({
      error: error.message || 'Erro ao cancelar assinatura',
    });
  }
}

/**
 * POST /api/billing/reactivate
 * Reativa assinatura cancelada (antes do período terminar)
 */
export async function reactivateSubscription(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req.user.userId;
    const subscription = await billingService.reactivateSubscription(userId);

    return reply.send({
      message: 'Assinatura reativada com sucesso',
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    });
  } catch (error: any) {
    console.error('❌ Erro no reactivateSubscription:', error);
    return reply.status(400).send({
      error: error.message || 'Erro ao reativar assinatura',
    });
  }
}

/**
 * POST /api/billing/webhook
 * Recebe e processa webhooks do Stripe
 *
 * IMPORTANTE: Esta rota não requer autenticação, mas valida
 * a assinatura do Stripe para garantir que a requisição é legítima
 */
export async function handleWebhook(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Webhook sem assinatura Stripe');
    return reply.status(400).send({ error: 'Assinatura ausente' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET não configurado');
    return reply.status(500).send({ error: 'Webhook secret não configurado' });
  }

  try {
    // Validar assinatura do Stripe usando raw body
    const rawBody = (req as any).rawBody as Buffer;

    if (!rawBody) {
      console.error('❌ Raw body não disponível para webhook');
      return reply.status(400).send({ error: 'Raw body não disponível' });
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Processar evento de forma assíncrona
    // Não bloquear a resposta, pois o Stripe tem timeout de 30s
    setImmediate(async () => {
      try {
        await billingService.handleWebhook(event);
      } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
      }
    });

    // Responder imediatamente ao Stripe
    return reply.send({ received: true });
  } catch (error: any) {
    console.error('❌ Erro ao validar webhook:', error.message);
    return reply.status(400).send({
      error: 'Erro ao validar assinatura do webhook',
      message: error.message,
    });
  }
}
