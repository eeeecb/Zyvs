import { FastifyInstance } from 'fastify';
import {
  createCheckout,
  createPortal,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  handleWebhook,
} from './billing.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function billingRoutes(fastify: FastifyInstance) {
  // Rotas protegidas (requerem autenticação)
  fastify.post('/checkout', { preHandler: [authenticate] }, createCheckout);
  fastify.post('/portal', { preHandler: [authenticate] }, createPortal);
  fastify.get('/subscription', { preHandler: [authenticate] }, getSubscription);
  fastify.post('/cancel', { preHandler: [authenticate] }, cancelSubscription);
  fastify.post('/reactivate', { preHandler: [authenticate] }, reactivateSubscription);

  // Webhook público (sem autenticação, validação feita via assinatura Stripe)
  fastify.post('/webhook', handleWebhook);
}
