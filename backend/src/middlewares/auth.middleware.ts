import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    // Reject tokens that are pending 2FA verification
    if ((req.user as any).pending2FA) {
      return reply.status(401).send({
        error: 'Verificação 2FA pendente',
        code: 'PENDING_2FA',
      });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Não autenticado' });
  }
}

/**
 * Middleware específico para proteger rotas de administrador
 */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();

    // Verificar se é ADMIN
    if (req.user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Acesso negado. Apenas administradores podem acessar este recurso.',
      });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Não autenticado' });
  }
}

export function requireRole(role: 'ADMIN' | 'LOJA') {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.user.role !== role) {
      return reply.status(403).send({ error: 'Acesso negado' });
    }
  };
}
