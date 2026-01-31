import { FastifyInstance } from 'fastify';
import { register, login, me, verify2FALogin, forgotPassword, resetPassword } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  // Públicas
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.post('/2fa/verify', verify2FALogin);
  fastify.post('/forgot-password', forgotPassword);
  fastify.post('/reset-password', resetPassword);

  // Protegidas
  fastify.get('/me', { preHandler: [authenticate] }, me);
}
