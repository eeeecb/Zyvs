import { prisma } from '../../lib/prisma';

export class AdminService {
  /**
   * Retorna estatísticas globais do sistema
   */
  async getStats() {
    // Buscar totais em paralelo para melhor performance
    const [
      totalUsers,
      totalOrganizations,
      totalContacts,
      totalMessages,
      activeFlows,
      activeCampaigns,
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),

      // Total de organizações
      prisma.organization.count(),

      // Total de contatos
      prisma.contact.count(),

      // Total de mensagens enviadas
      prisma.message.count({
        where: {
          status: 'SENT',
        },
      }),

      // Flows ativos
      prisma.flow.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Campanhas ativas (SCHEDULED ou SENDING)
      prisma.campaign.count({
        where: {
          status: {
            in: ['SCHEDULED', 'SENDING'],
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalOrganizations,
      totalContacts,
      totalMessages,
      activeFlows,
      activeCampaigns,
    };
  }

  /**
   * Lista todos os usuários (com paginação)
   */
  async listUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          plan: true,
          planExpiry: true,
          messagesUsedThisMonth: true,
          flowExecutionsThisMonth: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          stripeCurrentPeriodEnd: true,
          onboardingCompleted: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
          _count: {
            select: {
              createdFlows: true,
              createdCampaigns: true,
              auditLogs: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lista todas as organizações
   */
  async listOrganizations(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
              stripeSubscriptionId: true,
            },
          },
          _count: {
            select: {
              members: true,
              contacts: true,
              flows: true,
              campaigns: true,
              messages: true,
              integrations: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.organization.count(),
    ]);

    return {
      organizations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca detalhes de uma organização específica
   */
  async getOrganizationById(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organização não encontrada');
    }

    // Buscar estatísticas da organização
    const [totalContacts, totalFlows, totalCampaigns] = await Promise.all([
      prisma.contact.count({
        where: {
          organizationId: organization.id,
        },
      }),
      prisma.flow.count({
        where: {
          organizationId: organization.id,
        },
      }),
      prisma.campaign.count({
        where: {
          organizationId: organization.id,
        },
      }),
    ]);

    return {
      ...organization,
      stats: {
        totalContacts,
        totalFlows,
        totalCampaigns,
      },
    };
  }

  /**
   * Busca detalhes de um usuário específico
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        plan: true,
        planExpiry: true,
        messagesUsedThisMonth: true,
        flowExecutionsThisMonth: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
        onboardingCompleted: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organization: true,
        _count: {
          select: {
            createdFlows: true,
            createdCampaigns: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Atualizar role de um usuário (promover/rebaixar)
   */
  async updateUserRole(userId: string, newRole: 'ADMIN' | 'LOJA') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return user;
  }

  /**
   * Resetar senha de um usuário
   */
  async resetUserPassword(userId: string, newPassword: string) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  /**
   * Lista logs de auditoria
   */
  async listAuditLogs(
    page = 1,
    limit = 20,
    filters?: {
      userId?: string;
      action?: string;
      tableName?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.tableName) {
      where.tableName = filters.tableName;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
