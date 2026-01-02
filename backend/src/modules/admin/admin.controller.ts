import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';

const adminService = new AdminService();

/**
 * GET /api/admin/stats
 * Retorna estatísticas globais do sistema
 */
export async function getStats(req: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await adminService.getStats();
    return reply.send(stats);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao buscar estatísticas',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/users
 * Lista todos os usuários
 */
export async function listUsers(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { page = 1, limit = 10, search } = req.query as any;

    const result = await adminService.listUsers(
      Number(page),
      Number(limit),
      search
    );

    return reply.send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao listar usuários',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/users/:id
 * Busca detalhes de um usuário
 */
export async function getUserById(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const user = await adminService.getUserById(id);
    return reply.send(user);
  } catch (error: any) {
    return reply.status(404).send({
      error: 'Usuário não encontrado',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/organizations
 * Lista todas as organizações
 */
export async function listOrganizations(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { page = 1, limit = 10 } = req.query as any;

    const result = await adminService.listOrganizations(
      Number(page),
      Number(limit)
    );

    return reply.send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao listar organizações',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/organizations/:id
 * Busca detalhes de uma organização
 */
export async function getOrganizationById(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const organization = await adminService.getOrganizationById(id);
    return reply.send(organization);
  } catch (error: any) {
    return reply.status(404).send({
      error: 'Organização não encontrada',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Atualizar role do usuário
 */
export async function updateUserRole(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: 'ADMIN' | 'LOJA' };

    if (!role || !['ADMIN', 'LOJA'].includes(role)) {
      return reply.status(400).send({
        error: 'Role inválida',
        message: 'Role deve ser ADMIN ou LOJA',
      });
    }

    const user = await adminService.updateUserRole(id, role);
    return reply.send(user);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao atualizar role',
      message: error.message,
    });
  }
}

/**
 * POST /api/admin/users/:id/reset-password
 * Resetar senha do usuário
 */
export async function resetUserPassword(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const { newPassword } = req.body as { newPassword: string };

    if (!newPassword || newPassword.length < 6) {
      return reply.status(400).send({
        error: 'Senha inválida',
        message: 'Senha deve ter pelo menos 6 caracteres',
      });
    }

    await adminService.resetUserPassword(id, newPassword);
    return reply.send({
      success: true,
      message: 'Senha resetada com sucesso',
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao resetar senha',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/logs
 * Lista logs de auditoria
 */
export async function listAuditLogs(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      tableName,
      startDate,
      endDate,
    } = req.query as any;

    const filters: any = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (tableName) filters.tableName = tableName;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await adminService.listAuditLogs(
      Number(page),
      Number(limit),
      filters
    );

    return reply.send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao listar logs',
      message: error.message,
    });
  }
}
