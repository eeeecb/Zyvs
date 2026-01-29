import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  moveContactSchema,
  pipelineFiltersSchema,
  DEFAULT_COLUMNS,
} from './kanban.schema';

/**
 * GET /api/kanban/columns
 * Listar todas as colunas do kanban com contagem de contatos
 */
export async function listColumns(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const columns = await prisma.kanbanColumn.findMany({
      where: { organizationId, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return reply.send({
      columns: columns.map((column) => ({
        ...column,
        contactsCount: column._count.contacts,
        _count: undefined,
      })),
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao listar colunas',
      message: error.message,
    });
  }
}

/**
 * POST /api/kanban/columns
 * Criar nova coluna
 */
export async function createColumn(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const data = createColumnSchema.parse(req.body);

    // Verificar se já existe coluna com mesmo nome
    const existing = await prisma.kanbanColumn.findFirst({
      where: {
        organizationId,
        name: { equals: data.name, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Já existe uma coluna com este nome' });
    }

    // Obter a maior ordem atual
    const lastColumn = await prisma.kanbanColumn.findFirst({
      where: { organizationId },
      orderBy: { order: 'desc' },
    });

    const newOrder = (lastColumn?.order ?? -1) + 1;

    // Se for default, remover flag das outras
    if (data.isDefault) {
      await prisma.kanbanColumn.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Se for final, remover flag das outras
    if (data.isFinal) {
      await prisma.kanbanColumn.updateMany({
        where: { organizationId, isFinal: true },
        data: { isFinal: false },
      });
    }

    const column = await prisma.kanbanColumn.create({
      data: {
        ...data,
        order: newOrder,
        organizationId,
      },
    });

    return reply.status(201).send(column);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao criar coluna',
      message: error.message,
    });
  }
}

/**
 * PUT /api/kanban/columns/:id
 * Atualizar coluna
 */
export async function updateColumn(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;
    const data = updateColumnSchema.parse(req.body);

    // Verificar se coluna existe
    const existing = await prisma.kanbanColumn.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Coluna não encontrada' });
    }

    // Verificar nome duplicado
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.kanbanColumn.findFirst({
        where: {
          organizationId,
          name: { equals: data.name, mode: 'insensitive' },
          isActive: true,
          NOT: { id },
        },
      });

      if (duplicate) {
        return reply.status(400).send({ error: 'Já existe uma coluna com este nome' });
      }
    }

    // Se for default, remover flag das outras
    if (data.isDefault) {
      await prisma.kanbanColumn.updateMany({
        where: { organizationId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    // Se for final, remover flag das outras
    if (data.isFinal) {
      await prisma.kanbanColumn.updateMany({
        where: { organizationId, isFinal: true, NOT: { id } },
        data: { isFinal: false },
      });
    }

    const column = await prisma.kanbanColumn.update({
      where: { id },
      data,
    });

    return reply.send(column);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao atualizar coluna',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/kanban/columns/:id
 * Deletar coluna (soft delete - marca como inativa)
 */
export async function deleteColumn(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { targetColumnId } = req.query as { targetColumnId?: string };
    const organizationId = req.user.organizationId;

    // Verificar se coluna existe
    const existing = await prisma.kanbanColumn.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { contacts: true } },
      },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Coluna não encontrada' });
    }

    // Se a coluna tem contatos, precisa de coluna destino ou confirmar remoção
    if (existing._count.contacts > 0) {
      if (targetColumnId) {
        // Mover contatos para outra coluna
        const targetColumn = await prisma.kanbanColumn.findFirst({
          where: { id: targetColumnId, organizationId, isActive: true },
        });

        if (!targetColumn) {
          return reply.status(400).send({ error: 'Coluna destino não encontrada' });
        }

        await prisma.contact.updateMany({
          where: { kanbanColumnId: id },
          data: { kanbanColumnId: targetColumnId },
        });
      } else {
        // Remover contatos da coluna (set null)
        await prisma.contact.updateMany({
          where: { kanbanColumnId: id },
          data: { kanbanColumnId: null },
        });
      }
    }

    // Soft delete: marcar como inativa
    await prisma.kanbanColumn.update({
      where: { id },
      data: { isActive: false },
    });

    return reply.send({ success: true, message: 'Coluna deletada com sucesso' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao deletar coluna',
      message: error.message,
    });
  }
}

/**
 * PUT /api/kanban/columns/reorder
 * Reordenar colunas
 */
export async function reorderColumns(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const { orderedIds } = reorderColumnsSchema.parse(req.body);

    // Verificar se todos os IDs pertencem à organização
    const columns = await prisma.kanbanColumn.findMany({
      where: { id: { in: orderedIds }, organizationId },
    });

    if (columns.length !== orderedIds.length) {
      return reply.status(400).send({ error: 'Algumas colunas não foram encontradas' });
    }

    // Atualizar ordem usando transação
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.kanbanColumn.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return reply.send({ success: true, message: 'Colunas reordenadas' });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao reordenar colunas',
      message: error.message,
    });
  }
}

/**
 * GET /api/kanban/contacts
 * Buscar contatos agrupados por coluna com filtros
 */
export async function listContacts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    const filters = pipelineFiltersSchema.parse(req.query);

    // Construir where clause
    const where: any = { organizationId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tagIds) {
      const tagIdList = filters.tagIds.split(',').filter(Boolean);
      if (tagIdList.length > 0) {
        where.tags = { some: { id: { in: tagIdList } } };
      }
    }

    if (filters.minDealValue !== undefined) {
      where.dealValue = { ...where.dealValue, gte: filters.minDealValue };
    }

    if (filters.maxDealValue !== undefined) {
      where.dealValue = { ...where.dealValue, lte: filters.maxDealValue };
    }

    if (filters.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.createdAfter) };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) };
    }

    // Buscar colunas ativas
    const columns = await prisma.kanbanColumn.findMany({
      where: { organizationId, isActive: true },
      orderBy: { order: 'asc' },
    });

    // Buscar contatos por coluna
    const contactsByColumn: Record<string, any[]> = {};

    // Inicializar todas as colunas (incluindo null para "sem coluna")
    contactsByColumn['null'] = [];
    for (const column of columns) {
      contactsByColumn[column.id] = [];
    }

    // Buscar contatos com filtros
    const contacts = await prisma.contact.findMany({
      where,
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { select: { id: true, name: true, color: true } },
      },
    });

    // Agrupar por coluna
    for (const contact of contacts) {
      const columnId = contact.kanbanColumnId || 'null';
      if (contactsByColumn[columnId]) {
        contactsByColumn[columnId].push(contact);
      } else {
        // Contato em coluna inativa vai para "sem coluna"
        contactsByColumn['null'].push(contact);
      }
    }

    return reply.send({
      columns,
      contactsByColumn,
      totalContacts: contacts.length,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao buscar contatos',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/kanban/contacts/:id/move
 * Mover contato para outra coluna
 */
export async function moveContact(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.user.organizationId;
    const { columnId } = moveContactSchema.parse(req.body);

    // Verificar se contato existe
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Verificar se coluna destino existe (se não for null)
    if (columnId) {
      const column = await prisma.kanbanColumn.findFirst({
        where: { id: columnId, organizationId, isActive: true },
      });

      if (!column) {
        return reply.status(404).send({ error: 'Coluna não encontrada' });
      }
    }

    // Atualizar contato
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { kanbanColumnId: columnId },
      include: {
        tags: { select: { id: true, name: true, color: true } },
      },
    });

    return reply.send(updatedContact);
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao mover contato',
      message: error.message,
    });
  }
}

/**
 * POST /api/kanban/columns/setup-defaults
 * Criar colunas padrão para organização (se não existirem)
 */
export async function setupDefaultColumns(req: FastifyRequest, reply: FastifyReply) {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return reply.status(400).send({ error: 'OrganizationId não encontrado' });
    }

    // Verificar se já existem colunas
    const existingCount = await prisma.kanbanColumn.count({
      where: { organizationId },
    });

    if (existingCount > 0) {
      return reply.status(400).send({
        error: 'Colunas já existem',
        message: 'Já existem colunas configuradas para esta organização',
      });
    }

    // Criar colunas padrão
    const columns = await prisma.$transaction(
      DEFAULT_COLUMNS.map((col) =>
        prisma.kanbanColumn.create({
          data: {
            ...col,
            organizationId,
          },
        })
      )
    );

    return reply.status(201).send({
      success: true,
      message: 'Colunas padrão criadas',
      columns,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: 'Erro ao criar colunas padrão',
      message: error.message,
    });
  }
}
