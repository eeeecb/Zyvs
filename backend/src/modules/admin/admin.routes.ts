import { FastifyInstance } from 'fastify';
import {
  getStats,
  listUsers,
  getUserById,
  updateUserRole,
  resetUserPassword,
  disable2FA,
  listOrganizations,
  getOrganizationById,
  listAuditLogs,
} from './admin.controller';
import { requireAdmin } from '../../middlewares/auth.middleware';

export async function adminRoutes(fastify: FastifyInstance) {
  // Todas as rotas admin requerem autenticação + role ADMIN
  fastify.addHook('preHandler', requireAdmin);

  // Estatísticas
  fastify.get('/stats', getStats);

  // Usuários
  fastify.get('/users', listUsers);
  fastify.get('/users/:id', getUserById);
  fastify.patch('/users/:id/role', updateUserRole);
  fastify.post('/users/:id/reset-password', resetUserPassword);
  fastify.post('/users/:id/disable-2fa', disable2FA);

  // Organizações
  fastify.get('/organizations', listOrganizations);
  fastify.get('/organizations/:id', getOrganizationById);

  // Logs de auditoria
  fastify.get('/logs', listAuditLogs);
}
