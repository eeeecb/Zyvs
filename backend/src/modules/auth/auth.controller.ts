import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { BillingService } from '../billing/billing.service';

const authService = new AuthService();
const billingService = new BillingService();

export async function register(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);

    // Gerar token JWT
    const token = req.server.jwt.sign({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    // Criar sessão de checkout no Stripe
    const session = await billingService.createCheckoutSession(user.id, data.plan);

    return reply.status(201).send({
      user,
      token,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    return reply.status(400).send({
      error: error.message,
    });
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authService.login(data);

    // Gerar token JWT
    const token = req.server.jwt.sign({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    });

    return reply.send({
      user,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    return reply.status(401).send({
      error: error.message,
    });
  }
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = req.user.userId;
    const user = await authService.getProfile(userId);

    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' });
    }

    return reply.send({ user });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
}
