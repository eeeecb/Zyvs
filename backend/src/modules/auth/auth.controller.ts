import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, verify2FALoginSchema } from './auth.schema';
import { BillingService } from '../billing/billing.service';

const authService = new AuthService();
const billingService = new BillingService();

// TempToken expiry for 2FA pending state (5 minutes)
const TEMP_TOKEN_EXPIRY = '5m';

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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate temporary token for 2FA verification
      const tempToken = req.server.jwt.sign(
        {
          userId: user.id,
          pending2FA: true,
        },
        { expiresIn: TEMP_TOKEN_EXPIRY }
      );

      return reply.send({
        requires2FA: true,
        tempToken,
      });
    }

    // No 2FA - generate full token
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
    return reply.status(400).send({
      error: error.message,
    });
  }
}

export async function verify2FALogin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = verify2FALoginSchema.parse(req.body);

    // Verify tempToken
    let decoded: { userId: string; pending2FA?: boolean };
    try {
      decoded = req.server.jwt.verify(data.tempToken) as { userId: string; pending2FA?: boolean };
    } catch {
      return reply.status(401).send({ error: 'Token expirado ou inválido' });
    }

    if (!decoded.pending2FA) {
      return reply.status(400).send({ error: 'Token inválido para verificação 2FA' });
    }

    // Verify 2FA code
    const user = await authService.verify2FALogin(
      decoded.userId,
      data.code,
      data.isBackupCode || false
    );

    // Generate full token
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
    return reply.status(400).send({
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
