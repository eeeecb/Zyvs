import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Prices IDs dos planos de teste
export const STRIPE_PRICES = {
  FREE: null, // Grátis não tem price
  TESTE_A: process.env.STRIPE_PRICE_TESTE_A || '', // R$ 10
  TESTE_B: process.env.STRIPE_PRICE_TESTE_B || '', // R$ 50
  TESTE_C: process.env.STRIPE_PRICE_TESTE_C || '', // R$ 100
} as const;

// Mapeamento de planos antigos para novos (compatibilidade)
export const PLAN_MAPPING = {
  PRO: 'TESTE_A',
  BUSINESS: 'TESTE_B',
  ENTERPRISE: 'TESTE_C',
} as const;
